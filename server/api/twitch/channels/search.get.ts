import { z } from 'zod'

const querySchema = z.object({
  query: z.string().optional(),
  live_only: z.string().optional(),
  first: z.string().default('20'),
  after: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const params = new URLSearchParams({
    first: query.first,
  })
  if (query.query) {
    params.append('query', query.query)
  }
  if (query.after) {
    params.append('after', query.after)
  }
  if (query.live_only) {
    params.append('live_only', query.live_only)
  }

  const data = await fetchFromTwitchAPI<TwitchChannel>(event, `/search/channels`, params)
  const queryLower = query.query?.toLowerCase() ?? ''

  const filteredData = data.data.filter(channel => channel.title !== '')

  const sortedData = filteredData.sort((a, b) => {
    const aName = a.display_name.toLowerCase()
    const bName = b.display_name.toLowerCase()

    const aPerfectMatch = aName === queryLower
    const bPerfectMatch = bName === queryLower

    if (aPerfectMatch && !bPerfectMatch)
      return -1
    if (!aPerfectMatch && bPerfectMatch)
      return 1

    return bName.indexOf(queryLower) - aName.indexOf(queryLower)
  })

  return { ...data, data: sortedData }
})
