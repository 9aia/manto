import type { ChatInputCommandInteraction, CommandInteraction, Interaction, SlashCommandBuilder } from "discord.js"

export interface BotCommand {
  data: SlashCommandBuilder
  execute: ExecuteFn
}

export type ExecuteFn = (interaction: ChatInputCommandInteraction) => void | Promise<void>
