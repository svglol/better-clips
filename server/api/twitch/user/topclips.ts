import { z } from 'zod'
import { differenceInMinutes, sub } from 'date-fns'
import type { H3Event } from 'h3'
import type { UserSession } from '#auth-utils'

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('50'),
})

const getClipsInLastMonth = defineCachedFunction(async (event: H3Event, userId: string) => {
  try {
    const date = new Date()
    date.setMonth(date.getMonth() - 1)
    const params = new URLSearchParams()
    params.append('broadcaster_id', userId)
    params.append('started_at', date.toISOString())
    params.append('ended_at', new Date().toISOString())
    params.append('first', '1')
    const clips = await fetchFromTwitchAPI<TwitchClip>(event, `/clips`, params)
    if (clips.data.length > 0) {
      return true
    }
    return false
  }
  catch (error) {
    console.error('Error:', error)
    return 'An error occurred while fetching data'
  }
}, {
  maxAge: 60 * 60 * 24,
  name: 'clip-in-last-month',
  swr: false,
  getKey: (event: H3Event, userId: string) => userId,
})

const getAllClipsFromFollowedChannels = defineCachedFunction(async (event: H3Event, session: UserSession) => {
  try {
    const channels = await getFollowedChannels(event, session)
    const channelsPromises = channels.map(async (channel) => {
      const lastBroadcast = await getClipsInLastMonth(event, channel.broadcaster_id)
      return {
        ...channel,
        broadcastInLastMonth: lastBroadcast,
      }
    })
    const channelsLastMonth = (await Promise.all(channelsPromises)).filter(channel => channel.broadcastInLastMonth)
    const clipPromises = channelsLastMonth.map(async (channel) => {
      const params = new URLSearchParams()
      params.append('broadcaster_id', channel.broadcaster_id)
      params.append('first', '20')

      const now = new Date()
      now.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0)

      const endedAt = now.toISOString()
      params.append('ended_at', endedAt)

      const startedAt = sub(now, { hours: 24 })
      startedAt.setMinutes(now.getMinutes() >= 30 ? 30 : 0, 0, 0)
      params.append('started_at', startedAt.toISOString())

      const response = await fetchFromTwitchAPI<TwitchClip>(event, '/clips', params)
      return response.data
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
    return clips
  }
  catch (error) {
    console.error('Error fetching clips:', error)
    return []
  }
}, {
  name: 'top-clips',
  maxAge: 60 * 60,
  swr: false,
  getKey: (event: H3Event, session: UserSession) => String(session.user?.id),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const page = Number(query.page)
  const limit = Number(query.limit)
  const session = await getUserSession(event)
  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const allClips = await getAllClipsFromFollowedChannels(event, session)

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
})
