import type { Guild } from "discord.js"
import { createCategory, createChannel } from "../channels/services"
import { InactiveUserTimeout } from "../server/types"
import { readConfig } from "./reader"

export async function applyConfig(guild: Guild, templateDir: string) {
  const config = readConfig(templateDir)

  // #region Create roles

  for (const role of config.roles) {
    await guild.roles.create({
      name: role.name,
      color: role.color,
      icon: role.icon_url,
      mentionable: role.allow_mention,
      permissions: role.permissions,
      hoist: role.separate_from_online,
    })
  }
  // #endregion

  // #region Create categories

  const categoryIds: Record<string, string> = {}

  for (const category of config.categories) {
    const perms = {}
    const c = await createCategory(guild, category, perms)
    categoryIds[c.name] = c.id
  }

  // #endregion

  // #region Create channels

  for (const channel of config.channels) {
    const parentId = channel.category && categoryIds[channel.category]

    await createChannel(guild, channel, parentId)
  }

  // #endregion

  // #region Set server config

  if (config.guild) {
    guild.setDefaultMessageNotifications(config.guild.default_notifications === "all_messages" ? 0 : 1)

    guild.setIcon(config.guild.logo_url)
    guild.setName(config.guild.server_name)

    guild.setPremiumProgressBarEnabled(config.guild.show_boost_progress_bar)

    guild.setAFKTimeout(InactiveUserTimeout[config.guild.inactive_timeout ?? "5min"] as number)

    const systemReferenciedChannel = guild.channels.cache.filter((ch => ch.name === config.guild!.system_messages_channel?.toLowerCase().replace(" ", "-") && ch.type === 0)).at(0)
    const afkReferenciedChannel = guild.channels.cache.filter((ch => ch.name === config.guild!.inactive_channel)).at(0)

    guild.setSystemChannel(systemReferenciedChannel?.id ?? null)
    guild.setAFKChannel(afkReferenciedChannel?.id ?? null)

    guild.setBanner(config.guild.server_banner_background_url ?? null)
  }

  // #endregion
}
