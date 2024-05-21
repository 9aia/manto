import type { Guild } from "discord.js"
import type { ApplicableConfig, MantoConfig } from "./types"
import { ChannelType, HideThreadAfter, InactiveUserTimeout, SlowMode } from "./utils"

export async function transformConfig(
  guild: Guild,
  config: MantoConfig,
): Promise<ApplicableConfig> {
  const aConfig = {} as ApplicableConfig

  const g = config.guild
  if (g) {
    const systemChannel = guild.channels.cache.filter((ch => ch.name === g.system_channel?.toLowerCase().replace(" ", "-") && ch.type === 0)).at(0) || null
    const afkChannel = guild.channels.cache.filter((ch => ch.name === g.afk_channel?.toLowerCase().replace(" ", "-") && ch.type === 4)).at(0) || null

    aConfig.guild = {
      name: g.name,
      icon: g.icon_url || null,
      banner: g.banner_url || null,
      defaultMessageNotifications: g.default_notifications === "all_messages" ? 0 : 1,
      premiumProgressBarEnabled: Boolean(g.enable_premium_progress_bar),
      systemChannel: systemChannel as any,
      afkChannel: afkChannel as any,
      afkTimeout: InactiveUserTimeout[g.afk_timeout || "5min"] as unknown as number,
    }
  }

  aConfig.roles = config.roles.map((role) => {
    return {
      id: role.id,
      name: role.name,
      color: role.color,
      hoist: Boolean(role.hoist),
      icon: role.icon_url || null,
      mentionable: Boolean(role.mentionable),
      position: Number(role.position),
      permissions: role.permissions,
    }
  })

  aConfig.categories = config.categories.map((cat) => {
    return {
      id: cat.id,
      name: cat.name,
    }
  })

  aConfig.channels = config.channels.map((channel) => {
    const channelType = (channel.type as any)?.toUpperCase()

    return {
      id: channel.id,
      name: channel.name,
      topic: channel.topic,
      mantoCategory: channel.category,
      nsfw: Boolean(channel.nsfw),
      type: ChannelType[channelType || "TEXT"] as unknown as number,
      rateLimitPerUser: SlowMode[channel.slow_mode || "off"] as unknown as number,
      defaultThreadRateLimitPerUser: HideThreadAfter[channel.hide_threads_after || "1h"] as unknown as number,
      mantoPermissions: channel.permissions,
    }
  })

  return aConfig
}
