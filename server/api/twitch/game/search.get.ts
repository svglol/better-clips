import { z } from 'zod'

const querySchema = z.object({
  query: z.string().optional(),
  first: z.string().default('100'),
  after: z.string().optional(),
})

type QuerySchema = z.infer<typeof querySchema>

export default defineEventHandler<{ query: QuerySchema }>(async (event) => {
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
  return await fetchFromTwitchAPI<TwitchCategory>(event, `/search/categories`, params)
})
