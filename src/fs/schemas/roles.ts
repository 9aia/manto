import type { MantoSchema } from '../types'
import { z } from 'zod'
import { discordPermissionSchema } from './components/permissions'

/**
 * Defines a role for the Discord server.
 */
export const mantoRoleSchema = z.object({
  id: z.string().regex(/^\d{17,20}$/, 'Invalid role ID').optional().describe('The unique identifier for the role. It is automatically generated, you should not change it unless you know what you are doing.'),
  name: z.string().describe('The name of the role.'),
  color: z.string().regex(/^#([0-9a-f]{6})$/i, 'Invalid hexadecimal color code (e.g., #0000ff)').describe('The hexadecimal color code for the role (e.g., #0000ff).'),
  icon_url: z.string().optional().describe('(Optional) The URL for the role\'s icon.'),
  hoist: z.boolean().optional().describe('Whether to separate members with this role from online users.'),
  mentionable: z.boolean().optional().describe('Whether to allow members with this role to be mentioned.'),
  permissions: z.array(discordPermissionSchema).optional().describe('(Optional) A list of permissions for this role.'),
})
  .describe('Defines roles for the Discord server.')
export type MantoRoleSchema = z.infer<typeof mantoRoleSchema>

/**
 * Array of roles for the Discord server.
 */
export const mantoRolesSchema = z.array(mantoRoleSchema)
  .describe('(Optional) The roles for the server.')
export type MantoRolesSchema = z.infer<typeof mantoRolesSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'roles',
  zodSchema: mantoRolesSchema,
}
