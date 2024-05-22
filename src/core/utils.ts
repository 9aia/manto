import fs from "node:fs"
import path from "node:path"
import type { Guild } from "discord.js"
import type { Applicable, MantoPermissions, NormalizedPerm, ParsedPermission, SchemaPermissions } from "./types"

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

export function getUserId(guild: Guild, name: string) {
  if (name === "@everyone")
    return guild.roles.everyone.id

  const role = guild.roles.cache.filter(r => r.name === name).at(0)

  if (role)
    return role.id

  // if a role is not found, it will try to find it in the guild members
  const member = guild.members.cache.filter(m => m.user.username === name).at(0)

  if (member)
    return member.id

  return null
}

export function resolveChannelPerms(guild: Guild, mantoPerms?: MantoPermissions) {
  if (!mantoPerms)
    return []

  const perms: { [id: string]: { allow: string[], deny: string[] } } = {}

  Object.entries(mantoPerms).forEach(([key, users]) => {
    const normalized = normalizePerm(key)

    users.forEach((user) => {
      const userId = getUserId(guild, user)

      if (!userId)
        return

      if (!perms[userId])
        perms[userId] = { allow: [], deny: [] }

      if (normalized.value === true)
        perms[userId].allow.push(normalized.name)
      else if (normalized.value === false)
        perms[userId].deny.push(normalized.name)
    })
  })

  return Object.entries(perms).map(([id, { allow, deny }]) => ({
    id,
    allow,
    deny,
  }))
}
