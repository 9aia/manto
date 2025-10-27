import type { MantoSchema } from '../types'
import { z } from 'zod'
import { permissionOverridesSchema } from './permissions-overrides'

/**
 * Permission overwrites for a specific role
 */
export const categoryOverwriteSchema = z.object({
  role: z.string().describe('The role to apply the permissions to.'),
  permissions: permissionOverridesSchema
    .optional()
    .describe('Permissions for this role within this category.'),
})
export type CategoryOverwrite = z.infer<typeof categoryOverwriteSchema>

/**
 * Defines a category for the Discord server.
 */
export const mantoCategorySchema = z.object({
  id: z.string().regex(/^\d{17,20}$/, 'Invalid category ID').describe('The unique identifier for the category. It is automatically generated, you should not change it unless you know what you are doing.'),
  name: z.string().optional().describe('Name for the category. If not provided, the name of the category will be the name of the directory.'),
  overwrites: z.array(categoryOverwriteSchema).optional().describe('Overwrites for this category.'),
})
  .describe('Defines a category for the Discord server.')
export type MantoCategory = z.infer<typeof mantoCategorySchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'category',
  zodSchema: mantoCategorySchema,
}
