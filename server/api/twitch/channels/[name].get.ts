export default defineCachedEventHandler(async (event) => {
  const username = getRouterParam(event, 'name')
  if (!username)
    return createError({ statusCode: 400, statusMessage: 'Missing username' })
  const params = new URLSearchParams({
    login: username,
  })
  return await fetchFromTwitchAPI<TwitchUser>(`/users`, params)
}, { maxAge: 60 * 60 * 24, name: 'channel', getKey: async (event) => {
  const username = getRouterParam(event, 'name')
  return username ?? ''
} })
