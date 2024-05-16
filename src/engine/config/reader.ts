import fs from "node:fs"
import path from "node:path"
import yaml from "yaml"
import { basename } from "discord.js"
import type { FSCategoryConfig, FSChannelConfig } from "../channels/types"
import type { FSGuildConfig } from "../server/types"
import type { MantoRole } from "../roles/types"
import type { ChannelMeta, FsRes, RoleMeta } from "./types.d"
import { MetaType } from "./types.d"

function readRes<M extends ChannelMeta | RoleMeta>(filePath: string, lastMeta: M) {
  const base = path.basename(filePath)
  const isMeta = base.startsWith("_")
  const ext = path.extname(base)

  if (ext !== ".yml" && ext !== ".yaml")
    return null

  const data: Readonly<any> = yaml.parse(fs.readFileSync(filePath, "utf-8"))

  if (base === (`${MetaType.CATEGORY}.yml`) || base === (`${MetaType.CATEGORY}.yaml`))
    lastMeta.category_name = data.category_name

  if (base === (`${MetaType.PERMS}.yml`) || base === (`${MetaType.PERMS}.yaml`))
    lastMeta.perms = { ...lastMeta.perms, ...data }

  return { isMeta, data }
}

export type ReadFilesCb = (res: FsRes) => void

function readReses<M extends object>(
  dirPath: string,
  cb?: ReadFilesCb,
  lastMeta: M = {} as M,
) {
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = path.join(dirPath, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      readReses(filePath, cb, lastMeta)
      return
    }

    const res = readRes(filePath, lastMeta)

    if (res === null)
      return

    cb?.({ ...res, filePath, lastMeta: { ...lastMeta } })
  })
}

export function readConfig(folderPath: string) {
  const roles: MantoRole[] = []
  const channels: FSChannelConfig[] = []
  const categories: FSCategoryConfig[] = []

  const readGuild = (folderPath: string): FSGuildConfig | null => {
    let base

    if (fs.existsSync(path.join(folderPath, "server.yml")))
      base = "server.yml"
    else if (fs.existsSync(path.join(folderPath, "server.yaml")))
      base = "server.yaml"
    else base = null

    if (base === null)
      return null

    const filePath = path.join(folderPath, base)
    const data = yaml.parse(fs.readFileSync(filePath, "utf-8"))

    return data
  }

  const readRoles = (dirPath: string) => {
    readReses<RoleMeta>(dirPath, (res) => {
      if (res.isMeta)
        return

      roles.push({ id: res.filePath, ...res.data })
    })
  }

  const readChannels = (dirPath: string) => {
    const dirChannels: any[] = []

    readReses<ChannelMeta>(
      dirPath,
      (res) => {
        if (!res.isMeta) {
          dirChannels.push(res)

          return
        }

        const base = basename(res.filePath)

        if (base === (`${MetaType.CATEGORY}.yml`) || base === (`${MetaType.CATEGORY}.yaml`)) {
          categories.push({
            id: res.filePath,
            ...res.data,
          })
        }
      },
    )

    channels.push(...dirChannels.map((channel) => {
      return {
        id: channel.filePath,
        category: channel.lastMeta.category_name,
        permissions: channel.lastMeta.perms,
        ...channel.data,
      }
    }))
  }

  const guild = readGuild(folderPath)

  readChannels(path.join(folderPath, "channels"))
  readRoles(path.join(folderPath, "roles"))

  return { guild, roles, channels, categories }
}
