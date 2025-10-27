/**
 * State management interfaces for tracking applied changes
 */

/**
 * Server state tracking
 */
export interface ServerState {
  guildId: string
  guildName: string
  appliedAt: string
  serverConfig: {
    name: string
    icon_url?: string
    banner_url?: string
    manto_version: string
  }
}

/**
 * Role state tracking with Discord IDs
 */
export interface RoleState {
  guildId: string
  appliedAt: string
  roles: Array<{
    id: string
    name: string
    color: string
    hoist: boolean
    mentionable: boolean
    permissions: string[]
  }>
}

/**
 * Category state tracking with Discord IDs
 */
export interface CategoryState {
  guildId: string
  appliedAt: string
  categories: Array<{
    id: string
    name: string
    overwrites?: any[]
  }>
}

/**
 * Channel state tracking with Discord IDs
 */
export interface ChannelState {
  guildId: string
  appliedAt: string
  channels: Array<{
    id: string
    name: string
    type: 'text' | 'voice'
    categoryId?: string
    topic?: string
    overwrites?: any[]
  }>
}

/**
 * Complete guild state
 */
export interface GuildState {
  server: ServerState | null
  roles: RoleState | null
  categories: CategoryState | null
  channels: ChannelState | null
}

/**
 * Cache file paths for a guild
 */
export interface GuildCachePaths {
  server: string
  roles: string
  categories: string
  channels: string
}
