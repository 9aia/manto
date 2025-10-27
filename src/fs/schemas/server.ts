import type { MantoSchema } from '../types'
import { z } from 'zod'

/**
 * AFK timeout options for Discord server
 */
export const afkTimeoutSchema = z.enum(['1min', '5min', '15min', '30min', '1h'])
export type AfkTimeout = z.infer<typeof afkTimeoutSchema>

/**
 * Default notification settings for Discord server
 */
export const defaultNotificationsSchema = z.enum(['all_messages', 'only_mentions'])
export type DefaultNotifications = z.infer<typeof defaultNotificationsSchema>

/**
 * Defines general settings for the Discord server.
 */
export const mantoServerSchema = z.object({
  manto_version: z.string().regex(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-z-][0-9a-z-]*))*))?(?:\+([0-9a-z-]+(?:\.[0-9a-z-]+)*))?$/i, 'Invalid semantic version').describe('The version of the manto schema. https://semver.org/'),
  id: z.string().optional().describe('The unique identifier for the Discord server. It is automatically generated, you should not change it unless you know what you are doing.'),
  name: z.string().describe('The name of the Discord server.'),
  icon_url: z.string().optional().describe('(Optional) The URL for the server\'s icon.'),
  afk_channel: z.string().optional().describe('(Optional) The name of the channel to move inactive users to.'),
  afk_timeout: afkTimeoutSchema.optional().describe('(Optional) The amount of time before an idle user is considered inactive.'),
  system_channel: z.string().optional().describe('(Optional) The name of the channel to send system messages to.'),
  default_notifications: defaultNotificationsSchema.optional().describe('(Optional) The default notification settings for members.'),
  enable_premium_progress_bar: z.boolean().optional().describe('Whether to show the server boost progress bar.'),
  banner_url: z.string().optional().describe('(Optional) The URL for the server banner background image.'),
})
  .describe('Defines general settings for the Discord server.')
export type MantoServerSchema = z.infer<typeof mantoServerSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'server',
  zodSchema: mantoServerSchema,
}
