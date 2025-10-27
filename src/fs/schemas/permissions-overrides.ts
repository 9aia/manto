import type { MantoSchema } from '../types'
import { PermissionFlagsBits } from 'discord.js'
import { z } from 'zod'
import { permissionOverrideSchema } from './components/permissions'

/**
 * Schema for permission overrides for all permissions.
 */
export const permissionOverridesSchema = z.looseObject(Object.fromEntries(
  Object.keys(PermissionFlagsBits).map(permission => [permission, permissionOverrideSchema.optional()]),
))
export type PermissionOverrides = z.infer<typeof permissionOverridesSchema>

export const MANTO_SCHEMA: MantoSchema = {
  id: 'permissions-overrides',
  zodSchema: permissionOverridesSchema,
}
