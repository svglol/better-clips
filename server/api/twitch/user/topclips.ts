import { differenceInMinutes, sub } from 'date-fns'
import { z } from 'zod'
import type { UserSession } from '#auth-utils'

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('50'),
})

const getAllClipsFromFollowedChannels = defineCachedFunction(async (channels: TwitchFollowedChannel[], session: UserSession) => {
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

  return clips
}, {
  name: 'clips-from-followed-channels',
  maxAge: 60 * 60,
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const page = Number(query.page)
  const limit = Number(query.limit)
  await refreshTwitchoAuthToken(event)
  const session = await getUserSession(event)
  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const followedChannels = await getFollowedChannels(session)
  const allClips = await getAllClipsFromFollowedChannels(followedChannels, session)

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
