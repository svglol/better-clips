export default defineOAuthTwitchEventHandler({
  config: {
    emailRequired: true,
    scope: ['user:read:email', 'user:read:follows'],
    authorizationParams: {
      response_type: 'code',
    },
  },
  async onSuccess(event, { user, tokens }) {
    await setUserSession(event, {
      user: {
        id: user.id,
        login: user.login,
        profile_image_url: user.profile_image_url,
      },
      loggedInAt: Date.now(),
      secure: {
        token: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + (tokens.expires_in * 1000),
        },
      },
    }, { maxAge: 60 * 60 * 24 * 7 })
    const callbackUrl = getCookie(event, 'callbackUrl')
    deleteCookie(event, 'callbackUrl')
    return sendRedirect(event, callbackUrl ?? '/')
  },
  onError(event, error) {
    console.error('Discord OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
