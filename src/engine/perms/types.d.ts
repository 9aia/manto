import type { PermissionFlags } from "discord.js"

export type DiscordPerms = keyof PermissionFlags
export type SchemaPermissions = `Deny${DiscordPerms}` | `Allow${DiscordPerms}` | `Default${DiscordPerms}`

export interface ParsedPermission {
  target: string
  perms: Partial<Record<DiscordPerms, boolean>>
}

export type FSPermissionConfig = Partial<Record<SchemaPermissions, string[]>>
