type SlowModeString = "off" | "5s" | "10s" | "15s" | "30s" | "1m" | "2m" | "5m" | "10m" | "15m" | "30m" | "1h" | "2h" | "6h";
type HideThreadString = "1h" | "24h" | "3d" | "1w"
type ChannelType = "voice" | "text"

interface FSChannelConfig {
    channel_name: string;
    type: ChannelType;
    category?: string;
    permissions?: { [key: string]: string[] };
    topic?: string;
    slow_mode: SlowModeString
    age_restricted: boolean;
    hide_threads_after?: HideThreadString;
}

type PermissionsFromSchema =
    "view_channel" |
    "create_instant_invite" |
    "manage_channels" |
    "add_reactions" |
    "send_messages" |
    "send_tts_messages" |
    "manage_messages" |
    "embed_links" |
    "attach_files" |
    "read_message_history" |
    "mention_everyone" |
    "use_external_emojis" |
    "manage_roles" |
    "manage_webhooks" |
    "use_application_commands" |
    "manage_threads" |
    "create_public_threads" |
    "create_private_threads" |
    "use_external_stickers" |
    "send_messages_in_threads" |
    "use_embedded_activities" |
    "send_voice_messages" |
    "create_instant_envites" |
    "kick_members" |
    "ban_members" |
    "administrator" |
    "manage_guild" |
    "view_audit_log" |
    "priority_speaker" |
    "stream" |
    "view_guild_insights" |
    "connect" |
    "speak" |
    "mute_members" |
    "deafen_members" |
    "move_members" |
    "use_vad" |
    "change_nickname" |
    "manage_nicknames" |
    "manage_emojis_and_stickers" |
    "manage_guild_expressions" |
    "request_to_speak" |
    "manage_events" |
    "moderate_members" |
    "view_creator_monetization_analytics" |
    "use_soundboard" |
    "use_external_sounds";




export { FSChannelConfig, ChannelType, HideThreadString, PermissionsFromSchema, SlowModeString };