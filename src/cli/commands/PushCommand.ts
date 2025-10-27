import { confirm, select } from '@clack/prompts'
import { Option } from 'clipanion'
import type { CategoryChannel, Guild, TextChannel, VoiceChannel } from 'discord.js'
import { PermissionFlagsBits } from 'discord.js'
import fs from 'node:fs'
import path from 'node:path'
import { CacheManager, StateDiffer } from '../../bot/cache'
import { parseRootDir } from '../../fs/parser'
import type { RootDirStructure } from '../../fs/parser/root-parser'
import type { ParsedContent, ParserError } from '../../fs/parser/types'
import { DIR_PATH_REGEX } from '../constants/regex'
import { DjsCommand } from '../lib/DjsCommand'

/**
 * Type guard to check if a value is ParsedContent
 */
function isParsedContent<T>(value: ParsedContent<T> | ParserError): value is ParsedContent<T> {
  return value !== null && typeof value === 'object' && 'filePath' in value && !('type' in value)
}

/**
 * Convert permission names array to BigInt permissions
 */
function convertPermissionsToBigInt(permissions: string[]): bigint {
  let permissionBits = 0n
  
  for (const permission of permissions) {
    const permissionBit = PermissionFlagsBits[permission as keyof typeof PermissionFlagsBits]
    if (permissionBit) {
      permissionBits |= permissionBit
    } else {
      console.warn(`⚠️  Unknown permission: ${permission}`)
    }
  }
  
  return permissionBits
}


/**
 * Resolve channel name from filename, removing extensions, prefixes, and order numbers
 */
function resolveChannelName(filename: string): string {
  // Remove file extension
  let name = path.parse(filename).name
  
  // Remove order prefix (e.g., "1 " from "1 welcome")
  const orderMatch = name.match(/^\d+\s+(.+)$/)
  if (orderMatch) {
    name = orderMatch[1]
  }
  
  // Remove channel type prefix (T or V followed by space)
  name = name.replace(/^[TV]\s+/, '')
  
  // Convert to title case and replace underscores/hyphens with spaces
  name = name
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  
  return name
}

export class PushCommand extends DjsCommand {
  static paths = [['push']]

  rootDir = Option.String('--root-dir,-r', './', { description: 'Root directory of the Manto project.' })
  dryRun = Option.Boolean('--dry-run,-n', {
    description: 'Dry run the command, don\'t apply the changes to the server.',
  })

  dangerouslyClean = Option.Boolean('--dangerously-clean,-dc', {
    description: 'Clean the server. This is a dangerous operation and will remove all channels, categories and roles.',
  })

  guildId = Option.String('--guild-id,-g', {
    description: 'ID of the guild to clean. If not provided, all guilds the bot is in will be cleaned.',
    required: false,
  })

  private cacheManager: CacheManager | null = null

  private getCacheManager(): CacheManager {
    if (!this.cacheManager) {
      this.cacheManager = new CacheManager(this.rootDir)
    }
    return this.cacheManager
  }

  private async cleanServer() {
    const args = [
      this.dryRun ? '--dry-run' : undefined,
      this.guildId ? `--guild-id ${this.guildId}` : undefined,
    ].filter(Boolean) as string[]

    return await this.cli.run(['clean', ...args])
  }

  private async initializeProject(rootDir: string) {
    return this.cli.run(['init', rootDir])
  }

  private async push(rootDir: string) {
    const structure = await parseRootDir(rootDir)

    // Get Discord client and guild first
    const client = await this.getDiscordClient()
    const guild = await this.selectGuild(client)

    // Check for conflicts unless dangerously-clean is specified
    if (!this.dangerouslyClean) {
      await this.checkForConflicts(guild)
    }

    // Load cached state for comparison
    const cacheManager = this.getCacheManager()
    const cachedState = await cacheManager.loadGuildState(guild.id)

    // Detect changes
    const changeDetection = await StateDiffer.detectChanges(guild, structure, cachedState, resolveChannelName)

    if (this.dryRun) {
      await this.dryRunPush(structure, guild, changeDetection)
    } else {
      await this.applyChanges(structure, guild, changeDetection)
    }
  }

