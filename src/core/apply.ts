import type { Guild, GuildChannelCreateOptions, GuildChannelEditOptions } from "discord.js"
import { ChannelType as _DiscordChannelType } from "discord.js"
import type { ApplicableCategory, ApplicableChannel, ApplicableConfig, ApplicableRole, MantoOptions } from "./types"
import { MantoFile, prepareOptions, readMantoFile, resolveChannelPerms, saveMantoFile } from "./utils"

export async function applyConfig(
  guild: Guild,
  aConfig: ApplicableConfig,
  options?: MantoOptions,
) {
  const rootDir = options?.rootDir || "./"

  applyGuild(guild, aConfig)
  await applyRoles(guild, aConfig, rootDir)
  await applyChannels(guild, aConfig, rootDir)
}

export async function applyGuild(
  guild: Guild,
  aConfig: ApplicableConfig,
) {
  if (!aConfig.guild)
    return

  const g = await guild.edit(aConfig.guild)

  console.log(`[MANTO] Guild '${g.name}' updated`)
}

export async function applyRoles(
  guild: Guild,
  aConfig: ApplicableConfig,
  rootDir: string,
) {
  const roleIds = readMantoFile(rootDir, MantoFile.ROLE)

  for (const role of aConfig.roles) {
    const dRoleId = roleIds[role.id]
    const { alreadyCreated, options } = prepareOptions(role, dRoleId)

    if (alreadyCreated) {
      const dRole = guild.roles.cache.get(dRoleId)

      if (!dRole) {
        delete roleIds[dRoleId] // remove orphan

        console.log(`[MANTO] Orphan role ${dRoleId} removed from manto file`)
      }
      else {
        guild.roles.edit(dRole, options)
          .then((r) => {
            console.log(`[MANTO] Role '${r.name}' (${r.id}) edited`)
          })
          .catch((e) => {
            console.error(e)
          })
      }
    }
    else {
      const r = await guild.roles.create(options)
      roleIds[role.id] = r.id

      console.log(`[MANTO] Role '${r.name}' (${r.id}) created`)
    }
  }

  await saveMantoFile(rootDir, roleIds, MantoFile.ROLE)
}

export async function applyChannels(
  guild: Guild,
  aConfig: ApplicableConfig,
  rootDir: string,
) {
  const catIds = readMantoFile(rootDir, MantoFile.CATEGORY)
  const catIdByNames: Record<string, string> = {} as any

  const applyCategories = async () => {
    for (const cat of aConfig.categories) {
      const dCatId = catIds[cat.id]
      const { alreadyCreated, options: _options } = prepareOptions(cat, dCatId)

      const options = {
        type: _DiscordChannelType.GuildCategory,
        ..._options,
      }

      if (alreadyCreated) {
        const dCat = guild.channels.cache.get(dCatId)

        if (!dCat) { // remove orphan
          delete catIds[dCatId]
          delete catIdByNames[cat.id]

          console.log(`[MANTO] Orphan category ${dCatId} removed from manto file`)
        }
        else {
          const editOptions = {
            ...options,
          } as GuildChannelEditOptions
          delete editOptions.type

          guild.channels.edit(dCat, editOptions)
            .then((c) => {
              console.log(`[MANTO] Category '${c.name}' (${c.id}) edited`)
            })
            .catch((e) => {
              console.error(e)
            })
        }
      }
      else {
        const c = await guild.channels.create(options as GuildChannelCreateOptions)
        catIds[cat.id] = c.id
        catIdByNames[c.name] = c.id

        console.log(`[MANTO] Category '${c.name}' (${c.id}) created`)
      }
    }

    await saveMantoFile(rootDir, catIds, MantoFile.CATEGORY)
  }

  const applyChannels = async () => {
    const channelIds = readMantoFile(rootDir, MantoFile.CHANNEL)

    for (const channel of aConfig.channels) {
      const dChannelId = channelIds[channel.id]

      const { alreadyCreated, options: _options } = prepareOptions(channel, dChannelId)

      const parentName = channel.mantoCategory
      const parent = parentName && guild.channels.cache.get(catIdByNames[parentName])

      const permissionOverwrites = resolveChannelPerms(guild, channel.mantoPermissions)

      const options = {
        parent,
        permissionOverwrites,
        ..._options,
      }
      delete options.mantoCategory
      delete options.mantoPermissions
      delete options.discordId
      delete options.id

      if (alreadyCreated) {
        const dChannel = guild.channels.cache.get(dChannelId)

        if (!dChannel) {
          delete channelIds[dChannelId] // remove orphan

          console.log(`[MANTO] Orphan channel ${dChannelId} removed from manto file`)
        }
        else {
          guild.channels.edit(dChannel, options as GuildChannelEditOptions)
            .then((c) => {
              console.log(`[MANTO] Channel '${c.name}' (${c.id}) edited`)
            })
            .catch((e) => {
              console.error(e)
            })
        }
      }
      else {
        const c = await guild.channels.create(options as GuildChannelCreateOptions)
        channelIds[channel.id] = c.id

        console.log(`[MANTO] Channel '${c.name}' (${c.id}) created`)
      }
    }

    await saveMantoFile(rootDir, channelIds, MantoFile.CHANNEL)
  }

  await applyCategories()
  await applyChannels()
}
