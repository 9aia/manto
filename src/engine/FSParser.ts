import { CategoryChannel, Guild } from 'discord.js'
import fs from 'fs'
import path from 'path'
import yaml from 'yaml'
import { FSCategoryConfig } from './interfaces/FSCategory'
import { FSChannelConfig } from './interfaces/FSChannel'
import { createCategory, createChannel } from './Creator'

async function parseFS(guild: Guild, dir: string) {
    const serverDir = dir

    const channelsDir = path.resolve(serverDir, "channels")

    const rolesDir = path.resolve(serverDir, "roles")

    const serverFile = path.resolve(serverDir, "server.yml")

    const channelsScan = fs.readdirSync(channelsDir).map(fileName => path.resolve(channelsDir, fileName))

    for (const scannedPath of channelsScan) {
        const stat = fs.lstatSync(scannedPath)

        // if is directory = GROUP of channels
        if (stat.isDirectory()) {
            await createChannelsFromGroup(guild, scannedPath)
        }
        else {
            const config: FSChannelConfig = yaml.parse(fs.readFileSync(scannedPath, "utf8"))
            await createChannel(guild, config)
        }
    }
}

async function createChannelsFromGroup(guild: Guild, dirPath: string) {
    const _categoryPath = path.resolve(dirPath, "_category.yml")
    const _permsPath = path.resolve(dirPath, "_perms.yml")

    let perms: { [key: string]: string[] } = {}

    // load _perms.yml if exists
    if (fs.existsSync(_permsPath)) {
        perms = yaml.parse(fs.readFileSync(_permsPath, "utf-8"))
    }

    const isCategory = fs.existsSync(_categoryPath)

    // this will receive a category channel id if this group is has _category.yml
    let parentId: string | undefined = undefined

    if (isCategory) {
        // Creates a category channel and puts the id in parentID variable
        // The created channel will be used as parent of child channels of this group
        const config: FSCategoryConfig = yaml.parse(fs.readFileSync(_categoryPath, "utf-8"))
        const createdCategoryChannel: CategoryChannel = await createCategory(guild, config, perms)
        parentId = createdCategoryChannel.id
    }

    const scanInnerChannelsConfig = fs.readdirSync(dirPath).filter(each => !each.startsWith("_"))

    for (const channelConfigFilename of scanInnerChannelsConfig) {
        const channelFilePath = path.resolve(dirPath, channelConfigFilename)
        const channelConfig: FSChannelConfig = yaml.parse(fs.readFileSync(channelFilePath, "utf-8"))

        // merge channel permissions with group permissions
        channelConfig.permissions = { ...channelConfig.permissions, ...perms }

        // parentID is optional
        createChannel(guild, channelConfig, parentId)
    }
}

export { parseFS }