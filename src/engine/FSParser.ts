import fs from "node:fs"
import path from "node:path"
import type { CategoryChannel, Guild } from "discord.js"
import yaml from "yaml"
import type { FSCategoryConfig } from "./interfaces/FSCategory"
import type { FSChannelConfig } from "./interfaces/FSChannel"
import { createCategory, createChannel } from "./Creator"
import type { FSRoleConfig } from "./interfaces/FSRole"
import type { FSGuildConfig } from "./interfaces/FSGuild"
import { InactiveUserTimeout } from "./interfaces/FSGuild"

async function parseFS(guild: Guild, serverDir: string) {

  const channelsDir = path.resolve(serverDir, "channels")

  const rolesDir = path.resolve(serverDir, "roles")

  const serverFile = path.resolve(serverDir, "server.yml")

  const channelsScan = fs.readdirSync(channelsDir).map(fileName => path.resolve(channelsDir, fileName))
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
  for (const channelPath of channelsScan) {
    const stat = fs.lstatSync(channelPath)

    // if is directory = GROUP of channels
    if (stat.isDirectory()) {
      await createChannelsFromGroup(guild, channelPath)
    }
    else {
      const config: FSChannelConfig = yaml.parse(fs.readFileSync(channelPath, "utf8"))
      await createChannel(guild, config)
    }
  }

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

async function createChannelsFromGroup(guild: Guild, dirPath: string) {
  const _categoryPath = path.resolve(dirPath, "_category.yml")
  const _permsPath = path.resolve(dirPath, "_perms.yml")

  let perms: { [key: string]: string[] } = {}

  // load _perms.yml if exists
  if (fs.existsSync(_permsPath))
    perms = yaml.parse(fs.readFileSync(_permsPath, "utf-8"))

  const isCategory = fs.existsSync(_categoryPath)

  // this will receive a category channel id if this group is has _category.yml
  let parentId: string | undefined

  if (isCategory) {
    // Creates a category channel and puts the id in parentID variable
    // The created channel will be used as parent of child channels of this group
    const config: FSCategoryConfig = yaml.parse(fs.readFileSync(_categoryPath, "utf-8"))
    const createdCategoryChannel: CategoryChannel = await createCategory(guild, config, perms)
    parentId = createdCategoryChannel.id
  }

  const scanInnerChannelsConfig = fs.readdirSync(dirPath).filter(each => !each.startsWith("_"))

  for (const channelConfigFilename of scanInnerChannelsConfig) {
    const channelFilePath = path.resolve(dirPath, channelConfigFilename)
    const channelConfig: FSChannelConfig = yaml.parse(fs.readFileSync(channelFilePath, "utf-8"))

    // merge channel permissions with group permissions
    channelConfig.permissions = { ...channelConfig.permissions, ...perms }

    // parentID is optional
    createChannel(guild, channelConfig, parentId)
  }
}

export { parseFS }
