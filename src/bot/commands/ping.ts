import type { ExecuteFn } from '../../../lib/discord/slash-commands/types'
import { SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')

export const execute: ExecuteFn = async (inter) => {
  await inter.reply('Pong!')
}
