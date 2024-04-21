import fs from "node:fs"
import path from "node:path"
import yaml from "yaml"
import type { CategoryChannel, Guild } from "discord.js"
import { InactiveUserTimeout } from "./interfaces/FSGuild"
import { createCategory, createChannel } from "./Creator"
import type { FSCategoryConfig } from "./interfaces/FSCategory"
import type { FSChannelConfig } from "./interfaces/FSChannel"
import type { FSRoleConfig } from "./interfaces/FSRole"
import type { FSGuildConfig } from "./interfaces/FSGuild"

async function parseFS(guild: Guild, serverDir: string) {
  const channelsDir = path.resolve(serverDir, "channels")

  const rolesDir = path.resolve(serverDir, "roles")

  const serverFile = path.resolve(serverDir, "server.yml")

  const rolesScan = fs.readdirSync(rolesDir).map(fileName => path.resolve(rolesDir, fileName))

  // Create Roles
  for (const rolesPath of rolesScan) {
    const config: FSRoleConfig = yaml.parse(fs.readFileSync(rolesPath, "utf-8"))
    await guild.roles.create({
      name: config.name,
      color: config.color,
      icon: config.icon_url,
      mentionable: config.allow_mention,
      permissions: config.permissions,
      hoist: config.separate_from_online,
    })
  }

  // Create Channels and Categories

  await createChannelsFromGroup(guild, channelsDir)

  const serverConfig: FSGuildConfig = yaml.parse(fs.readFileSync(serverFile, "utf8"))

  guild.setDefaultMessageNotifications(serverConfig.default_notifications === "all_messages" ? 0 : 1)

  guild.setIcon(serverConfig.logo_url)
  guild.setName(serverConfig.server_name)

  guild.setPremiumProgressBarEnabled(serverConfig.show_boost_progress_bar)

  guild.setAFKTimeout(InactiveUserTimeout[serverConfig.inactive_timeout ?? "5min"] as number)

  const systemReferenciedChannel = guild.channels.cache.filter((ch => ch.name === serverConfig.system_messages_channel?.toLowerCase().replace(" ", "-") && ch.type === 0)).at(0)
  const afkReferenciedChannel = guild.channels.cache.filter((ch => ch.name === serverConfig.inactive_channel)).at(0)

  guild.setSystemChannel(systemReferenciedChannel?.id ?? null)
  guild.setAFKChannel(afkReferenciedChannel?.id ?? null)

  guild.setBanner(serverConfig.server_banner_background_url ?? null)

  // not added
  // prompt welcome reply sticky
  // send boost message
  // send welcome message
}

async function createChannelsFromGroup(guild: Guild, dirPath: string, outerParentID?: string, outerPerms?: { [key: string]: string[] }) {
  const _categoryPath = path.resolve(dirPath, "_category.yml")
  const _permsPath = path.resolve(dirPath, "_perms.yml")

  let perms: { [key: string]: string[] } = outerPerms ?? {}

  // load _perms.yml if exists
  if (fs.existsSync(_permsPath)) {
    const loadedPerm = yaml.parse(fs.readFileSync(_permsPath, "utf-8"))
    perms = { ...perms, ...loadedPerm }
  }

  const isCategory = fs.existsSync(_categoryPath)

  // this will receive a category channel id if this group is has _category.yml
  // this nows receive the oldParentID for recursion
  let parentId: string | undefined = outerParentID

  if (isCategory) {
    // Creates a category channel and puts the id in parentID variable
    // The created channel will be used as parent of child channels of this group
    const config: FSCategoryConfig = yaml.parse(fs.readFileSync(_categoryPath, "utf-8"))
    const createdCategoryChannel: CategoryChannel = await createCategory(guild, config, perms)
    parentId = createdCategoryChannel.id
  }

  // inner files
  const iFileNames = fs.readdirSync(dirPath).filter(each => !each.startsWith("_"))

  for (const iFileName of iFileNames) {
    const channelFilePath = path.resolve(dirPath, iFileName)

    if (fs.statSync(channelFilePath).isDirectory()) {
      // this receives the current parentID
      // if inner channels of this inner dir not has a category file,
      // it will receive the current parentID
      await createChannelsFromGroup(guild, channelFilePath, parentId, perms)
      continue
    }

    const channelConfig: FSChannelConfig = yaml.parse(fs.readFileSync(channelFilePath, "utf-8"))

    // merge channel permissions with group permissions
    channelConfig.permissions = { ...channelConfig.permissions, ...perms }

    // parentID is optional
    await createChannel(guild, channelConfig, parentId)
  }
}

export { parseFS }
