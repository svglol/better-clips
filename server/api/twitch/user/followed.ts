import type { UserSession } from '#auth-utils'

export default defineCachedEventHandler(async (event) => {
  await refreshTwitchoAuthToken(event)
  const session = await getUserSession(event)

  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const allChannels = await getFollowedChannels(session)
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

    const fetchPromise = fetchFromTwitchAPI<TwitchUser>(`/users`, params) as Promise<TwitchAPIResponse<TwitchUser>>
    batchedRequests.push(fetchPromise)
  }

  const allResponses = await Promise.all(batchedRequests)
  const allFetchedData = allResponses.flatMap(response => response.data ?? [])

  const reorderedFetchedData = allChannels.map((channel) => {
    return allFetchedData.find(fetchedChannel => fetchedChannel.id === channel.broadcaster_id)
  }).filter(Boolean)

  return reorderedFetchedData
}, { maxAge: 60 * 60 })

async function getFollowedChannels(session: UserSession, cursor?: string): Promise<TwitchFollowedChannel[]> {
  const allChannels: TwitchFollowedChannel[] = []
  const params = new URLSearchParams()
  params.append('user_id', String(session.user?.id ?? ''))
  params.append('first', '100')
  if (cursor) {
    params.append('after', cursor)
  }

  try {
    const { data, pagination } = await $fetch<TwitchAPIResponse<TwitchFollowedChannel>>(`https://api.twitch.tv/helix/channels/followed?${params}`, {
      method: 'GET',
      headers: {
        'Client-ID': useRuntimeConfig().twitchClientId,
        'Authorization': `Bearer ${session.user?.token.access_token}`,
      },
    })

    allChannels.push(...data)

    if (pagination?.cursor) {
      const newChannels = await getFollowedChannels(session, pagination.cursor)
      allChannels.push(...newChannels)
    }
  }
  catch (error) {
    console.error('Error fetching followed channels:', error)
    return []
  }

  return allChannels
}
