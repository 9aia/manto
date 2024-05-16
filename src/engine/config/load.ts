import process from "node:process"
import { effect, signal } from "@preact/signals-core"
import type { Guild } from "discord.js"
import { InactiveUserTimeout } from "../server/types"
import { CONFIG_CATEGORY_KEYS, CONFIG_GUILD_KEYS, CONFIG_ROLE_KEYS } from "./constants"
import type { MantoConfig, MantoEffects, MantoSignals } from "./types"

export const signals: MantoSignals = {
  guild: {},
  roles: {},
  categories: {},
  isLoaded: false,
}

export const effects: MantoEffects = {
  guild: {
    server_name: (guild) => {
      guild.setName(signals.guild.server_name?.value)
    },
    logo_url: (guild) => {
      guild.setIcon(signals.guild.logo_url?.value ?? null)
    },
    server_banner_background_url: (guild) => {
      guild.setBanner(signals.guild.server_banner_background_url?.value ?? null)
    },
    default_notifications: (guild) => {
      guild.setDefaultMessageNotifications(signals.guild.default_notifications?.value === "all_messages" ? 0 : 1)
    },
    show_boost_progress_bar: (guild) => {
      guild.setPremiumProgressBarEnabled(signals.guild.show_boost_progress_bar?.value || false)
    },
    inactive_timeout: (guild) => {
      const timeout = (signals.guild.inactive_timeout?.value as string) ?? "5min"
      guild.setAFKTimeout((InactiveUserTimeout[timeout as any]) as any)
    },
    system_messages_channel: (guild) => {
      const systemReferenciedChannel = guild.channels.cache.filter(((ch: any) => ch.name === signals.guild.system_messages_channel?.value?.toLowerCase().replace(" ", "-") && ch.type === 0)).at(0)
      guild.setSystemChannel(systemReferenciedChannel?.id ?? null)
    },
    inactive_channel: (guild) => {
      const afkReferenciedChannel = guild.channels.cache.filter(((ch: any) => ch.name === signals.guild!.inactive_channel?.value)).at(0)
      guild.setAFKChannel(afkReferenciedChannel?.id ?? null)
    },
  },
  roles: {
    name: (role, configSignals) => {
      const name = configSignals?.name?.value
      role.setName(name && JSON.parse(name))
    },
    color: (role, configSignals) => {
      const color = configSignals?.color?.value
      role.setColor(color && JSON.parse(color))
    },
    icon_url: (role, configSignals) => {
      const iconUrl = configSignals?.icon_url?.value
      role.setIcon(iconUrl ? JSON.parse(iconUrl) : null)
    },
    allow_mention: (role, configSignals) => {
      const allow_mention = configSignals?.allow_mention?.value
      role.setMentionable(allow_mention ? JSON.parse(allow_mention) : false)
    },
    permissions: (role, configSignals) => {
      const permissions = configSignals?.permissions?.value
      role.setPermissions(permissions ? JSON.parse(permissions) : [])
    },
    separate_from_online: (role, configSignals) => {
      const separate_from_online = configSignals?.separate_from_online?.value
      role.setHoist(separate_from_online ? JSON.parse(separate_from_online) : false)
    },
  },
  categories: {
    category_name: (category, configSignals) => {
      const name = configSignals?.category_name?.value
      category.setName(name && JSON.parse(name))
    },
  },
}

export async function loadConfig(guild: Guild, config: MantoConfig) {
  const loadGuild = () => {
    if (config.guild) {
      const values = config.guild as any

      for (const key of CONFIG_GUILD_KEYS) {
        if (!signals.guild[key])
          signals.guild[key] = signal(values[key])
        else
          signals.guild[key].value = values[key]
      }
    }

    if (signals.isLoaded)
      return

    Object.keys(effects.guild).forEach((key) => {
      effect(() => {
        const data = signals.guild
        effects.guild[key]?.(guild)

        process.env.NODE_ENV && console.log("[MANTO] Updated guild ", key, "to", data[key].value)
      })
    })
  }

  const loadRoles = async () => {
    config.roles.forEach(async (role) => {
      for (const key of CONFIG_ROLE_KEYS) {
        const dRoleId = role.discordId!

        if (!dRoleId)
          continue

        if (!signals.roles[dRoleId])
          signals.roles[dRoleId] = {}

        const value = JSON.stringify((role as any)[key])

        if (!signals.roles[dRoleId][key])
          signals.roles[dRoleId][key] = signal(value)
        else
          signals.roles[dRoleId][key].value = value

        if (signals.isLoaded)
          continue

        const dRole = guild.roles.cache.get(dRoleId)

        if (!dRole)
          continue

        effect(() => {
          const data = signals.roles[dRole.id]
          effects.roles[key]?.(dRole, data)

          process.env.NODE_ENV && console.log("[MANTO] Updated role ", dRoleId, key, "to", data[key].value)
        })
      }
    })
  }

  const loadCategories = async () => {
    config.categories.forEach(async (category) => {
      for (const key of CONFIG_CATEGORY_KEYS) {
        const dCategoryId = category.discordId!

        if (!dCategoryId)
          continue

        if (!signals.categories[dCategoryId])
          signals.categories[dCategoryId] = {}

        const value = JSON.stringify((category as any)[key])

        if (!signals.categories[dCategoryId][key])
          signals.categories[dCategoryId][key] = signal(value)
        else
          signals.categories[dCategoryId][key].value = value

        if (signals.isLoaded)
          continue

        const dCategory = guild.channels.cache.get(dCategoryId)

        if (!dCategory)
          continue

        effect(() => {
          const data = signals.categories[dCategory.id]

          effects.categories[key]?.(dCategory, data)

          process.env.NODE_ENV && console.log("[MANTO] Updated category ", dCategoryId, key, "to", data[key].value)
        })
      }
    })
  }

  try {
    loadGuild()
  }
  catch (e) {
    console.error(e)
  }

  try {
    await loadRoles()
  }
  catch (e) {
    console.error(e)
  }

  try {
    await loadCategories()
  }
  catch (e) {
    console.error(e)
  }

  signals.isLoaded = true
}
