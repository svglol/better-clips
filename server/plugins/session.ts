export default defineNitroPlugin(() => {
  sessionHooks.hook('fetch', async (session, event) => {
    const now = new Date()
    if (!session.token) {
      await clearUserSession(event)
      return
    }
    const expirationDate = new Date(session.token.expires_at)

    if (expirationDate < now) {
      const body = new URLSearchParams()
      body.append('client_id', useRuntimeConfig().twitchClientId)
      body.append('client_secret', useRuntimeConfig().twitchClientSecret)
      body.append('refresh_token', session.token.refresh_token ?? '')
      body.append('grant_type', 'refresh_token')
      try {
        const data = await $fetch<{ access_token: string, refresh_token: string, expires_in: number }>('https://id.twitch.tv/oauth2/token', {
          method: 'POST',
          body: body.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
        if (data && session.user) {
          session.token.expires_at = Date.now() + (data.expires_in * 1000)
          session.token.refresh_token = data.refresh_token
          session.token.access_token = data.access_token
        }
        else {
          await clearUserSession(event)
        }
      }
      catch (error) {
        console.error('Error refreshing oAuth token:', error)
        await clearUserSession(event)
      }
    }
  })
})
