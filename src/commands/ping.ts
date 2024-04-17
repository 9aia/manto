import { SlashCommandBuilder } from "discord.js"
import type { ExecuteFn } from "../types"

export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with Pong!")

export const execute: ExecuteFn = async (inter) => {
  await inter.reply("Pong!")
}
