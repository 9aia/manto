import { existsSync } from "node:fs"
import path from "node:path"
import { SlashCommandBuilder } from "discord.js"
import type { ExecuteFn } from "../../lib/discord/slash-commands/types"
import { templatesPath } from "../engine/config/ambient"
import { applyConfig } from "../engine/config/apply"

export const data = new SlashCommandBuilder()
  .setName("clone")
  .setDescription("Clone a server.")
  .addStringOption(o => o
    .setName("template-name")
    .setDescription("Template name to be used.")
    .setRequired(true),
  )

export const execute: ExecuteFn = async (inter) => {
  const templateName = inter.options.getString("template-name") as string

  const templatePath = path.join(templatesPath, templateName)

  if (!existsSync(templatePath)) {
    await inter.reply({ content: `Template not found: ${templateName}`, ephemeral: true })
    return
  }

  if (!inter.guild) {
    await inter.reply({ content: `This command should be executed inside a guild.`, ephemeral: true })
    return
  }

  await inter.reply({ content: `Cloning from \`${templateName}\`.`, ephemeral: true })

  await applyConfig(inter.guild, templatePath)

  await inter.editReply({ content: `Cloning complete.` })
}
