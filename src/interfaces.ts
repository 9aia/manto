import { PermissionsString } from "discord.js"

interface ClonedChannel {
    id:string,
    type: number,
    name: string,
    parentId: string | null,
    pos: number,
    perm: ([string,boolean])[],
    pinnedMessages: string[],
    isGuildAFKChannel:boolean,
    isGuildSysChannel:boolean
}

interface ClonedRole{
    id:string,
    perm:PermissionsString[],
    name:string,
    mentionable:boolean,
    color:number,
    emoji:string|null,
    icon:string|null,
    hoist:boolean,
}

interface ClonedGuild{
    roles:ClonedRole[],
    channels:ClonedChannel[],
}

export {ClonedChannel,ClonedRole,ClonedGuild}