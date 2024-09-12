import type { H3Event } from 'h3'
import { hash } from 'ohash'
import { differenceInMinutes, sub } from 'date-fns'
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

export const getAllClipsFromFollowedChannels = defineCachedFunction(async (session: UserSession) => {
  const channels = await getFollowedChannels(session)
  const clipPromises = channels.map(async (channel) => {
    const params = new URLSearchParams()
    params.append('broadcaster_id', channel.broadcaster_id)
    params.append('first', '5')

    const now = new Date()
    now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0)

    const endedAt = now.toISOString()
    params.append('ended_at', endedAt)

    const startedAt = sub(now, { hours: 24 })
    startedAt.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0)
    params.append('started_at', startedAt.toISOString())
    const response = await fetchFromTwitchAPI<TwitchClip[]>('/clips', params, session.user?.token.access_token)
    return response.data.flat()
  })

  const clipsArrays = await Promise.all(clipPromises)
  let clips = clipsArrays.flat()
  clips = clips.filter(clip => clip.view_count > 50)

  const maxMinutesSince = Math.max(...clips.map(clip => differenceInMinutes(new Date(), new Date(clip.created_at))))
  const weightViews = 0.4
  const weightRecency = 0.6

  const today = new Date()

  clips = clips.sort((a, b) => {
    const viewsA = Math.log10(a.view_count + 1)
    const viewsB = Math.log10(b.view_count + 1)

    const daysSinceA = differenceInMinutes(today, new Date(a.created_at))
    const daysSinceB = differenceInMinutes(today, new Date(b.created_at))

    const recencyA = daysSinceA === 0 ? 1 : (maxMinutesSince - daysSinceA) / maxMinutesSince
    const recencyB = daysSinceB === 0 ? 1 : (maxMinutesSince - daysSinceB) / maxMinutesSince

    const scoreA = (weightViews * viewsA) + (weightRecency * recencyA)
    const scoreB = (weightViews * viewsB) + (weightRecency * recencyB)

    return scoreB - scoreA
  })

  return clips.flat()
}, {
  name: 'top-clips',
  maxAge: 60 * 60,
  getKey: (session: UserSession) => String(session.user?.id) ?? '',
})
