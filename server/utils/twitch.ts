import type { H3Event } from 'h3'
import { hash } from 'ohash'
import type { UserSession } from '#auth-utils'

export const fetchFromTwitchAPI = defineCachedFunction(async <T>(endpoint: string, params: URLSearchParams, token?: string) => {
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
  getKey: (endpoint: string, params: URLSearchParams) => hash({ endpoint, params: params.toString() }),
})

export async function getTwitchToken() {
  const token = await useStorage('cache').getItem('twitchToken') as TwitchToken
  if (token)
    return token.access_token

  const tokenData = await getToken()
  await useStorage('cache').setItem('twitchToken', tokenData, { expires: tokenData.expires_in })
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

export async function refreshTwitchoAuthToken(event: H3Event) {
  const session = await getUserSession(event)
  if (!session.user) {
    return null
  }
  if ((session.loggedInAt + (session.user.token.expires_in * 1000)) < Date.now()) {
    const body = new URLSearchParams()
    body.append('client_id', useRuntimeConfig().twitchClientId)
    body.append('client_secret', useRuntimeConfig().twitchClientSecret)
    body.append('refresh_token', session.user?.token.refresh_token ?? '')
    body.append('grant_type', 'refresh_token')
    try {
      const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        body: body.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
      if (data && session.user) {
        await setUserSession(event, {
          user: {
            id: session.user.id,
            login: session.user.login,
            profile_image_url: session.user.profile_image_url,
            token: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
              expires_in: data.expires_in,
            },
          },
          loggedInAt: Date.now(),
        })
      }
      else {
        await clearUserSession(event)
      }
    }
    catch (error) {
      console.error('Error refreshing oAuth token:', error)
      await clearUserSession(event)
    }
  }
  return (await getUserSession(event)).user?.token
}

export const getFollowedChannels = defineCachedFunction(async (session: UserSession) => {
  return fetchFollowedChannels(session)
}, {
  maxAge: 60 * 60,
  name: 'followed-channels',
  getKey: (session: UserSession) => String(session.user?.id) ?? '',
})

export async function fetchFollowedChannels(session: UserSession, cursor?: string): Promise<TwitchFollowedChannel[]> {
  const allChannels: TwitchFollowedChannel[] = []
  const params = new URLSearchParams()
  params.append('user_id', String(session.user?.id ?? ''))
  params.append('first', '100')
  if (cursor) {
    params.append('after', cursor)
  }

  try {
    const { data, pagination } = await $fetch<TwitchAPIResponse<TwitchFollowedChannel>>(`https://api.twitch.tv/helix/channels/followed?${params}`, {
      method: 'GET',
      headers: {
        'Client-ID': useRuntimeConfig().twitchClientId,
        'Authorization': `Bearer ${session.user?.token.access_token}`,
      },
    })

    allChannels.push(...data)

    if (pagination?.cursor) {
      const newChannels = await fetchFollowedChannels(session, pagination.cursor)
      allChannels.push(...newChannels)
    }
  }
  catch (error) {
    console.error('Error fetching followed channels:', error)
    return []
  }

  return allChannels
}
