import type { UserSession } from '#auth-utils'
import type { H3Event } from 'h3'
import { differenceInMinutes, sub } from 'date-fns'
import pLimit from 'p-limit'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('50'),
})

type QuerySchema = z.infer<typeof querySchema>

const getAllClipsFromFollowedChannels = defineCachedFunction(async (event: H3Event, session: UserSession) => {
  try {
    const channels = await getFollowedChannels(event, session)

    const now = new Date()
    const minutes = now.getMinutes()
    now.setMinutes(minutes < 30 ? 0 : 30, 0, 0)
    const limit = pLimit(25)
    const clips = await Promise.all(
      channels.map(channel =>
        limit(async () => {
          const params = new URLSearchParams({
            broadcaster_id: channel.broadcaster_id,
            first: '20',
            started_at: sub(now, { hours: 24 }).toISOString(),
          })

          const response = await fetchFromTwitchAPI<TwitchClip>(event, '/clips', params)
          return response.data
        }),
      ),
    )
    const filteredClips = clips.flat().filter(clip => clip.view_count > 50)

    const today = new Date()
    const maxMinutesSince = Math.max(...filteredClips.map(clip => differenceInMinutes(today, new Date(clip.created_at))))

    const calculateScore = (clip: TwitchClip) => {
      const views = Math.log10(clip.view_count + 1)
      const daysSince = differenceInMinutes(today, new Date(clip.created_at))
      const recency = daysSince === 0 ? 1 : (maxMinutesSince - daysSince) / maxMinutesSince
      return (0.4 * views) + (0.6 * recency)
    }

    return filteredClips.sort((a, b) => {
      return calculateScore(b) - calculateScore(a)
    })
  }
  catch (error) {
    console.error('Error fetching clips:', error)
    return []
  }
}, {
  name: 'top-clips',
  maxAge: 60 * 15,
  swr: false,
  getKey: (event: H3Event, session: UserSession) => String(session.user?.id),
})

export default defineEventHandler<{ query: QuerySchema }>(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const page = Number(query.page)
  const limit = Number(query.limit)
  const session = await getUserSession(event)
  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const allClips = await getAllClipsFromFollowedChannels(event, session as UserSession)

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