  private async selectGuild(client: any): Promise<Guild> {
    if (this.guildId) {
      const guild = client.guilds.cache.get(this.guildId)
      if (!guild) {
        throw new Error(`Guild with ID ${this.guildId} not found or bot not in guild`)
      }
      return guild
    }

    const guilds = client.guilds.cache.map((guild: Guild) => ({
      value: guild.id,
      label: `${guild.name} (${guild.id})`,
    }))

    if (guilds.length === 0) {
      throw new Error('Bot is not in any guilds')
    }

    if (guilds.length === 1) {
      return client.guilds.cache.get(guilds[0].value)
    }

    const selectedGuildId = await select({
      message: 'Select a guild to apply changes to:',
      options: guilds,
    })

    if (!selectedGuildId) {
      throw new Error('No guild selected')
    }

    return client.guilds.cache.get(selectedGuildId as string)
  }

  private async checkForConflicts(guild: Guild): Promise<void> {
    const cacheManager = this.getCacheManager()
    const cachedState = await cacheManager.loadGuildState(guild.id)
    
    // If there's cached state, no conflicts (server was previously managed by Manto)
    if (cachedState.server || cachedState.roles || cachedState.categories || cachedState.channels) {
      return
    }

    // Check for existing channels (excluding system channels)
    const existingChannels = guild.channels.cache.filter(channel => {
      // Skip system channels that Discord requires
      if (channel.type === 0 && channel.name === 'general') return false
      if (channel.type === 2 && channel.name === 'General') return false
      // Skip system channels (rules, announcements, etc.)
      if (channel.type === 5) return false // Announcement channel
      if (channel.type === 15) return false // Forum channel
      return true
    })

    // Check for existing roles (excluding @everyone and managed roles)
    const existingRoles = guild.roles.cache.filter(role => {
      if (role.name === '@everyone') return false
      if (role.managed) return false
      return true
    })

    const conflicts: string[] = []

    if (existingChannels.size > 0) {
      conflicts.push(`Found ${existingChannels.size} existing channels:`)
      existingChannels.forEach(channel => {
        const channelType = channel.type === 0 ? 'Text' : 
                           channel.type === 2 ? 'Voice' : 
                           channel.type === 4 ? 'Category' :
                           channel.type === 5 ? 'Announcement' :
                           channel.type === 15 ? 'Forum' : 'Unknown'
        conflicts.push(`  - ${channelType}: ${channel.name} (${channel.id})`)
      })
    }

    if (existingRoles.size > 0) {
      conflicts.push(`Found ${existingRoles.size} existing roles:`)
      existingRoles.forEach(role => {
        conflicts.push(`  - ${role.name} (${role.id})`)
      })
    }

    if (conflicts.length > 0) {
      this.logger.error('❌ CONFLICT DETECTED: Server is not empty!')
      this.logger.error('')
      conflicts.forEach(conflict => this.logger.error(conflict))
      this.logger.error('')
      this.logger.error('The server must be empty (except for Discord\'s required channels/roles) to apply Manto configuration.')
      this.logger.error('')
      this.logger.error('Options:')
      this.logger.error('  1. Use --dangerously-clean to remove all existing channels and roles')
      this.logger.error('  2. Manually clean the server first')
      this.logger.error('  3. Use a different empty server')
      this.logger.error('')
      throw new Error('Server conflict detected - server is not empty')
    }
  }

