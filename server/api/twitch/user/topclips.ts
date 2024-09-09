import type { H3Event } from 'h3'
import { sub } from 'date-fns'

export const getTopClipsFromChannel = defineCachedFunction(async (params: URLSearchParams) => {
  try {
    const response = await fetchFromTwitchAPI<TwitchClip[]>('/clips', params)
    return response.data.flat()
  }
  catch (error) {
    console.error(`Error fetching clips for channel ${params}:`, error)
    return []
  }
}, {
  maxAge: 60 * 60,
  name: 'top-clips-from-channel',
  getKey: (params: URLSearchParams) => String(params),
})

export default defineCachedEventHandler(async (event) => {
  await refreshTwitchoAuthToken(event)
  const session = await getUserSession(event)

  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const followedChannels = await getFollowedChannels(session)
  let allClips = await getAllClipsFromFollowedChannels(followedChannels)
  allClips = allClips.sort((a, b) => b.view_count - a.view_count)
  allClips = allClips.slice(0, 18)
  return allClips
}, {
  maxAge: 60 * 60,
  name: 'topclips',
  getKey: async (event: H3Event) => String((await getUserSession(event)).user?.id),
})

async function getAllClipsFromFollowedChannels(channels: TwitchFollowedChannel[]) {
  const clipPromises = channels.map(async (channel) => {
    const params = new URLSearchParams()
    params.append('broadcaster_id', channel.broadcaster_id)
    params.append('first', '5')
    params.append('started_at', sub(new Date(), { hours: 24 }).toISOString())
    return getTopClipsFromChannel(params)
  })

  const clipsArrays = await Promise.all(clipPromises)
  return clipsArrays.flat()
}
