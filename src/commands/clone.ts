import { existsSync } from "node:fs"
import { SlashCommandBuilder } from "discord.js"
import { parseFS } from "../engine/FSParser"
import type { ExecuteFn } from "../../lib/discord/slash-commands/types"

export const data = new SlashCommandBuilder()
  .setName("clone")
  .setDescription("Clone a server.")
  .addStringOption(o => o
    .setName("template-name")
    .setDescription("Template name to be used.")
    .setRequired(true),
  )

export const execute: ExecuteFn = async (inter) => {
  const templatePath = `./templates/${inter.templateName}`

  if (!existsSync(templatePath)) {
    await inter.reply("This template not exists!")
    return
  }

  await inter.reply(`Cloning from \`${inter.templateName}\`.`)

  await parseFS(inter.guild, templatePath)

  await inter.reply(`Cloning complete.`)
}
