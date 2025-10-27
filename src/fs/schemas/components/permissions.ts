import { PermissionFlagsBits } from 'discord.js'
import { z } from 'zod'

/**
 * Permission override values for Discord permissions
 */
export const permissionOverrideSchema = z.enum(['Allow', 'Deny', 'Default'])
export type PermissionOverride = z.infer<typeof permissionOverrideSchema>

/**
 * Discord permission names from PermissionFlagsBits
 */
export const discordPermissionSchema = z.enum(Object.keys(PermissionFlagsBits))
export type DiscordPermission = z.infer<typeof discordPermissionSchema>
