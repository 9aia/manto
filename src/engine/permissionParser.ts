import type { Guild, PermissionFlags } from "discord.js"

type DiscordPerms = keyof PermissionFlags
type SchemaPermissions = `Deny${DiscordPerms}` | `Allow${DiscordPerms}` | `Default${DiscordPerms}`

interface ParsedPermission {
  target: string
  perms: Partial<Record<SchemaPermissions, boolean>>
}

function parseSchemaPermissions(rawPerms: { [key: string]: string[] }, guild?: Guild): ParsedPermission[] {
  let permslist = Object.entries(rawPerms) as ([SchemaPermissions, string[]])[]

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
      if (perm === undefined)
        return

      separated[target][perm.name] = perm.value
    })
  })

  // Return as object {target:roleOrUser,perms:AllPermsInUsableWay}[]
  const result = Object.entries(separated).map((each) => {
    return {
      target: each[0],
      perms: each[1],
    } as ParsedPermission
  })

  return result
}

/** Return the perm name and if it's true or false based in the input string */
function abstPerm(perm: SchemaPermissions): { name: string, value?: boolean } {
  const regxp = /(Allow|Deny|Default)(\w+)/
  const match = perm.match(regxp)

  if (!match)
    return { name: perm }
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

export { parseSchemaPermissions }
export type { SchemaPermissions, ParsedPermission }
