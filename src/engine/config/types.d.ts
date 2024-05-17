import type { Signal } from "@preact/signals-core"
import type { Channel, GuildBasedChannel, Role, TextChannel } from "discord.js"
import type { CategoryChannel } from "discord.js"
import type { MantoCategory, MantoChannel } from "../channels/types"
import type { readConfig } from "./reader"

export interface ChannelMeta {
  category_name?: string
  perms?: { [key: string]: string[] }
}

export interface RoleMeta {
  category_name?: string
  perms?: { [key: string]: string[] }
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

export interface MantoSignals {
  guild: Record<string, Signal>
  roles: Record<string, Record<string, Signal>>
  categories: Record<string, Record<string, Signal>>
  channels: Record<string, Record<string, Signal>>
  isLoaded: boolean
}

export interface MantoEffects {
  guild: Record<string, (guild: Guild) => void>
  roles: Record<string, (role: Role, configSignals: Record<keyof MantoRole, Signal>) => void>
  categories: Record<string, (category: GuildBasedChannel, configSignals: Record<keyof MantoCategory, Signal>) => void>
}

export type MantoConfig = ReturnType<typeof readConfig>

export interface MantoOptions {
  rootDir?: string
}
