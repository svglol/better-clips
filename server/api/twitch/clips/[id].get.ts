export default defineCachedEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id)
    return createError({ statusCode: 400, statusMessage: 'Missing id' })

  const token = await refreshTwitchoAuthToken(event)
  const params = new URLSearchParams({ id })

  return fetchFromTwitchAPI<TwitchClip[]>('/clips', params, token?.access_token)
}, { maxAge: 60 * 60 })
