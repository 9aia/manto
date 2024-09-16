import path from "node:path"
import type { Guild, GuildChannelEditOptions } from "discord.js"
import { ChannelType as _DiscordChannelType } from "discord.js"
import type { ApplicableCategory, ApplicableChannel, ApplicableConfig, ApplicableRole, MantoOptions } from "./types"
import { existsYaml, insertMantoId, insertRoleMantoId, parseChannelFileName, prepareOptions, readMantoFile, resolveChannelPerms, saveMantoFile } from "./utils"

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
  const g = aConfig.guild

  if (!g)
    return

  await guild.edit(aConfig.guild)

  console.log(`[INFO] Guild '${g.name}' (${g.mantoId}) has been updated`)
}

export async function applyRoles(
  guild: Guild,
  aConfig: ApplicableConfig,
  rootDir: string,
) {
  const bind = readMantoFile(rootDir)

  const createRole = async (r: ApplicableRole, options: any) => {
    const dRole = await guild.roles.create(options)
    bind[r.mantoId] = dRole.id

    const serverFilePath = aConfig.guild?.mantoPath
    insertRoleMantoId(serverFilePath, r.mantoIndex, r.mantoId)

    console.log(`[INFO] Role '${r.name}' (${r.mantoId}) has been created`)
  }

  for (const r of aConfig.roles) {
    const dRoleId = bind[r.mantoId]
    const { alreadyCreated, options } = prepareOptions(r)

    if (alreadyCreated) {
      const dRole = guild.roles.cache.get(dRoleId)

      if (!dRole) {
        delete bind[r.mantoId] // remove orphan
        console.log(`[INFO] Orphan role \`${r.mantoId}\` removed from manto file`)

        await createRole(r, options)
      }
      else {
        guild.roles.edit(dRole, options)
          .then((_) => {
            console.log(`[INFO] Role '${r.name}' (${r.mantoId}) has been edited`)
          })
          .catch((e) => {
            console.error(e)
          })
      }
    }
    else {
      await createRole(r, options)
    }
  }

  await saveMantoFile(rootDir, bind)
}

export async function applyChannels(
  guild: Guild,
  aConfig: ApplicableConfig,
  rootDir: string,
) {
  const bind = readMantoFile(rootDir)

  const createCategory = async (cat: ApplicableCategory, options: any) => {
    const c = await guild.channels.create(options)
    bind[cat.mantoId] = c.id

    let base = existsYaml(cat.mantoPath!, "_category")
    if (base == null)
      base = "_category.yml"

    insertMantoId(path.join(cat.mantoPath!, base), cat.mantoId)

    console.log(`[INFO] Category '${c.name}' (${cat.mantoId}) has been created`)
  }

  const applyCategories = async () => {
    for (const c of aConfig.categories) {
      const isNonCategory = c.name === "_"
      if (isNonCategory)
        continue

      const dCatId = bind[c.mantoId]
      const { alreadyCreated, options: _options } = prepareOptions(c)

      const options = {
        type: _DiscordChannelType.GuildCategory,
        ..._options,
      }

      if (alreadyCreated) {
        const dCat = guild.channels.cache.get(dCatId)

        if (!dCat) { // remove orphan
          delete bind[c.mantoId]

          console.log(`[INFO] Orphan category \`${c.mantoId}\` removed from manto file`)

          await createCategory(c, options)
        }
        else {
          const editOptions = {
            ...options,
          } as GuildChannelEditOptions
          delete editOptions.type

          guild.channels.edit(dCat, editOptions)
            .then((_) => {
              console.log(`[INFO] Category '${c.name}' (${c.mantoId}) has been edited`)
            })
            .catch((e) => {
              console.error(e)
            })
        }
      }
      else {
        await createCategory(c, options)
      }
    }

    await saveMantoFile(rootDir, bind)
  }

  const applyChannels = async () => {
    const createChannel = async (channel: ApplicableChannel, options: any) => {
      const c = await guild.channels.create(options)
      bind[channel.mantoId] = c.id
      insertMantoId(channel.mantoPath!, channel.mantoId)

      const { name, type } = parseChannelFileName(channel.name!)

      if (type === "text")
        console.log(`[INFO] Text channel '${name}' (${channel.mantoId}) has been created`)
      else
        console.log(`[INFO] Voice channel '${name}' (${channel.mantoId}) has been created`)
    }

    for (const c of aConfig.channels) {
      const dChannelId = bind[c.mantoId]

      const { alreadyCreated, options: _options } = prepareOptions(c)

      const mantoCategory = c.mantoCategory
      const parent = mantoCategory && guild.channels.cache.get(bind[mantoCategory])

      const permissionOverwrites = resolveChannelPerms(guild, c.mantoPermissions)

      const options = {
        parent,
        permissionOverwrites,
        ..._options,
      }

      if (alreadyCreated) {
        const dChannel = guild.channels.cache.get(dChannelId)

        if (!dChannel) {
          delete bind[dChannelId] // remove orphan
          console.log(`[INFO] Orphan channel \`${c.mantoId}\` removed from manto file`)

          await createChannel(c, options)
        }
        else {
          guild.channels.edit(dChannel, options as GuildChannelEditOptions)
            .then((_) => {
              console.log(`[INFO] Channel '${c.name}' (${c.mantoId}) has been edited`)
            })
            .catch((e) => {
              console.error(e)
            })
        }
      }
      else {
        await createChannel(c, options)
      }
    }

    await saveMantoFile(rootDir, bind)
  }

  await applyCategories()
  await applyChannels()
}