  private async dryRunPush(structure: RootDirStructure, guild: Guild, changeDetection: any) {
    this.logger.info('🔍 DRY RUN MODE - No changes will be applied')
    this.logger.info(`Target guild: ${guild.name} (${guild.id})`)

    if (!changeDetection.hasChanges) {
      this.logger.info('\n✅ No changes detected - everything is up to date!')
      return
    }

    this.logger.info('\n📋 Changes detected:')

    // Server changes
    if (changeDetection.changes.server?.hasChanges) {
      this.logger.info('\n📋 Server Changes:')
      const changes = changeDetection.changes.server.changes
      if (changes.name) {
        this.logger.info(`  Name: ${changes.name.from} → ${changes.name.to}`)
      }
      if (changes.icon_url) {
        this.logger.info(`  Icon URL: ${changes.icon_url.from || 'None'} → ${changes.icon_url.to || 'None'}`)
      }
      if (changes.banner_url) {
        this.logger.info(`  Banner URL: ${changes.banner_url.from || 'None'} → ${changes.banner_url.to || 'None'}`)
      }
    }

    // Role changes
    if (changeDetection.changes.roles?.hasChanges) {
      this.logger.info('\n👥 Role Changes:')
      const changes = changeDetection.changes.roles
      
      if (changes.toCreate.length > 0) {
        this.logger.info(`  Create roles: ${changes.toCreate.map((r: any) => r.name).join(', ')}`)
      }
      if (changes.toUpdate.length > 0) {
        for (const update of changes.toUpdate) {
          this.logger.info(`  Update role: ${update.name}`)
          Object.entries(update.changes).forEach(([key, change]: [string, any]) => {
            this.logger.info(`    ${key}: ${change.from} → ${change.to}`)
          })
        }
      }
      if (changes.toDelete.length > 0) {
        this.logger.info(`  Delete roles: ${changes.toDelete.map((r: any) => r.name).join(', ')}`)
      }
    }

    // Category changes
    if (changeDetection.changes.categories?.hasChanges) {
      this.logger.info('\n📁 Category Changes:')
      const changes = changeDetection.changes.categories
      
      if (changes.toCreate.length > 0) {
        this.logger.info(`  Create categories: ${changes.toCreate.map((c: any) => c.name).join(', ')}`)
      }
      if (changes.toUpdate.length > 0) {
        this.logger.info(`  Update categories: ${changes.toUpdate.map((c: any) => c.name).join(', ')}`)
      }
      if (changes.toDelete.length > 0) {
        this.logger.info(`  Delete categories: ${changes.toDelete.map((c: any) => c.name).join(', ')}`)
      }
    }

    // Channel changes
    if (changeDetection.changes.channels?.hasChanges) {
      this.logger.info('\n💬 Channel Changes:')
      const changes = changeDetection.changes.channels
      
      if (changes.toCreate.length > 0) {
        this.logger.info(`  Create channels: ${changes.toCreate.map((c: any) => `${c.name} (${c.type})`).join(', ')}`)
      }
      if (changes.toUpdate.length > 0) {
        for (const update of changes.toUpdate) {
          this.logger.info(`  Update channel: ${update.name}`)
          Object.entries(update.changes).forEach(([key, change]: [string, any]) => {
            if (key === 'topic') {
              this.logger.info(`    ${key}: ${change.from || 'None'} → ${change.to || 'None'}`)
            } else {
              this.logger.info(`    ${key}: updated`)
            }
          })
        }
      }
      if (changes.toDelete.length > 0) {
        this.logger.info(`  Delete channels: ${changes.toDelete.map((c: any) => `${c.name} (${c.type})`).join(', ')}`)
      }
    }
  }

