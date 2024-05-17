import type { CategoryChannel, Guild } from "discord.js"
import { parseSchemaPermissions } from "../perms/utils"
import type { MantoCategory, MantoChannel } from "./types.d"

export async function createCategory(guild: Guild, config: MantoCategory, perms: { [key: string]: string[] }) {
  const parsedPerms = perms ? parseSchemaPermissions(perms, guild) : []

  const c = await guild.channels.create({
    name: config.category_name,
    type: 4, // Category Channel
  }) as unknown as CategoryChannel

  // Apply permissions
  for (const parsedPerm of parsedPerms) {
    const target = parsedPerm.target === "@everyone" ? guild.roles.everyone : parsedPerm.target
    await c.permissionOverwrites.create(target, parsedPerm.perms)
  }

  return c
}

export async function createChannel(guild: Guild, config: MantoChannel, parentId?: string) {
  const parsedPerms = config.permissions ? parseSchemaPermissions(config.permissions, guild) : []

  let type = 0
  switch (config.type) {
    case "text":
      type = 0
      break
    case "voice":
      type = 2
      break
    default:
      break
  }

  const c = await guild.channels.create({
    name: config.channel_name,
    type,
    parent: parentId,
  }) as unknown as CategoryChannel

  // Apply permissions
  for (const parsedPerm of parsedPerms) {
    const target = parsedPerm.target === "@everyone" ? guild.roles.everyone : parsedPerm.target
    await c.permissionOverwrites.create(target, parsedPerm.perms)
  }

  return c
}
