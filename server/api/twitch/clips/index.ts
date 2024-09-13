import { z } from 'zod'

const querySchema = z.object({
  broadcaster_id: z.string().optional(),
  game_id: z.string().optional(),
  first: z.string().default('50'),
  after: z.string().optional(),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
}).refine(
  data => data.broadcaster_id !== undefined || data.game_id !== undefined,
  {
    message: 'Either broadcaster_id or game_id must be provided',
    path: ['broadcaster_id', 'game_id'],
  },
)

type QuerySchema = z.infer<typeof querySchema>

export default defineEventHandler<{ query: QuerySchema }>(async (event) => {
  const query = await getValidatedQuery(event, querySchema.parse)
  const params = new URLSearchParams()
  if (query.broadcaster_id) {
    params.append('broadcaster_id', query.broadcaster_id)
  }
  if (query.game_id) {
    params.append('game_id', query.game_id)
  }
  params.append('first', query.first)
  if (query.after) {
    params.append('after', query.after)
  }
  if (query.started_at) {
    params.append('started_at', query.started_at)
  }
  if (query.ended_at) {
    params.append('ended_at', query.ended_at)
  }
  return fetchFromTwitchAPI<TwitchClip[]>(event, '/clips', params)
})
