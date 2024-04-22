export type DiscordPerms = keyof PermissionFlags
export type SchemaPermissions = `Deny${DiscordPerms}` | `Allow${DiscordPerms}` | `Default${DiscordPerms}`

export interface ParsedPermission {
  target: string
  perms: Partial<Record<SchemaPermissions, boolean>>
}
