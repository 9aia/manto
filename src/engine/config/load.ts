import fs from "node:fs"
import path from "node:path"
import { effect, signal } from "@preact/signals-core"
import type { Guild } from "discord.js"
import { InactiveUserTimeout } from "../server/types"
import type { MantoEffect, MantoSignals } from "./types"

export const signals: MantoSignals = {
  guild: {},
  isLoaded: false,
}

export const effects: Record<string, MantoEffect> = {
  server_name: (guild) => {
    guild.setName(signals.guild.server_name.value)
  },
  logo_url: (guild) => {
    guild.setIcon(signals.guild.logo_url.value)
  },
  server_banner_background_url: (guild) => {
    guild.setBanner(signals.guild.server_banner_background_url.value ?? null)
  },
  default_notifications: (guild) => {
    guild.setDefaultMessageNotifications(signals.guild.default_notifications.value === "all_messages" ? 0 : 1)
  },
  show_boost_progress_bar: (guild) => {
    guild.setPremiumProgressBarEnabled(signals.guild.show_boost_progress_bar.value)
  },
  inactive_timeout: (guild) => {
    const timeout = (signals.guild.inactive_timeout.value as string) ?? "5min"
    guild.setAFKTimeout((InactiveUserTimeout[timeout as any]) as any)
  },
  system_messages_channel: (guild) => {
    const systemReferenciedChannel = guild.channels.cache.filter(((ch: any) => ch.name === signals.guild!.system_messages_channel.value?.toLowerCase().replace(" ", "-") && ch.type === 0)).at(0)
    guild.setSystemChannel(systemReferenciedChannel?.id ?? null)
  },
  inactive_channel: (guild) => {
    const afkReferenciedChannel = guild.channels.cache.filter(((ch: any) => ch.name === signals.guild!.inactive_channel.value)).at(0)
    guild.setAFKChannel(afkReferenciedChannel?.id ?? null)
  },
}

export function loadGuild(guild: Guild, templatePath: string) {
  const guildFilePath = path.join(templatePath, ".manto", templatePath, "server.json")
  const data = fs.readFileSync(guildFilePath, { encoding: "utf-8" })

  const guildConfig = JSON.parse(data)

  if (guildConfig) {
    Object.keys(guildConfig).forEach((key) => {
      if (!signals.guild[key])
        signals.guild[key] = signal(guildConfig[key])
      else
        signals.guild[key].value = guildConfig[key]
    })
  }

  if (signals.isLoaded)
    return

  Object.keys(effects).forEach((key) => {
    effect(() => {
      effects[key]?.(guild)
    })
  })

  signals.isLoaded = true
}
