export default defineEventHandler(async (event) => {
  const username = getRouterParam(event, 'name')
  if (!username)
    return createError({ statusCode: 400, statusMessage: 'Missing username' })
  const params = new URLSearchParams({
    login: username,
  })
  return await fetchFromTwitchAPI<TwitchUser>(event, `/users`, params)
})
