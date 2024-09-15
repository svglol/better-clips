import type { H3Event } from 'h3'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', async (event) => {
    const session = await getUserSession(event)
    if (session.token) {
      const now = new Date()
      const expirationDate = new Date(session.token.expires_at)

      const isValid = await validateToken(event, session.token.access_token)

      if (!isValid || expirationDate < now) {
        const storage = useStorage('data')
        const isRefreshing = await storage.getItem(`isRefreshing:${session.user?.id}`) || false

        if (!isRefreshing) {
          await storage.setItem(`isRefreshing:${session.user?.id}`, true)
          try {
            const body = new URLSearchParams()
            body.append('client_id', useRuntimeConfig().twitchClientId)
            body.append('client_secret', useRuntimeConfig().twitchClientSecret)
            body.append('refresh_token', session.token.refresh_token ?? '')
            body.append('grant_type', 'refresh_token')

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
              await setUserSession(event, session)
            }
            else {
              await clearUserSession(event)
            }
          }
          catch (error) {
            console.error('Error refreshing oAuth token:', error)
            await clearUserSession(event)
          }
          finally {
            await storage.setItem(`isRefreshing:${session.user?.id}`, false)
          }
        }
        else {
          while (await storage.getItem(`isRefreshing:${session.user?.id}`)) {
            await new Promise(resolve => setTimeout(resolve, 100))
          }
          await getUserSession(event)
        }
      }
    }
    else {
      await clearUserSession(event)
    }
  })
})

async function validateToken(event: H3Event, accessToken: string) {
  try {
    const response = await $fetch('https://id.twitch.tv/oauth2/validate', {
      method: 'GET',
      headers: {
        Authorization: `OAuth ${accessToken}`,
      },
    })
    return !!response
  }
  catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}
