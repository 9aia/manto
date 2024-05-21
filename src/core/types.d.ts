import type { Signal } from "@preact/signals-core"
import type { Channel, GuildBasedChannel, GuildChannelEditOptions, GuildEditOptions, PermissionResolvable, Role, RoleEditOptions, TextChannel } from "discord.js"
import type { CategoryChannel } from "discord.js"
import type { readConfig } from "./read"
import type { HideThreadAfter, SlowMode } from "./utils"

export interface MantoGuild {
  name: string
  icon_url: string
  system_channel?: string
  afk_channel?: string
  afk_timeout?: InactiveUserTimeout
  default_notifications: "all_messages" | "only_mentions"
  enable_premium_progress_bar?: string
  banner_url?: string
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
}

export interface MantoCategory {
  id: string
  name: string
}

export type ChannelType = "voice" | "text"

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
}

export interface MantoConfig {
  guild: MantoGuild | null
  roles: MantoRole[]
  categories: MantoCategory[]
  channels: MantoChannel[]
}

export interface MantoPermissions { [key: string]: string[] }

export interface MantoOptions {
  rootDir?: string
}

export interface Applicable {
  id: string
  discordId?: string
}

export interface ApplicableGuild extends GuildEditOptions { }
export interface ApplicableRole extends RoleEditOptions, Applicable { }
export interface ApplicableCategory extends GuildChannelEditOptions, Applicable { }
export interface ApplicableChannel extends GuildChannelEditOptions, Applicable {
  mantoCategory?: string
  mantoPermissions?: MantoPermissions
}

export interface ApplicableConfig {
  guild: ApplicableGuild | null
  roles: ApplicableRole[]
  categories: ApplicableCategory[]
  channels: ApplicableChannel[]
}

// #region Permission

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

// #region Reader

export interface ChannelMeta {
  category_name?: string
  perms?: MantoPermissions
}

export interface RoleMeta {
  category_name?: string
  perms?: MantoPermissions
}

export enum MetaType {
  CATEGORY = "_category",
  PERMS = "_perms",
}

export interface FsRes {
  isMeta: boolean
  filePath: string
  data: any
  lastMeta: any
}

// #endregion
