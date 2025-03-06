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
    return { data: [], success: false } as TwitchAPIResponse<T>
  }
}, {
  maxAge: 60 * 15,
  name: 'twitch-api',
  swr: false,
  getKey: async (event: H3Event, endpoint: string, params: URLSearchParams) => hash({ endpoint, params: params.toString(), token: { access_token: await getUserToken(event) ?? await getTwitchToken() } }),
  shouldBypassCache: value => value.success === true,
})

export async function getTwitchToken() {
  const tokenData = await useStorage('data').getItem('twitchToken') as TwitchToken
  const currentTime = Math.floor(Date.now() / 1000)
  const isTokenValid = tokenData
    && tokenData.expires_at
    && currentTime < tokenData.expires_at

  if (isTokenValid) {
    return tokenData.access_token
  }

  const newTokenData = await getToken()
  const expiresAt = Math.floor(Date.now() / 1000) + newTokenData.expires_in
  const tokenToStore = {
    ...newTokenData,
    expires_at: expiresAt,
  }
  await useStorage('data').setItem('twitchToken', tokenToStore, { expires: newTokenData.expires_in })
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
  if (session.secure?.token) {
    const now = new Date()
    const expirationDate = new Date(session.secure.token.expires_at)

    const isValid = await validateToken(event, session.secure.token.access_token)
    if (isValid) {
      return session.secure.token
    }
    else if (!isValid || expirationDate < now) {
      const storage = useStorage('data')
      const isRefreshing = await storage.getItem(`isRefreshing:${session.user?.id}`) || false

      if (!isRefreshing) {
        await storage.setItem(`isRefreshing:${session.user?.id}`, true, { expires: 60 })
        try {
          const body = new URLSearchParams()
          body.append('client_id', useRuntimeConfig().twitchClientId)
          body.append('client_secret', useRuntimeConfig().twitchClientSecret)
          body.append('refresh_token', session.secure.token.refresh_token ?? '')
          body.append('grant_type', 'refresh_token')

          const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            body: body.toString(),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          })
          if (data && session.user) {
            await setUserSession(event, {
              user: session.user,
              loggedInAt: Date.now(),
              secure: {
                token: {
                  access_token: data.access_token,
                  refresh_token: data.refresh_token,
                  expires_at: Date.now() + (data.expires_in * 1000),
                },
              },
            })
            return session.secure.token
          }
          else {
            await clearUserSession(event)
            return null
          }
        }
        catch (error) {
          console.error('Error refreshing oAuth token:', error)
          await clearUserSession(event)
          return null
        }
        finally {
          await storage.setItem(`isRefreshing:${session.user?.id}`, false, { expires: 60 })
        }
      }
      else {
        let retries = 0
        const maxRetries = 100
        while (await storage.getItem(`isRefreshing:${session.user?.id}`) && retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 100))
          retries++
        }

        if (retries >= maxRetries) {
          await storage.removeItem(`isRefreshing:${session.user?.id}`)
          throw new Error('Timeout: Unable to refresh the session.')
        }

        const updatedSession = await getUserSession(event)
        if (updatedSession.secure?.token)
          return updatedSession.secure.token
        else
          return null
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
  maxAge: 60,
  name: 'followed-channels',
  swr: false,
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
