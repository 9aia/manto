import type { CategoryChannel, Guild, PermissionsString } from "discord.js"
import type { FSCategoryConfig } from "./interfaces/FSCategory"
import { FSChannelConfig } from "./interfaces/FSChannel"
import { parseSchemaPermissions } from "./permissionParser"

async function createCategory(guild: Guild, config: FSCategoryConfig, perms: { [key: string]: string[] }) {
  const parsedPerms = perms?parseSchemaPermissions(perms,guild):[]
  
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

async function createChannel(guild: Guild, config: FSChannelConfig, parentId?: string) {
  const parsedPerms = config.permissions?parseSchemaPermissions(config.permissions,guild):[]

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
  //
}

/**
 * Parse permissions of a yaml configuration file in a usable mode for Discord.js
 * If a guild is in args, this will switch the name for the role id in mentioned roles
 */

export { createCategory, createChannel }
export default { createCategory, createChannel }
