import { existsSync } from "node:fs"
import path from "node:path"
import { SlashCommandBuilder } from "discord.js"
import type { ExecuteFn } from "../../../lib/discord/slash-commands/types"
import { DEFAULT_TEMPLATE_PATH } from "../../core/ambient"
import { applyConfig } from "../../core/apply"
import { listLiteralFolders, readConfig } from "../../core/read"
import { transformConfig } from "../../core/transform"

export const data = new SlashCommandBuilder()
  .setName("apply")
  .setDescription("Update the server based on a template.")
  .addStringOption(o => o
    .setName("template-path")
    .setDescription("Template path to be used."),
  )

export const execute: ExecuteFn = async (inter) => {
  const templatePath = inter.options.getString("template-path") as string
  const rootDir = templatePath || DEFAULT_TEMPLATE_PATH

  if (!existsSync(rootDir)) {
    await inter.reply({ content: `Template not found: \`${templatePath}\``, ephemeral: true })
    return
  }

  if (!inter.guild) {
    await inter.reply({ content: `This command should be executed inside a guild.`, ephemeral: true })
    return
  }

  await inter.reply({ content: `Applying template located at \`${rootDir}\`.`, ephemeral: true })

  const literalFolders = listLiteralFolders(rootDir)

  if (literalFolders.length === 0)
    await inter.editReply({ content: "Warning: No main folder found." })

  if (literalFolders.length > 1) {
    await inter.editReply({ content: "Error: Multiple main folders found." })
    return
  }

  const mainFolder = literalFolders[0]
  const mainFolderPath = path.join(rootDir, mainFolder)

  const config = readConfig(mainFolderPath)
  const applicable = await transformConfig(inter.guild, config, { rootDir })
  await applyConfig(inter.guild, applicable, { rootDir })

  await inter.editReply({ content: "Server has been updated." })
}
