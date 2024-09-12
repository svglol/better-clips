import { z } from 'zod'

const querySchema = z.object({
  page: z.string().default('1'),
  limit: z.string().default('50'),
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
  const allClips = await getAllClipsFromFollowedChannels(session)

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
