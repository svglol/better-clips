import type { UserSession } from '#auth-utils'
import type { H3Event } from 'h3'
import { hash } from 'ohash'

export default defineCachedEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const allChannels = await getFollowedChannels(event, session as UserSession)
  allChannels.push({
    broadcaster_id: String(session.user?.id ?? ''),
    broadcaster_name: session.user?.login ?? '',
    broadcaster_login: session.user?.login ?? '',
    followed_at: new Date().toISOString(),
  })

  const batchSize = 100
  const batchedRequests = []

  for (let i = 0; i < allChannels.length; i += batchSize) {
    const currentBatch = allChannels.slice(i, i + batchSize)
    const params = new URLSearchParams()

    currentBatch.forEach((channel) => {
      params.append('id', channel.broadcaster_id)
    })

    const fetchPromise = fetchFromTwitchAPI<TwitchUser>(event, `/users`, params) as Promise<TwitchAPIResponse<TwitchUser>>
    batchedRequests.push(fetchPromise)
  }

  const allResponses = await Promise.all(batchedRequests)
  const allFetchedData = allResponses.flatMap(response => response.data ?? [])

  const reorderedFetchedData = allChannels.map((channel) => {
    return allFetchedData.find(fetchedChannel => fetchedChannel.id === channel.broadcaster_id)
  }).filter(Boolean)

  return reorderedFetchedData
}, {
  maxAge: 60 * 60,
  name: 'followed',
  swr: false,
  getKey: async (event: H3Event) => hash(String((await getUserSession(event)).user?.id)),
})
