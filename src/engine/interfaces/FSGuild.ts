type InactiveUserTimeout = "1min" | "5min" | "15min" | "30min" | "1h"

interface FSGuildConfig {
    server_name: string
    logo_url: string
    inactive_channel?: string
    inactive_timeout?: InactiveUserTimeout
    system_messages_channel?: string
    send_welcome_message?: boolean
    prompt_welcome_reply_sticky?: boolean
    send_boost_message?: boolean
    send_helpful_tips?: boolean
    default_notifications: "all_messages" | "only_mentions"
    show_boost_progress_bar?: boolean
    server_banner_background_url?: string
    server_invite_background_url?: string
}

export { FSGuildConfig }