  private async applyChanges(structure: RootDirStructure, guild: Guild, changeDetection: any) {
    this.logger.info(`🚀 Applying changes to guild: ${guild.name} (${guild.id})`)

    if (!changeDetection.hasChanges) {
      this.logger.info('✅ No changes detected - everything is up to date!')
      return
    }

    let hasErrors = false
    let serverApplied = false
    let rolesApplied = false
    let categoriesApplied = false

    // Apply server changes
    if (changeDetection.changes.server?.hasChanges) {
      try {
        await this.applyServerChanges(isParsedContent(structure.server) ? structure.server.data : null, guild, changeDetection.changes.server)
        serverApplied = true
      } catch (error) {
        this.logger.error(`❌ Error applying server changes: ${error}`)
        hasErrors = true
      }
    }

    // Apply role changes
    if (changeDetection.changes.roles?.hasChanges) {
      try {
        await this.applyRoleChanges(guild, changeDetection.changes.roles)
        rolesApplied = true
      } catch (error) {
        this.logger.error(`❌ Error applying role changes: ${error}`)
        hasErrors = true
      }
    }

    // Apply category and channel changes
    if (changeDetection.changes.categories?.hasChanges || changeDetection.changes.channels?.hasChanges) {
      try {
        await this.applyCategoryChanges(guild, changeDetection.changes.categories, changeDetection.changes.channels)
        categoriesApplied = true
      } catch (error) {
        this.logger.error(`❌ Error applying category/channel changes: ${error}`)
        hasErrors = true
      }
    }

    // Save state for successfully applied changes
    try {
      const cacheManager = this.getCacheManager()
      if (serverApplied && isParsedContent(structure.server)) {
        await cacheManager.saveServerState(guild, structure.server.data)
      }
      if (rolesApplied && isParsedContent(structure.roles)) {
        await cacheManager.saveRolesState(guild, structure.roles.data)
      }
      if (categoriesApplied) {
        await cacheManager.saveCategoriesState(guild, structure.categories)
        await cacheManager.saveChannelsState(guild, structure.categories, resolveChannelName)
      }
      this.logger.info('💾 State saved successfully')
    } catch (error) {
      this.logger.warn(`⚠️  Failed to save state: ${error}`)
    }

    if (hasErrors) {
      this.logger.warn('⚠️  Some changes failed to apply, but others may have succeeded')
    } else {
      this.logger.info('✅ All changes applied successfully!')
    }
  }

  private async applyServerChanges(serverConfig: any, guild: Guild, serverChanges: any) {
    this.logger.info('📋 Applying server changes...')
    
    const updates: any = {}
    const changes = serverChanges.changes
    
    if (changes.name) {
      updates.name = changes.name.to
    }
    
    if (changes.icon_url) {
      // Note: Discord.js doesn't support setting icon from URL directly
      // This would need to be implemented with file upload
      this.logger.warn('⚠️  Icon URL changes require file upload - not implemented yet')
    }

    if (changes.banner_url) {
      // Note: Discord.js doesn't support setting banner from URL directly
      // This would need to be implemented with file upload
      this.logger.warn('⚠️  Banner URL changes require file upload - not implemented yet')
    }

    if (Object.keys(updates).length > 0) {
      await guild.edit(updates)
      this.logger.info('✅ Server settings updated')
    } else {
      this.logger.info('ℹ️  No server changes needed')
    }
  }

  private async applyRoleChanges(guild: Guild, roleChanges: any) {
    this.logger.info('👥 Applying role changes...')
    
    // Create new roles
    for (const roleConfig of roleChanges.toCreate) {
      const roleOptions: any = {
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        mentionable: roleConfig.mentionable,
      }
      
      if (roleConfig.permissions && Array.isArray(roleConfig.permissions)) {
        roleOptions.permissions = convertPermissionsToBigInt(roleConfig.permissions)
      }
      
      await guild.roles.create(roleOptions)
      this.logger.info(`✅ Created role: ${roleConfig.name}`)
    }

    // Update existing roles
    for (const update of roleChanges.toUpdate) {
      const role = guild.roles.cache.get(update.id)
      if (role) {
        const updates: any = {}
        
        if (update.changes.color) {
          updates.color = update.changes.color.to
        }
        
        if (update.changes.hoist) {
          updates.hoist = update.changes.hoist.to
        }
        
        if (update.changes.mentionable) {
          updates.mentionable = update.changes.mentionable.to
        }

        await role.edit(updates)
        this.logger.info(`✅ Updated role: ${update.name}`)
      }
    }

    // Delete removed roles
    for (const deleteRole of roleChanges.toDelete) {
      const role = guild.roles.cache.get(deleteRole.id)
      if (role) {
        await role.delete()
        this.logger.info(`✅ Deleted role: ${deleteRole.name}`)
      }
    }
  }

