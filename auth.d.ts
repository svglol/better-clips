declare module '#auth-utils' {
  interface User {
    id: number
    login: string
    profile_image_url: string
  }
  interface UserSession {
    extended?: any
    loggedInAt: number
  }
  interface SecureSessionData {
    token: {
      access_token: string
      refresh_token: string
      expires_at: number
    }
  }

}

export {}
