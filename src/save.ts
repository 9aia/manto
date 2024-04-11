import { Guild } from "discord.js"
import fs from 'fs'
import { ClonedChannel, ClonedGuild, ClonedRole } from "./interfaces"
import path from "path"
import { dataDir } from "./contants"

async function saveGuild(guild: Guild, name: string) {

    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

    // NOTE: change the copyRoles for a fetch model instead cached

    const clonedChannels = await copyChannel(guild) 
    const clonedRoles = copyRoles(guild)

    const clonnedGuild: ClonedGuild = {
        channels: clonedChannels,
        roles: clonedRoles,
    }
    fs.writeFileSync(path.resolve(dataDir, `${name}.json`), JSON.stringify(clonnedGuild))
}

function copyRoles(guild: Guild) {
    const clonedRoles: ClonedRole[] = []
    guild.roles.cache.forEach(each => {
        if (each.tags && each.tags.botId) return;
        if (each.name === "@everyone") return;
        clonedRoles.push({
            id: each.id,
            mentionable: each.mentionable,
            name: each.name,
            perm: each.permissions.toArray(),
            color: each.color,
            icon: each.icon,
            hoist: each.hoist,
            emoji: each.unicodeEmoji
        })
    })
    return clonedRoles
}

async function copyChannel(guild: Guild) {
    // Get the channels and make it a simple array instead "discord collection"
    const channels = (await guild.channels.fetch()).map(each => each)

    const clonedChannels:ClonedChannel[] = []

    for (const channel of channels) {
        if (!channel) continue;

        let pinnedMessages: string[] = []
        if (channel.type === 0) {
            // get only pinned messages
            const rawPinnedMessages = await channel.messages.fetchPinned()
            pinnedMessages = rawPinnedMessages.map(pinMsg => pinMsg.content)
        }

        // Get permission just of @everyone role
        const denyPermissions = channel.permissionOverwrites.cache.at(0)?.deny.toArray() ?? []
        const allowPermissions = channel.permissionOverwrites.cache.at(0)?.allow.toArray() ?? []
        const fullPermissions: [string, boolean][] = [
            ...allowPermissions.map(each => [each.toString(), true] as [string, boolean]),
            ...denyPermissions.map(each => [each.toString(), false] as [string, boolean])
        ]

        clonedChannels.push({
            id: channel.id,
            name: channel.name,
            parentId: channel.parentId,
            type: channel.type,
            pos: channel.position,
            perm: fullPermissions,
            pinnedMessages,
            isGuildAFKChannel: guild.afkChannelId == channel.id,
            isGuildSysChannel: guild.systemChannelId == channel.id,
        })
    }

    return clonedChannels
}

export default saveGuild