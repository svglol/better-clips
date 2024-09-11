import type { H3Event } from 'h3'
import { differenceInMinutes, sub } from 'date-fns'

import { z } from 'zod'

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

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('50'),
})

export default defineCachedEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const page = Number(query.page)
  const limit = Number(query.limit)
  await refreshTwitchoAuthToken(event)
  const session = await getUserSession(event)

  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const followedChannels = await getFollowedChannels(session)
  let allClips = await getAllClipsFromFollowedChannels(followedChannels)
  allClips = allClips.filter(clip => clip.view_count > 50)

  const maxMinutesSince = Math.max(...allClips.map(clip => differenceInMinutes(new Date(), new Date(clip.created_at))))
  const weightViews = 0.4
  const weightRecency = 0.6

  const today = new Date()

  allClips = allClips.sort((a, b) => {
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
  const totalClips = allClips.length
  const totalPages = Math.ceil(totalClips / limit)
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  const paginatedClips = allClips.slice(startIndex, endIndex)

  const paginationMeta = {
    currentPage: query.page,
    totalPages,
    totalClips,
    limit: query.limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }

  return {
    clips: paginatedClips,
    pagination: paginationMeta,
  }
}, {
  maxAge: 60 * 60,
  name: 'topclips',
  getKey: async (event: H3Event) => {
    const session = await getUserSession(event)
    const query = await getValidatedQuery(event, querySchema.parse)
    return `${session.user?.id}-${query.limit}-${query.page}`
  },
})

async function getAllClipsFromFollowedChannels(channels: TwitchFollowedChannel[]) {
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
    return getTopClipsFromChannel(params)
  })

  const clipsArrays = await Promise.all(clipPromises)
  return clipsArrays.flat()
}
