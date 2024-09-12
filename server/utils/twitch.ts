import type { H3Event } from 'h3'
import { hash } from 'ohash'
import type { UserSession } from '#auth-utils'

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

export async function getUserToken(event: H3Event) {
  const session = await getUserSession(event)
  if (!session.user) {
    return null
  }
  return session.user.token
}

export const getFollowedChannels = defineCachedFunction(async (event: H3Event, session: UserSession) => {
  return fetchFollowedChannels(session)
}, {
  maxAge: 60 * 60,
  name: 'followed-channels',
  getKey: (event: H3Event, session: UserSession) => String(session.user?.id) ?? '',
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
