import type { H3Event } from 'h3'
import { hash } from 'ohash'
import { z } from 'zod'

const querySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  igdb_id: z.string().min(1).optional(),
}).refine(
  data => data.id !== undefined || data.name !== undefined || data.igdb_id !== undefined,
  {
    message: 'Either id, name or igdb_id must be provided',
    path: ['id', 'name', 'igdb_id'],
  },
)

type QuerySchema = z.infer<typeof querySchema>

export default defineCachedEventHandler<{ query: QuerySchema }>(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const params = new URLSearchParams()
  if (query.id) {
    params.append('id', query.id)
  }
  if (query.name) {
    params.append('name', query.name)
  }
  if (query.igdb_id) {
    params.append('igdb_id', query.igdb_id)
  }
  return await fetchFromTwitchAPI<TwitchGame>(event, `/games`, params)
}, {
  maxAge: 60 * 60 * 24,
  name: 'twitch-game',
  getKey: async (event: H3Event) => hash({ query: await getValidatedQuery(event, querySchema.parse), user: await getUserSession(event) }),
})
