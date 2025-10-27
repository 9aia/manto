import type { z } from 'zod'
import type { MantoSchema } from '../types'
import { baseChannelSchema } from './components/channel'

/**
 * Defines a voice channel for the Discord server.
 */
export const mantoVoiceChannelSchema = baseChannelSchema
  .describe('Defines a voice channel for the Discord server.')
export type MantoVoiceChannelSchema = z.infer<typeof mantoVoiceChannelSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'voice-channel',
  zodSchema: mantoVoiceChannelSchema,
}
