import { z } from 'zod'

const querySchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  igdb_id: z.string().optional(),
}).refine(
  data => data.id !== undefined || data.name !== undefined || data.igdb_id !== undefined,
  {
    message: 'Either id, name or igdb_id must be provided',
    path: ['id', 'name', 'igdb_id'],
  },
)

export default defineCachedEventHandler(async (event) => {
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
  return await fetchFromTwitchAPI<TwitchGame>(`/games`, params)
}, { maxAge: 60 * 60 * 24 })
