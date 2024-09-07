export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    return createError({ statusCode: 400, statusMessage: 'Missing id' })

  const params = new URLSearchParams({ id })

  return fetchFromTwitchAPI<TwitchClip[]>('/clips', params)
})
