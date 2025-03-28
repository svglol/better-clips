import type { H3Event } from 'h3'
import { hash } from 'ohash'

const fetchVideoUrl = cachedFunction(async (event: H3Event, id: string) => {
  const data = [
    {
      operationName: 'ClipsDownloadButton',
      variables: { slug: id },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: '6e465bb8446e2391644cf079851c0cb1b96928435a240f07ed4b240f0acc6f1b',
        },
      },
    },
  ]

  try {
    const resp = await $fetch<{ data: { clip: { playbackAccessToken: { signature: string, value: string }, videoQualities: { sourceURL: string }[] } } }[]>(
      'https://gql.twitch.tv/gql',
      {
        method: 'POST',
        headers: {
          'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
        },
        body: data,
      },
    )

    const [respData] = resp
    if (!respData || !respData.data || !respData.data.clip || !respData.data.clip.videoQualities[0])
      throw createError({ statusCode: 404, statusMessage: 'Clip not found' })

    const playbackAccessToken = respData.data.clip.playbackAccessToken
    return `${respData.data.clip.videoQualities[0].sourceURL}?sig=${playbackAccessToken.signature}&token=${encodeURIComponent(playbackAccessToken.value)}`
  }
  catch (error) {
    console.error('Failed to fetch Twitch clip video', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch Twitch clip video' })
  }
}, {
  maxAge: 60 * 60 * 1,
  name: 'twitch-video',
  swr: false,
  getKey: async (event: H3Event, id: string) => hash({ id, token: { access_token: await getUserToken(event) ?? await getTwitchToken(event) } }),
})

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  return fetchVideoUrl(event, id)
})
