import type { GuildChannelEditOptions, GuildEditOptions, PermissionResolvable, RoleEditOptions } from 'discord.js'
import type { HideThreadAfter, SlowMode } from './utils'

// #region Manto

export interface MantoGuild {
  id: string
  name: string
  icon_url?: string
  system_channel?: string
  afk_channel?: string
  afk_timeout?: InactiveUserTimeout
  default_notifications?: 'all_messages' | 'only_mentions'
  enable_premium_progress_bar?: string
  banner_url?: string
  filePath: string
}

export interface MantoServer extends MantoGuild {
  roles: MantoRole[]
}

export interface MantoRole {
  id: string
  name?: string
  color?: ColorResolvable
  icon_url?: string
  hoist?: string
  mentionable?: string
  position?: string
  permissions?: PermissionResolvable
  index: number
}

export interface MantoCategory {
  id: string
  name: string
  permissions?: MantoPermissions
  filePath: string
}

export type ChannelType = 'voice' | 'text'

export interface MantoChannel {
  id: string
  name: string
  type: ChannelType
  category?: string
  permissions?: MantoPermissions
  topic?: string
  slow_mode: SlowMode
  nsfw: string
  hide_threads_after?: HideThreadAfter
  filePath: string
}

export interface MantoConfig {
  guild: MantoGuild
  roles: MantoRole[]
  categories: MantoCategory[]
  channels: MantoChannel[]
}

export interface MantoOptions {
  rootDir?: string
}

// #region Permission

export interface MantoPermissions { [key: string]: string[] }

export interface NormalizedPerm {
  name: string
  value: boolean | undefined
}

export type DiscordPerms = keyof PermissionFlags
export type SchemaPermissions = `Deny${DiscordPerms}` | `Allow${DiscordPerms}` | `Default${DiscordPerms}`

export interface ParsedPermission {
  target: string
  perms: Partial<Record<SchemaPermissions, boolean>>
}

// #endregion

// #endregion

// #region Applicable

export interface Applicable {}

export interface EditableApplicable extends Applicable {
  id: string
  mantoId: string
  mantoPath: string
}

export interface ApplicableGuild extends GuildEditOptions, EditableApplicable { }
export interface ApplicableRole extends RoleEditOptions, EditableApplicable {
  mantoIndex: number
}
export interface ApplicableCategory extends GuildChannelEditOptions, EditableApplicable {}
export interface ApplicableChannel extends GuildChannelEditOptions, EditableApplicable {
  mantoCategory?: string
  mantoPermissions?: MantoPermissions
}

export interface ApplicableConfig {
  guild: ApplicableGuild
  roles: ApplicableRole[]
  categories: ApplicableCategory[]
  channels: ApplicableChannel[]
}

// #endregion

// #region Reader

export enum MetaType {
  CATEGORY = '_category',
  PERMS = '_perms',
}

export interface FsRes {
  isMeta: boolean
  filePath: string
  data: any
  lastMeta: any
}

// #endregion
