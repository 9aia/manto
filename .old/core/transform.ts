import type { Guild } from 'discord.js'
import type { ApplicableConfig, MantoConfig, MantoOptions } from './types'
import { ChannelType, getAfkChannelId, getSystemChannelId, HideThreadAfter, InactiveUserTimeout, readMantoFile, SlowMode } from './utils'

export async function transformConfig(
  guild: Guild,
  config: MantoConfig,
  options: MantoOptions,
): Promise<ApplicableConfig> {
  const rootDir = options.rootDir || './'

  const aConfig = {} as ApplicableConfig
  const ids = readMantoFile(rootDir)

  const g = config.guild
  if (g) {
    const systemChannelId = getSystemChannelId(guild, g.system_channel)
    const afkChannelId = getAfkChannelId(guild, g.afk_channel)

    const dId = ids[g.id]

    aConfig.guild = {
      id: dId,
      mantoId: g.id,
      mantoPath: g.filePath,
      name: g.name,
      icon: g.icon_url || null,
      banner: g.banner_url || null,
      defaultMessageNotifications: g.default_notifications === 'all_messages' ? 0 : 1,
      premiumProgressBarEnabled: Boolean(g.enable_premium_progress_bar),
      systemChannel: systemChannelId,
      afkChannel: afkChannelId,
      afkTimeout: InactiveUserTimeout[g.afk_timeout || '5min'] as unknown as number,
    }
  }

  aConfig.roles = config.roles.map((r) => {
    const dId = ids[r.id]

    return {
      id: dId,
      mantoId: r.id,
      mantoPath: config.guild.filePath,
      mantoIndex: r.index,
      name: r.name,
      color: r.color,
      hoist: Boolean(r.hoist),
      icon: r.icon_url || null,
      mentionable: Boolean(r.mentionable),
      position: Number(r.position),
      permissions: r.permissions,
    }
  })

  aConfig.categories = config.categories.map((c) => {
    const dId = ids[c.id]

    return {
      id: dId,
      mantoId: c.id,
      mantoPath: c.filePath,
      name: c.name,
      // TODO permissions
    }
  })

  aConfig.channels = config.channels.map((c) => {
    const dId = ids[c.id]
    const channelType = (c.type as any)?.toUpperCase()

    return {
      id: dId,
      mantoId: c.id,
      mantoCategory: c.category,
      mantoPermissions: c.permissions,
      mantoPath: c.filePath,
      name: c.name,
      topic: c.topic,
      nsfw: Boolean(c.nsfw),
      type: ChannelType[channelType || 'TEXT'] as unknown as number,
      rateLimitPerUser: SlowMode[c.slow_mode || 'off'] as unknown as number,
      defaultThreadRateLimitPerUser: HideThreadAfter[c.hide_threads_after || '1h'] as unknown as number,
    }
  })

  return aConfig
}
