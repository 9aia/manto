import fs from "node:fs"
import path from "node:path"
import type { Guild } from "discord.js"
import yaml from "yaml"
import type { Applicable, MantoPermissions, MantoServer, NormalizedPerm, SchemaPermissions } from "./types"

// #region Server

export enum InactiveUserTimeout {
  "1min" = 60,
  "5min" = 5 * 60,
  "15min" = 15 * 60,
  "30min" = 30 * 60,
  "1h" = 60 * 60,
}

// #endregion

// #region Config

export function existsYaml(dirPath: string, name: string) {
  let base

  if (fs.existsSync(path.join(dirPath, `${name}.yml`)))
    base = `${name}.yml`
  else if (fs.existsSync(path.join(dirPath, `${name}.yaml`)))
    base = `${name}.yaml`
  else base = null

  return base
}

export function readMantoFile(rootDir: string) {
  let data: Record<string, string> = {}

  const roleFilePath = path.join(rootDir, ".manto/bind.json")

  if (fs.existsSync(roleFilePath)) {
    const content = fs.readFileSync(roleFilePath, { encoding: "utf-8" })
    data = JSON.parse(content)
  }

  return data
}

export async function saveMantoFile(
  rootDir: string,
  data: Record<string, string>,
) {
  const mantoPath = path.join(rootDir, ".manto/bind.json")

  if (!fs.existsSync(path.dirname(mantoPath)))
    fs.mkdirSync(path.dirname(mantoPath), { recursive: true })

  fs.writeFileSync(mantoPath, JSON.stringify(data))
}

export function insertMantoId<T>(
  filePath: string,
  mantoId: string,
): T {
  let data: any = {} as any

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    data = yaml.parse(content)
  }

  data = { id: mantoId, ...data }

  fs.writeFileSync(filePath, yaml.stringify(data))

  return data
}

export function insertRoleMantoId(
  filePath: string,
  index: number,
  mantoId: string,
) {
  let data: any = {} as any

  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    data = yaml.parse(content)
  }

  const roles = data.roles || []
  roles[index] = { id: mantoId, ...roles[index] }
  data.roles = roles

  fs.writeFileSync(filePath, yaml.stringify(data))

  return data
}

// #endregion

// #region Applicable

export function prepareOptions<T extends Applicable>(item: T) {
  const alreadyCreated = Boolean((item as any).mantoId)

  const options: Partial<T> = { ...item }

  delete (options as any).mantoCategory
  delete (options as any).mantoPermissions
  delete (options as any).mantoId

  return { alreadyCreated, options, path }
}

// #endregion

// #region Channels

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

export function getSystemChannelId(guild: Guild, channelName?: string) {
  if (!channelName)
    return null

  const systemChannel = guild.channels.cache.filter(
    (ch => ch.name === channelName && ch.type === 0),
  ).at(0)

  if (systemChannel == null) {
    console.log(`[WARNING] System channel not found: ${channelName}`)
    return null
  }

  return systemChannel.id
}

export function getAfkChannelId(guild: Guild, channelName?: string) {
  if (!channelName)
    return null

  const afkChannel = guild.channels.cache.filter(
    (c => c.name === channelName && c.type === 2),
  ).at(0)

  if (!afkChannel) {
    console.log(`[WARNING] AFK channel not found: ${channelName}`)
    return null
  }

  return afkChannel.id
}

export function parseChannelFileName(fileName: string) {
  const order = fileName.match(/^\d+\s/) ? Number.parseInt(fileName.match(/^\d+\s/)![0]) : null
  const fileNameWithoutOrder = fileName.replace(/^\d+\s/, "")
  const type = fileNameWithoutOrder.startsWith("voice") ? "voice" : "text"
  const name = fileNameWithoutOrder.replace(/\.\w+$/, "")
    .replace(/^voice\s/, "")

  return {
    order,
    name,
    type,
  }
}

export function getCategoryConfigData(dirPath: string, isNonCategory: boolean) {
  let data = {} as any
  const configBase = existsYaml(dirPath, "_category")

  if (configBase) {
    if (isNonCategory) {
      console.log("[WARN] Non-category folder should not have `_category` file: ", dirPath)
    }
    else {
      const configFilePath = path.join(dirPath, configBase)
      data = yaml.parse(fs.readFileSync(configFilePath, "utf-8"))
    }
  }

  return data
}

// #endregion

// #region Permissions

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

// #endregion

// #region User

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

// #endregion
