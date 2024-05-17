import type { Guild } from "discord.js"
import type { MantoRole } from "../roles/types"
import { createCategory, createChannel } from "../channels/services"
import type { MantoConfig, MantoOptions } from "./types"
import { readMantoFile, saveMantoFile } from "./utils"

export async function saveManto(
  guild: Guild,
  config: MantoConfig,
  options?: MantoOptions,
) {
  const rootDir = options?.rootDir || "./"
  const categoryIds: Record<string, string> = {}

  const saveGuild = () => {
    if (!config.guild)
      return

    saveMantoFile(rootDir, "server", config.guild)
  }

  const saveRoles = async () => {
    for (const role of config.roles) {
      const mantoFileName = `roles/${role.id?.replaceAll("/", "-")}`
      const oldMantoData = readMantoFile<MantoRole>(rootDir, mantoFileName)

      if (oldMantoData.discordId) {
        role.discordId = oldMantoData.discordId
      }
      else {
        const r = await guild.roles.create({
          name: role.name,
          color: role.color,
          icon: role.icon_url,
          mentionable: role.allow_mention,
          permissions: role.permissions,
          hoist: role.separate_from_online,
        })

        role.discordId = r.id
      }

      saveMantoFile(rootDir, mantoFileName, role)
    }
  }

  const saveCategories = async () => {
    for (const category of config.categories) {
      const mantoFileName = `categories/${category.id?.replaceAll("/", "-")}`
      const oldMantoData = readMantoFile<MantoRole>(rootDir, mantoFileName)

      if (oldMantoData.discordId) {
        category.discordId = oldMantoData.discordId
      }
      else {
        const perms = {} // TODO
        const c = await createCategory(guild, category, perms)

        category.discordId = c.id
        categoryIds[c.name] = c.id
      }

      saveMantoFile(rootDir, mantoFileName, category)
    }
  }

  const saveChannels = async () => {
    for (const channel of config.channels) {
      const mantoFileName = `channels/${channel.id?.replaceAll("/", "-")}`
      const oldMantoData = readMantoFile<MantoRole>(rootDir, mantoFileName)

      if (oldMantoData.discordId) {
        channel.discordId = oldMantoData.discordId
      }
      else {
        const parentId = channel.category && categoryIds[channel.category]
        const c = await createChannel(guild, channel, parentId)

        channel.discordId = c.id
      }

      saveMantoFile(rootDir, mantoFileName, channel)
    }
  }

  saveGuild()
  await saveRoles()
  await saveCategories()
  await saveChannels()
}
