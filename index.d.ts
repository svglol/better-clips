interface TwitchUser {
  id: string
  login: string
  display_name: string
  type: string
  broadcaster_type: string
  description: string
  profile_image_url: string
  offline_image_url: string
  view_count: number
  email: string
  created_at: string
}

interface TwitchAPIResponse<T> {
  data: T[]
  pagination?: {
    cursor: string
  }
}

interface TwitchToken {
  access_token: string
  token_type: string
  expires_in: number
}

interface TwitchChannel {
  broadcaster_language: string
  broadcaster_login: string
  display_name: string
  game_id: string
  game_name: string
  id: string
  is_live: boolean
  tag_ids: string[] // Deprecated as of February 28, 2023
  tags: string[]
  thumbnail_url: string
  title: string
  started_at: string
}

interface TwitchGame {
  id: string
  name: string
  box_art_url: string
  igdb_id: string
}

interface TwitchCategory {
  id: string
  box_art_url: string
  name: string
}

interface TwitchClip {
  id: string
  url: string
  embed_url: string
  broadcaster_id: string
  broadcaster_name: string
  creator_id: string
  creator_name: string
  video_id: string
  game_id: string
  language: string
  title: string
  view_count: number
  created_at: string
  thumbnail_url: string
  duration: number
  vod_offset: number | null
  is_featured: boolean
}

interface DateRange {
  start: Date
  end: Date
}

interface TwitchFollowedChannel {
  broadcaster_id: string
  broadcaster_name: string
  broadcaster_login: string
  followed_at: string
}
