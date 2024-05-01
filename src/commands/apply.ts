import fs, { existsSync } from "node:fs"
import path from "node:path"
import { SlashCommandBuilder } from "discord.js"
import type { ExecuteFn } from "../../lib/discord/slash-commands/types"
import { templatesPath } from "../engine/config/ambient"
import { loadConfig } from "../engine/config/load"
import { readConfig } from "../engine/config/reader"
import { replaceExtname, saveMantoFile } from "../engine/config/utils"

export const data = new SlashCommandBuilder()
  .setName("apply")
  .setDescription("Update the server settings based on a template.")
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

  await inter.reply({ content: `Updating server settings based on \`${templateName}\`.`, ephemeral: true })

  const config = readConfig(templatePath)

  // #region Save changes and discord ids on storage

  if (config.guild)
    saveMantoFile(templatePath, config.guild)

  for (const role of config.roles) {
    if (!role.file_path)
      continue

    let roleManto = {} as any

    const roleFilePath = replaceExtname(path.join(templatePath, ".manto", role.file_path), "json")

    if (fs.existsSync(roleFilePath)) {
      const data = fs.readFileSync(roleFilePath, { encoding: "utf-8" })
      roleManto = JSON.parse(data)
    }

    if (!roleManto.discordId) {
      const r = await inter.guild.roles.create({
        name: role.name,
        color: role.color,
        icon: role.icon_url,
        mentionable: role.allow_mention,
        permissions: role.permissions,
        hoist: role.separate_from_online,
      })

      role.discordId = r.id
    }
    else {
      role.discordId = roleManto.discordId
    }

    saveMantoFile(templatePath, role)
  }

  // #endregion

  await loadConfig(inter.guild, config)

  await inter.editReply({ content: `Server settings have been updated.` })
}
