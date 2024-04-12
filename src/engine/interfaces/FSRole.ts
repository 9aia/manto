import { ColorResolvable, PermissionResolvable } from "discord.js";

interface FSRoleConfig {
    name: string;
    color: ColorResolvable;
    icon_url?: string
    separate_from_online: boolean
    allow_mention: boolean
    permissions?: PermissionResolvable
}

export { FSRoleConfig }