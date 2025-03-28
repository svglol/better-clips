import type { UserSession } from '#auth-utils'
import type { H3Event } from 'h3'
import { hash } from 'ohash'

export const fetchFromTwitchAPI = cachedFunction(async <T>(event: H3Event, endpoint: string, params: URLSearchParams) => {
  const userToken = await getUserToken(event)
  let token = userToken?.access_token
  if (!token) {
    token = await getTwitchToken(event)
  }
  const url = `https://api.twitch.tv/helix${endpoint}?${params}`
  const data = await $fetch<TwitchAPIResponse<T>>(url, {
    headers: {
      'Client-ID': useRuntimeConfig().twitchClientId,
      'Authorization': `Bearer ${token}`,
    },
  })
  return { ...data, success: true }
}, {
  maxAge: 60 * 15,
  name: 'twitch-api',
  swr: false,
  getKey: async (event: H3Event, endpoint: string, params: URLSearchParams) => hash({ endpoint, params: params.toString(), token: { access_token: await getUserToken(event) ?? await getTwitchToken(event) } }),
})

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
  maxAge: 60 * 60,
  swr: false,
  name: 'validate-token',
  getKey: (event: H3Event, accessToken: string) => hash(accessToken),
})

export async function getTwitchToken(event: H3Event) {
  const tokenData = await useStorage('data').getItem('twitchToken') as TwitchToken
  const currentTime = Math.floor(Date.now() / 1000)
  const isTokenValid = tokenData
    && tokenData.expires_at
    && currentTime < tokenData.expires_at

  if (isTokenValid && await validateToken(event, tokenData.access_token)) {
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

export async function getUserToken(event: H3Event) {
  const session = await getUserSession(event)
  if (!session.secure?.token) {
    await clearUserSession(event)
    return null
  }

  const now = new Date()
  const expirationDate = new Date(session.secure.token.expires_at)

  if (expirationDate > now) {
    const isValid = await validateToken(event, session.secure.token.access_token)
    if (isValid)
      return session.secure.token
  }

  try {
    const body = new URLSearchParams({
      client_id: useRuntimeConfig().twitchClientId,
      client_secret: useRuntimeConfig().twitchClientSecret,
      refresh_token: session.secure.token.refresh_token ?? '',
      grant_type: 'refresh_token',
    })

    const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>(
      'https://id.twitch.tv/oauth2/token',
      { method: 'POST', body: body.toString(), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )

    if (!data || !session.user)
      throw new Error('Failed to refresh token')

    await setUserSession(event, {
      user: session.user,
      loggedInAt: Date.now(),
      secure: {
        token: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: Date.now() + data.expires_in * 1000,
        },
      },
    })

    return data
  }
  catch (error) {
    console.error('Error refreshing oAuth token:', error)
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
    const response = await fetchFromTwitchAPI<TwitchFollowedChannel>(event, `/channels/followed`, params)
    if (!response) {
      throw new Error('Failed to fetch followed channels')
    }
    const { data, pagination } = response
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
