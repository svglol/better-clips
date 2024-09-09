import type { H3Event } from 'h3'

export default defineCachedEventHandler(async (event) => {
  await refreshTwitchoAuthToken(event)
  const session = await getUserSession(event)

  if (!session.user) {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return []
}, {
  maxAge: 1,
  getKey: async (event: H3Event) => String(`topclips-${(await getUserSession(event)).user?.id}`),
})
