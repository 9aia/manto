import type { CategoryChannel, Guild, PermissionsString } from "discord.js"
import type { FSCategoryConfig } from "./interfaces/FSCategory"
import { type ChannelSchemaPermission, type FSChannelConfig, channelSchemaPermissions } from "./interfaces/FSChannel"

async function createCategory(guild: Guild, config: FSCategoryConfig, perms: { [key: string]: string[] }) {
  const parsedPerms = parseSchemaPermissions(perms, guild)

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
  const parsedPerms = parseSchemaPermissions(config.permissions ?? {} as any, guild)

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
function parseSchemaPermissions(rawPerms: { [key: string]: string[] }, guild?: Guild) {
  let permslist = Object.entries(rawPerms) as ([ChannelSchemaPermission, string[]])[]

  if (guild) {
    const guildRoles = guild.roles.cache.map((role) => {
      return { name: role.name, id: role.id }
    })
    const guildMembers = guild.members.cache.map((member) => {
      return { name: member.user.username, id: member.id }
    })

    permslist = permslist.map((perm) => {
      perm[1] = perm[1].map((roleCitated) => {

        // try to catch any role with the role citated in the config file _perms
        let catched = guildRoles.filter(guildRole => guildRole.name === roleCitated)[0]
        if (catched)
          return catched.id

        // if not catched a role, this will try with guild members
        catched = guildMembers.filter(member => member.name === roleCitated)[0]
        if (catched)
          return catched.id

        // not catched anyone
        return roleCitated
      })
      return perm
    })
  }
  const separated: any = {}

  // create a simple map like this { username1:{ perm1:true, perm2:true }}
  permslist.forEach((permissionLine) => {
    permissionLine[1].forEach((target) => {
      if (!separated[target])
        separated[target] = {}

      const perm = abstPerm(permissionLine[0])
      if (!perm) return;

      separated[target][perm.name] = perm.value
    })
  })

  // Return as object {target:roleOrUser,perms:AllPermsInUsableWay}
  return Object.entries(separated).map((each) => {
    return {
      target: each[0],
      perms: each[1] as Partial<Record<PermissionsString, boolean>>,
    }
  })
}

/**Return the perm name and if it's true or false based in the input string */
function abstPerm(perm: string): { name: string, value?: boolean } {
  const regxp = /(Allow|Deny|Default)(\w+)/
  const match = perm.match(regxp)
  if (!match) return { name: perm };
  const [_, value, name] = match

  switch (value) {
    case "Allow":
      return { name, value: true }
    case "Deny":
      return { name, value: false }
    default:
      return { name, value: undefined }
  }
} 

export { createCategory, createChannel, parseSchemaPermissions }
export default { createCategory, createChannel, parseSchemaPermissions }
