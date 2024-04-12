interface FSRole {
    name: string;
    color: string;
    icon_url?: string
    separate_from_online: boolean
    allow_mention: boolean
    permissions?: string
}

export { FSRole }