import type { z } from 'zod'
import type { MantoSchema } from '../types'
import { baseChannelSchema } from './components/channel'

/**
 * Defines a text channel for the Discord server.
 */
export const mantoTextChannelSchema = baseChannelSchema
  .describe('Defines a text channel for the Discord server.')
export type MantoTextChannel = z.infer<typeof mantoTextChannelSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'text-channel',
  zodSchema: mantoTextChannelSchema,
}
