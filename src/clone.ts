import fs from 'fs'
import { ClonedChannel, ClonedGuild, ClonedRole } from './interfaces'
import { CategoryChannel, Guild, GuildChannelCreateOptions, PermissionsString, TextChannel, VoiceChannel } from 'discord.js'
import path from 'path'
import { dataDir } from './contants'

async function cloneGuild(guild: Guild, name: string) {
    // Delete all existent channels
    guild.channels.cache.forEach(each => each.delete())

    const filePath = path.resolve(dataDir, `${name}.json`)
    const fileContent = fs.readFileSync(filePath, "utf-8")
    const clonedGuild: ClonedGuild = JSON.parse(fileContent)

    await cloneChannels(guild, clonedGuild.channels)
    await cloneRoles(guild, clonedGuild.roles)


}

async function cloneRoles(guild: Guild, clonnedRoles: ClonedRole[]) {
    for (const clonedRole of clonnedRoles) {
        const roleAlreadyExists = guild.roles.cache.reduce((acum, next) => next.name == clonedRole.name ? true : acum, false)
        if (!roleAlreadyExists)
            guild.roles.create({
                color: clonedRole.color,
                name: clonedRole.name,
                hoist: clonedRole.hoist,
                icon: clonedRole.icon,
                mentionable: clonedRole.mentionable,
                permissions: clonedRole.perm,
                unicodeEmoji: clonedRole.emoji,
            })
    }

}
/** Clone the configuration of channels of guild */
async function cloneChannels(guild: Guild, clonedChannels: ClonedChannel[]) {
    const categoryChannels = new Map<string, CategoryChannel>()
    const otherChannels = new Map<string, TextChannel | VoiceChannel>()

    // Create first the Category Channels because they are parents of others
    for (const clonedChannel of clonedChannels.filter(each => each.type == 4)) {
        const returned = await guild.channels.create({
            name: clonedChannel.name,
            type: clonedChannel.type,
            parent: clonedChannel.parentId,
            position: clonedChannel.pos
        })
        categoryChannels.set(clonedChannel.id, returned as CategoryChannel)
    }

    for (const clonedChannel of clonedChannels.filter(each => each.type != 4)) {

        let newChannelData: GuildChannelCreateOptions = { name: clonedChannel.name, type: clonedChannel.type, position: clonedChannel.pos }

        if (clonedChannel.parentId) {
            // this adds the parent id of the 
            // new created category channel that is 
            // referencied by the old channel ID;
            // is like the old channel id is the 
            // new channel key in a object
            const parentRealChannel = categoryChannels.get(clonedChannel.parentId)
            if (!parentRealChannel)
                return console.log("No category channel reached in created labels")

            const newParentID = parentRealChannel.id
            newChannelData.parent = newParentID
        }

        const createdChannel = await guild.channels.create(newChannelData) as (TextChannel | VoiceChannel)

        if (createdChannel.type === 0 && clonedChannel.pinnedMessages.length > 0) {
            // Send and pin the cloned pinned messages in the new channel
            clonedChannel.pinnedMessages.forEach(async clonedPinMsg => {
                const newUnpinnedMessage = await createdChannel.send(clonedPinMsg)
                createdChannel.messages.pin(newUnpinnedMessage)
            })
        }

        if (clonedChannel.perm) {
            // Add the cloned channel permissions to the new channel
            let newPerms: { [key: string]: boolean } = {}

            clonedChannel.perm.forEach(perm => {
                newPerms[perm[0]] = perm[1]
            })

            createdChannel.permissionOverwrites.create(guild.roles.everyone, newPerms)
        }

        // Configure afk channel and system channel
        if (clonedChannel.isGuildAFKChannel) guild.setAFKChannel(createdChannel.id)
        if (clonedChannel.isGuildSysChannel) guild.setSystemChannel(createdChannel.id)

        otherChannels.set(clonedChannel.id, createdChannel)
    }
}

export default cloneGuild