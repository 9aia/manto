import type { MantoSchema } from '../types'
import { z } from 'zod'
import { discordPermissionSchema, permissionOverrideSchema } from './components/permissions'

/**
 * Permissions for a role within a channel
 */
export const permissionsSchema = z
  .record(discordPermissionSchema, permissionOverrideSchema)
  .optional()
  .describe('(Optional) Permissions for this role within this channel.')
export type Permissions = z.infer<typeof permissionsSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'permissions',
  zodSchema: permissionsSchema,
}
