import type { ColorResolvable, PermissionResolvable } from "discord.js"

export interface FSRoleConfig {
  name: string
  color: ColorResolvable
  icon_url?: string
  separate_from_online: boolean
  allow_mention: boolean
  permissions?: PermissionResolvable
  file_path?: string
  discordId?: string
}
