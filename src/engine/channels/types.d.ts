export interface FSCategoryConfig {
  category_name: string
  file_path?: string
}

export type SlowModeString = "off" | "5s" | "10s" | "15s" | "30s" | "1m" | "2m" | "5m" | "10m" | "15m" | "30m" | "1h" | "2h" | "6h"
export type HideThreadString = "1h" | "24h" | "3d" | "1w"
export type ChannelType = "voice" | "text"

export interface FSChannelConfig {
  channel_name: string
  type: ChannelType
  category?: string
  permissions?: { [key: string]: string[] }
  topic?: string
  slow_mode: SlowModeString
  age_restricted: boolean
  hide_threads_after?: HideThreadString
  file_path?: string
}
