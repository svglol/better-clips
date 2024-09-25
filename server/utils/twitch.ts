import type { UserSession } from '#auth-utils'
import type { H3Event } from 'h3'
import { hash } from 'ohash'

export const fetchFromTwitchAPI = defineCachedFunction(async <T>(event: H3Event, endpoint: string, params: URLSearchParams) => {
  const userToken = await getUserToken(event)
  let token = userToken?.access_token
  try {
    if (!token) {
      token = await getTwitchToken()
    }
    const url = `https://api.twitch.tv/helix${endpoint}?${params}`
    const data = await $fetch<TwitchAPIResponse<T>>(url, {
      headers: {
        'Client-ID': useRuntimeConfig().twitchClientId,
        'Authorization': `Bearer ${token}`,
      },
    })
    return data
  }
  catch (error) {
    console.error(`Error fetching from Twitch API: ${error}`)
    return { data: [] }
  }
}, {
  maxAge: 60 * 60,
  name: 'twitch-api',
  swr: false,
  getKey: (event: H3Event, endpoint: string, params: URLSearchParams) => hash({ endpoint, params: params.toString() }),
})

export async function getTwitchToken() {
  const token = await useStorage('data').getItem('twitchToken') as TwitchToken
  if (token)
    return token.access_token

  const tokenData = await getToken()
  await useStorage('data').setItem('twitchToken', tokenData, { expires: tokenData.expires_in })
  return tokenData.access_token
}

async function getToken() {
  const data = await $fetch<TwitchToken>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: `client_id=${useRuntimeConfig().twitchClientId}&client_secret=${useRuntimeConfig().twitchClientSecret}&grant_type=client_credentials`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return data
}

const validateToken = defineCachedFunction(async (event: H3Event, accessToken: string) => {
  try {
    const response = await $fetch('https://id.twitch.tv/oauth2/validate', {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    })
    return !!response
  }
  catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}, {
  maxAge: 60,
  swr: false,
  name: 'validate-token',
  getKey: (event: H3Event, accessToken: string) => hash(accessToken),
})

export async function getUserToken(event: H3Event) {
  const session = await getUserSession(event)
  if (session.token) {
    const now = new Date()
    const expirationDate = new Date(session.token.expires_at)

    const isValid = await validateToken(event, session.token.access_token)

    if (!isValid || expirationDate < now) {
      const storage = useStorage('data')
      const isRefreshing = await storage.getItem(`isRefreshing:${session.user?.id}`) || false

      if (!isRefreshing) {
        await storage.setItem(`isRefreshing:${session.user?.id}`, true)
        try {
          const body = new URLSearchParams()
          body.append('client_id', useRuntimeConfig().twitchClientId)
          body.append('client_secret', useRuntimeConfig().twitchClientSecret)
          body.append('refresh_token', session.token.refresh_token ?? '')
          body.append('grant_type', 'refresh_token')

          const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: body.toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
          if (data && session.user) {
            session.token.expires_at = Date.now() + (data.expires_in * 1000)
            session.token.refresh_token = data.refresh_token
            session.token.access_token = data.access_token
            await setUserSession(event, session)
            return session.token
          }
          else {
            await clearUserSession(event)
            return null
          }
        }
        catch (error) {
          console.error('Error refreshing oAuth token:', error)
          await clearUserSession(event)
        }
        finally {
          await storage.setItem(`isRefreshing:${session.user?.id}`, false)
        }
      }
      else {
        while (await storage.getItem(`isRefreshing:${session.user?.id}`)) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        const updatedSession = await getUserSession(event)
        return updatedSession.token
      }
    }
  }
  else {
    await clearUserSession(event)
    return null
  }
}

export const getFollowedChannels = defineCachedFunction(async (event: H3Event, session: UserSession) => {
  return fetchFollowedChannels(event, session)
}, {
  maxAge: 60 * 60,
  name: 'followed-channels',
  getKey: (event: H3Event, session: UserSession) => String(session.user?.id) ?? '',
})

async function fetchFollowedChannels(event: H3Event, session: UserSession, cursor?: string): Promise<TwitchFollowedChannel[]> {
  const allChannels: TwitchFollowedChannel[] = []
  const params = new URLSearchParams()
  params.append('user_id', String(session.user?.id ?? ''))
  params.append('first', '100')
  if (cursor) {
    params.append('after', cursor)
  }

  try {
    const { data, pagination } = await fetchFromTwitchAPI<TwitchFollowedChannel>(event, `/channels/followed`, params)
    allChannels.push(...data)

    if (pagination?.cursor) {
      const newChannels = await fetchFollowedChannels(event, session, pagination.cursor)
      allChannels.push(...newChannels)
    }
  }
  catch (error) {
    console.error('Error fetching followed channels:', error)
    return []
  }

  return allChannels
}
