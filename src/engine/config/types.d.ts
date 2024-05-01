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
  isLoaded: boolean
}

export type MantoEffect = (guild: Guild) => void
