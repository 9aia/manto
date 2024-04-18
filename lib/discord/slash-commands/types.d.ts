import type { SlashCommandBuilder } from "discord.js"

export interface BotCommand {
  data: SlashCommandBuilder
  execute: ExecuteFn
}

export type ExecuteFn = (client: Client) => void | Promise<void>
