import type { ColorResolvable, PermissionResolvable } from "discord.js"

export interface MantoRole {
  name: string
  color: ColorResolvable
  icon_url?: string
  separate_from_online: boolean
  allow_mention: boolean
  permissions?: PermissionResolvable
  id: string
  discordId?: string
}
