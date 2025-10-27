import { z } from 'zod'
import { permissionsSchema } from '../permissions'

/**
 * Slow mode delay options for Discord channels
 */
export const slowModeSchema = z.enum([
  'off',
  '5s',
  '10s',
  '15s',
  '30s',
  '1m',
  '2m',
  '5m',
  '10m',
  '15m',
  '30m',
  '1h',
  '2h',
  '6h',
])
export type SlowMode = z.infer<typeof slowModeSchema>

/**
 * Thread auto-archive duration options for Discord channels
 */
export const hideThreadsAfterSchema = z.enum(['1h', '24h', '3d', '1w'])
export type HideThreadsAfter = z.infer<typeof hideThreadsAfterSchema>

/**
 * Permission overwrites for a specific role in a channel
 */
export const channelOverwriteSchema = z.object({
  role: z.string().describe('The role to apply the permissions to.'),
  get permissions() {
    return permissionsSchema
  },
})
export type ChannelOverwrite = z.infer<typeof channelOverwriteSchema>

/**
 * Base channel properties shared between text and voice channels
 */
export const baseChannelSchema = z.object({
  id: z.string().optional().describe('The unique identifier for the channel. It is automatically generated, you should not change it unless you know what you are doing.'),
  name: z.string().optional().describe('The name for the channel. If not provided, the name of the channel will be the name of the file.'),
  topic: z.string().optional().describe('(Optional) The channel topic displayed at the top.'),
  slow_mode: slowModeSchema.optional().describe('The slow mode delay for the channel.'),
  nsfw: z.boolean().optional().describe('Whether the channel is age-restricted (18+).'),
  hide_threads_after: hideThreadsAfterSchema.optional().describe('The duration after which threads in this channel automatically archive.'),
  overwrites: z.array(channelOverwriteSchema).optional().describe('(Optional) Overwrites for this channel.'),
})
export type BaseChannel = z.infer<typeof baseChannelSchema>
