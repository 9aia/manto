import type { ExecuteFn } from '../../../lib/discord/slash-commands/types'
import { SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Remove all channels, categories and roles.')

export const execute: ExecuteFn = (inter) => {
  const guild = inter.guild

  if (!guild) {
    inter.reply('This command can only be executed inside a guild.')
    return
  }

  guild.channels.cache.forEach(each => each.delete())
  // guild.channels.create({ name: "CMD", type: 0 })
  guild.roles.cache.forEach((each) => {
    if (each.client.user.username === each.name)
      return
    if (each.name === '@everyone')
      return
    if (each.managed)
      return
    each.delete()
  })
}
