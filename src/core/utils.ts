import fs from "node:fs"
import path from "node:path"
import type { Guild, OverwriteResolvable, PermissionResolvable } from "discord.js"
import type { Applicable, ApplicableChannel, NormalizedPerm, ParsedPermission, SchemaPermissions } from "./types"

export enum MantoFile {
  ROLE = "roles",
  CATEGORY = "categories",
  CHANNEL = "channels",
}

export enum InactiveUserTimeout {
  "1min" = 60,
  "5min" = 5 * 60,
  "15min" = 15 * 60,
  "30min" = 30 * 60,
  "1h" = 60 * 60,
}

function replaceExtname(filePath: string, newExtension: string) {
  const oldExtension = path.extname(filePath)
  const baseName = path.basename(filePath, oldExtension)
  const newFilePath = path.join(path.dirname(filePath), `${baseName}.${newExtension}`)
  return newFilePath
}

export function readMantoFile(rootDir: string, name: string) {
  let data: Record<string, string> = {}

  const roleFilePath = replaceExtname(path.join(rootDir, ".manto", name), "json")

  if (fs.existsSync(roleFilePath)) {
    const content = fs.readFileSync(roleFilePath, { encoding: "utf-8" })
    data = JSON.parse(content)
  }

  return data
}

export async function saveMantoFile(
  rootDir: string,
  data: Record<string, string>,
  name: "roles" | "channels" | "categories",
) {
  const mantoPath = path.join(rootDir, ".manto", name)

  if (!fs.existsSync(path.dirname(mantoPath)))
    fs.mkdirSync(path.dirname(mantoPath), { recursive: true })

  fs.writeFileSync(replaceExtname(mantoPath, "json"), JSON.stringify(data))
}

export function prepareOptions<T extends Applicable>(item: T, itemId: string) {
  const alreadyCreated = !!itemId

  const options: Partial<T> = { ...item }
  delete options.id
  delete options.discordId

  return { alreadyCreated, options }
}

export function normalizePerm(perm: SchemaPermissions): NormalizedPerm {
  const regxp = /(Allow|Deny|Default)(\w+)/
  const match = perm.match(regxp)

  if (!match)
    return { name: perm } as NormalizedPerm

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

export enum SlowMode {
  "off" = 0,
  "5s" = 5,
  "10s" = 10,
  "15s" = 15,
  "30s" = 30,
  "1m" = 1 * 60,
  "2m" = 2 * 60,
  "5m" = 5 * 60,
  "10m" = 10 * 60,
  "15m" = 15 * 60,
  "30m" = 30 * 60,
  "1h" = 1 * 60 * 60,
  "2h" = 2 * 60 * 60,
  "6h" = 6 * 60 * 60,
}

export enum HideThreadAfter {
  "1h" = 1 * 60 * 60,
  "24h" = 24 * 60 * 60,
  "3d" = 3 * 24 * 60 * 60,
  "1w" = 1 * 7 * 24 * 60 * 60,
}

export enum ChannelType {
  TEXT = 0,
  VOICE = 2,
}

export function parseSchemaPermissions(
  rawPerms: { [key: string]: string[] },
  guild?: Guild,
): ParsedPermission[] {
  if (!rawPerms)
    return []

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

      const perm = normalizePerm(permissionLine[0])
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

export function parseChannelPerms(guild: Guild, channel: ApplicableChannel) {
  const perms: OverwriteResolvable[] = []

  console.log(channel.mantoPermissions)
  for (const perm of channel.mantoPermissions) {
    const targetId = perm.target

    const target = perm.target === "@everyone" ? guild.roles.everyone.id : targetId
    const allow: PermissionResolvable[] = []
    const deny: PermissionResolvable[] = []

    for (const [permission, value] of Object.entries(perm.perms)) {
      if (value)
        allow.push(permission as PermissionResolvable)
      else
        deny.push(permission as PermissionResolvable)
    }

    perms.push({ id: target, allow, deny })
  }

  return perms
}
