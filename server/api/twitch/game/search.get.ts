import { z } from 'zod'

const querySchema = z.object({
  query: z.string().optional(),
  first: z.string().default('100'),
  after: z.string().optional(),
})

export default defineCachedEventHandler(async (event) => {
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
  return await fetchFromTwitchAPI<TwitchCategory>(`/search/categories`, params)
}, { maxAge: 60 * 60 * 24 })