  private async applyCategoryChanges(guild: Guild, categoryChanges: any, channelChanges: any) {
    this.logger.info('📁 Applying category and channel changes...')
    
    // Apply category changes
    if (categoryChanges?.hasChanges) {
      // Create new categories
      for (const categoryConfig of categoryChanges.toCreate) {
        const categoryOptions: any = {
          name: categoryConfig.name,
          type: 4, // CategoryChannel
        }
        
        if (categoryConfig.overwrites) {
          categoryOptions.permissionOverwrites = categoryConfig.overwrites
        }
        
        await guild.channels.create(categoryOptions)
        this.logger.info(`✅ Created category: ${categoryConfig.name}`)
      }

      // Update existing categories
      for (const update of categoryChanges.toUpdate) {
        const category = guild.channels.cache.get(update.id) as CategoryChannel | undefined
        if (category) {
          const updates: any = {}
          
          if (update.changes.overwrites) {
            updates.permissionOverwrites = update.changes.overwrites.to
          }

          await category.edit(updates)
          this.logger.info(`✅ Updated category: ${update.name}`)
        }
      }

      // Delete removed categories
      for (const deleteCategory of categoryChanges.toDelete) {
        const category = guild.channels.cache.get(deleteCategory.id) as CategoryChannel | undefined
        if (category) {
          await category.delete()
          this.logger.info(`✅ Deleted category: ${deleteCategory.name}`)
        }
      }
    }

    // Apply channel changes
    if (channelChanges?.hasChanges) {
      // Create new channels
      for (const channelConfig of channelChanges.toCreate) {
        const channelOptions: any = {
          name: channelConfig.name,
          type: channelConfig.type === 'text' ? 0 : 2,
        }
        
        if (channelConfig.categoryId) {
          channelOptions.parent = channelConfig.categoryId
        }
        
        if (channelConfig.topic) {
          channelOptions.topic = channelConfig.topic
        }
        
        if (channelConfig.overwrites) {
          channelOptions.permissionOverwrites = channelConfig.overwrites
        }
        
        await guild.channels.create(channelOptions)
        const location = channelConfig.categoryId ? `in category` : 'root level'
        this.logger.info(`✅ Created ${channelConfig.type} channel: ${channelConfig.name} (${location})`)
      }

      // Update existing channels
      for (const update of channelChanges.toUpdate) {
        const channel = guild.channels.cache.get(update.id) as TextChannel | VoiceChannel | undefined
        if (channel) {
          const updates: any = {}
          
          if (update.changes.topic) {
            updates.topic = update.changes.topic.to
          }
          
          if (update.changes.overwrites) {
            updates.permissionOverwrites = update.changes.overwrites.to
          }

          await channel.edit(updates)
          this.logger.info(`✅ Updated channel: ${update.name}`)
        }
      }

      // Delete removed channels
      for (const deleteChannel of channelChanges.toDelete) {
        const channel = guild.channels.cache.get(deleteChannel.id) as TextChannel | VoiceChannel | undefined
        if (channel) {
          await channel.delete()
          this.logger.info(`✅ Deleted ${deleteChannel.type} channel: ${deleteChannel.name}`)
        }
      }
    }
  }

  async execute() {
    if (!DIR_PATH_REGEX.test(this.rootDir)) {
      this.logger.error(`Invalid root directory: ${this.rootDir}`)
      return
    }

    if (this.dangerouslyClean) {
      return this.cleanServer()
    }

    if (!fs.existsSync(this.rootDir)) {
      const shouldRunInit = await confirm({
        message: `The specified root directory "${this.rootDir}" does not exist. Would you like to create it and initialize a new Manto project there?`,
      })
      if (!shouldRunInit) {
        this.logger.warn(`Root directory does not exist: ${this.rootDir} (NO-OP)`)
        return
      }

      const result = await this.initializeProject(this.rootDir)
      if (result !== 0) {
        return result
      }
    }

    await this.push(this.rootDir)

    await this.terminateDiscordClientManager()
  }
}
