import type { MantoCategory, MantoChannel, MantoConfig, MantoGuild, MantoRole, MantoServer } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { basename } from 'discord.js'
import { v4 as uuidv4 } from 'uuid'
import yaml from 'yaml'
import { existsYaml, getCategoryConfigData, insertMantoId, parseChannelFileName } from './utils'

export function listLiteralFolders(templatePath: string) {
  return fs.readdirSync(templatePath).filter((file) => {
    const filePath = path.join(templatePath, file)
    const stat = fs.statSync(filePath)
    return stat.isDirectory() && !file.startsWith('_') && !file.startsWith('.')
  })
}

function readServer(mainFolderPath: string): MantoServer {
  const mainFolderName = path.basename(mainFolderPath)

  let base = existsYaml(mainFolderPath, '_server')

  let data: MantoServer | null = null

  if (!base) {
    data = {
      id: uuidv4(),
    } as MantoServer

    const filePath = path.join(mainFolderPath, '_server.yml')
    fs.writeFileSync(filePath, yaml.stringify(data))
    base = '_server.yml'
  }
  else {
    data = yaml.parse(
      fs.readFileSync(path.join(mainFolderPath, base), 'utf-8'),
    )
  }

  if (data === null) {
    const id = uuidv4()
    const filePath = path.join(mainFolderPath, base)
    insertMantoId(filePath, id)

    return {
      id,
      name: mainFolderName,
      roles: [],
      filePath,
    }
  }
  else {
    const id = uuidv4()
    const filePath = path.join(mainFolderPath, base)
    insertMantoId(filePath, id)
  }

  const roles = readRoles(data)

  delete (data as any).roles

  return {
    ...data,
    name: data?.name || mainFolderName,
    roles,
    filePath: path.join(mainFolderPath, base),
  }
}

function readCategories(dirPath: string) {
  const categories: MantoCategory[] = []
  const channels: MantoChannel[] = []

  fs.readdirSync(dirPath).forEach((fileName) => {
    const filePath = path.join(dirPath, fileName)
    const stat = fs.statSync(filePath)
    const isNonCategory = fileName === '_'
    const isMeta = fileName.startsWith('_')

    if (!stat.isDirectory() || (isMeta && !isNonCategory))
      return

    const data = getCategoryConfigData(filePath, isNonCategory)
    const id = isNonCategory ? null : data?.id || uuidv4()

    const category: MantoCategory = {
      id,
      name: fileName,
      filePath,
      ...data,
    }

    const categoryChannels = readChannels(category)

    channels.push(...categoryChannels)

    if (!isNonCategory)
      categories.push(category)
  })

  return { categories, channels }
}

function readChannels(category: MantoCategory) {
  const channels: MantoChannel[] = []

  fs.readdirSync(category.filePath).forEach((fileName) => {
    const filePath = path.join(category.filePath, fileName)
    const isMeta = fileName.startsWith('_')
    const stat = fs.statSync(filePath)

    if (isMeta)
      return

    if (!stat.isFile()) {
      console.log('[WARNING] Invalid file in category folder: ', filePath)
      return
    }

    const base = existsYaml(category.filePath, basename(filePath, path.extname(filePath)))

    if (base === null)
      return

    const { name, type } = parseChannelFileName(fileName)

    const data = yaml.parse(fs.readFileSync(path.join(category.filePath, base), 'utf-8'))

    channels.push({
      id: uuidv4(),
      category: category.id,
      filePath,
      ...(data || {}),
      name: data?.name || name,
      type,
    })
  })

  return channels
}

function readRoles(data: Record<string, any>) {
  const roles: MantoRole[] = []

  if (data?.roles === undefined)
    return roles

  data?.roles?.forEach((role: Record<string, any>, index: number) => {
    roles.push({
      ...role,
      id: role.id || uuidv4(),
      index,
    })
  })

  return roles
}

export function readConfig(mainFolderPath: string): MantoConfig {
  const { roles, ...guild } = readServer(mainFolderPath)
  const { categories, channels } = readCategories(mainFolderPath)

  return { guild: guild as MantoGuild, roles, channels, categories }
}
