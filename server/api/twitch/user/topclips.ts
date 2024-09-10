import type { H3Event } from 'h3'
import { sub } from 'date-fns'

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
  allClips = allClips.sort((a, b) => b.view_count - a.view_count)
  allClips = allClips.filter(clip => clip.view_count > 50)

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
    params.append('started_at', sub(new Date(), { hours: 24 }).toISOString())
    return getTopClipsFromChannel(params)
  })

  const clipsArrays = await Promise.all(clipPromises)
  return clipsArrays.flat()
}
