export default oauthTwitchEventHandler({
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
        token: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        },
      },
      loggedInAt: Date.now(),
    })
    return sendRedirect(event, '/')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
