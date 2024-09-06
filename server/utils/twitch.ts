export async function fetchFromTwitchAPI<T>(endpoint: string, params: URLSearchParams): Promise<TwitchAPIResponse<T>> {
  const token = await getTwitchToken()
  const url = `https://api.twitch.tv/helix${endpoint}?${params}`
  const data = await $fetch<TwitchAPIResponse<T>>(url, {
    headers: {
      'Client-ID': useRuntimeConfig().twitchClientId,
      'Authorization': `Bearer ${token}`,
    },
  })
  return data
}

export async function getTwitchToken() {
  const token = await useStorage('cache').getItem('twitchToken') as TwitchToken
  if (token)
    return token.access_token

  const tokenData = await getToken()
  await useStorage('cache').setItem('twitchToken', tokenData, { expires: tokenData.expires_in })
  return tokenData.access_token
}

async function getToken() {
  const data = await $fetch<TwitchToken>('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: `client_id=${useRuntimeConfig().twitchClientId}&client_secret=${useRuntimeConfig().twitchClientSecret}&grant_type=client_credentials`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  return data
}
