import { CategoryChannel, Guild, PermissionsString } from "discord.js";
import { FSCategoryConfig } from "./interfaces/FSCategory";
import { FSChannelConfig, PermissionsFromSchema } from "./interfaces/FSChannel";

async function createCategory(guild: Guild, config: FSCategoryConfig, perms: { [key: string]: string[] }) {
    const parsedPerms = parseSchemaPermissions(perms)
    const c = await guild.channels.create({
        name: config.category_name,
        type: 4 // Category Channel
    }) as unknown as CategoryChannel

    // Apply permissions
    for (const parsedPerm of parsedPerms) {
        const target = parsedPerm.target == "@everyone" ? guild.roles.everyone : parsedPerm.target
        await c.permissionOverwrites.create(target, parsedPerm.perms)
    }

    return c
    // 
}

async function createChannel(guild: Guild, config: FSChannelConfig, parentId?: string) {
    const parsedPerms = parseSchemaPermissions(config.permissions ?? {} as any)

    let type = 0
    switch (config.type) {
        case "text":
            type = 0
            break;
        case "voice":
            type = 2
            break;
        default:
            break;
    }

    const c = await guild.channels.create({
        name: config.channel_name,
        type: type,
        parent: parentId
    }) as unknown as CategoryChannel

    // Apply permissions
    for (const parsedPerm of parsedPerms) {
        const target = parsedPerm.target == "@everyone" ? guild.roles.everyone : parsedPerm.target
        await c.permissionOverwrites.create(target, parsedPerm.perms)
    }

    return c
    // 
}

/** Parse permissions of a yaml configuration file in a usable mode for Discord.js */
function parseSchemaPermissions(rawPerms: { [key: string]: string[] }) {
    const permslist = Object.entries(rawPerms) as ([PermissionsFromSchema, string[]])[]

    let separated: any = {}

    permslist.forEach(permissionLine => {
        permissionLine[1].forEach(target => {
            if (!separated[target]) separated[target] = {}

            //Turn this "view_channel" in this "ViewChannel"
            const permKey = permissionLine[0].split("_").reduce((acc, next) => {
                let newText = next.slice(0, 1).toUpperCase() + next.slice(1)
                return acc + newText
            }, "")

            separated[target][permKey] = true
        })
    })

    // Return as object {target:roleOrUser,perms:AllPermsInUsableWay}
    return Object.entries(separated).map(each => {
        return {
            target: each[0],
            perms: each[1] as Partial<Record<PermissionsString, boolean>>
        }
    })
}

export { createCategory, createChannel }
export default { createCategory, createChannel }