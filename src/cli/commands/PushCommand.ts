import type { CategoryChannel, Guild, Role, TextChannel, VoiceChannel } from 'discord.js'
import { PermissionFlagsBits } from 'discord.js'
import type { RootDirStructure } from '../../fs/parser/root-parser'
import type { ParsedContent, ParserError } from '../../fs/parser/types'
import fs from 'node:fs'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'
import { confirm, select } from '@clack/prompts'
import { Option } from 'clipanion'
import { parseRootDir } from '../../fs/parser'
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
 * State management interfaces for tracking applied changes
 */
interface ServerState {
  guildId: string
  guildName: string
  appliedAt: string
  serverConfig: {
    name: string
    icon_url?: string
    banner_url?: string
    manto_version: string
  }
}

interface RoleState {
  guildId: string
  appliedAt: string
  roles: Array<{
    id: string
    name: string
    color: string
    hoist: boolean
    mentionable: boolean
    permissions: string[]
  }>
}

interface CategoryState {
  guildId: string
  appliedAt: string
  categories: Array<{
    id: string
    name: string
    overwrites?: any[]
  }>
}

interface ChannelState {
  guildId: string
  appliedAt: string
  channels: Array<{
    id: string
    name: string
    type: 'text' | 'voice'
    categoryId?: string
    topic?: string
    overwrites?: any[]
  }>
}

/**
 * Helper function to ensure directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fsPromises.access(dirPath)
  } catch {
    await fsPromises.mkdir(dirPath, { recursive: true })
  }
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

  /**
   * Get the state directory path for a guild
   */
  private getStateDirectory(guildId: string): string {
    return path.join(this.rootDir, '.manto', guildId)
  }

  /**
   * Save server state to JSON file
   */
  private async saveServerState(guild: Guild, serverConfig: any): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await ensureDirectoryExists(stateDir)

    const serverState: ServerState = {
      guildId: guild.id,
      guildName: guild.name,
      appliedAt: new Date().toISOString(),
      serverConfig: {
        name: serverConfig.name,
        icon_url: serverConfig.icon_url,
        banner_url: serverConfig.banner_url,
        manto_version: serverConfig.manto_version,
      },
    }

    const filePath = path.join(stateDir, 'server.json')
    await fsPromises.writeFile(filePath, JSON.stringify(serverState, null, 2))
    this.logger.debug(`💾 Saved server state to ${filePath}`)
  }

  /**
   * Save roles state to JSON file
   */
  private async saveRolesState(guild: Guild, rolesConfig: any[]): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await ensureDirectoryExists(stateDir)

    const rolesState: RoleState = {
      guildId: guild.id,
      appliedAt: new Date().toISOString(),
      roles: rolesConfig.map(roleConfig => ({
        id: guild.roles.cache.find(r => r.name === roleConfig.name)?.id || '',
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        mentionable: roleConfig.mentionable,
        permissions: roleConfig.permissions || [],
      })),
    }

    const filePath = path.join(stateDir, 'roles.json')
    await fsPromises.writeFile(filePath, JSON.stringify(rolesState, null, 2))
    this.logger.debug(`💾 Saved roles state to ${filePath}`)
  }

  /**
   * Save categories state to JSON file
   */
  private async saveCategoriesState(guild: Guild, categories: Map<string, any>): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await ensureDirectoryExists(stateDir)

    const categoriesState: CategoryState = {
      guildId: guild.id,
      appliedAt: new Date().toISOString(),
      categories: Array.from(categories.entries())
        .filter(([categoryName]) => categoryName !== '_') // Exclude "_" category
        .map(([categoryName, categoryStructure]) => {
          const category = guild.channels.cache.find(c => c.type === 4 && c.name === categoryName) as CategoryChannel | undefined
          return {
            id: category?.id || '',
            name: categoryName,
            overwrites: isParsedContent(categoryStructure.config) ? categoryStructure.config.data.overwrites : undefined,
          }
        }),
    }

    const filePath = path.join(stateDir, 'categories.json')
    await fsPromises.writeFile(filePath, JSON.stringify(categoriesState, null, 2))
    this.logger.debug(`💾 Saved categories state to ${filePath}`)
  }

  /**
   * Save channels state to JSON file
   */
  private async saveChannelsState(guild: Guild, categories: Map<string, any>): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await ensureDirectoryExists(stateDir)

    const channels: ChannelState['channels'] = []

    for (const [categoryName, categoryStructure] of categories) {
      let category: CategoryChannel | undefined = undefined
      
      // Handle "_" category specially - channels are root-level
      if (categoryName !== '_') {
        category = guild.channels.cache.find(c => c.type === 4 && c.name === categoryName) as CategoryChannel | undefined
      }

      // Add text channels
      for (const channelConfig of categoryStructure.textChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        const channel = categoryName === '_'
          ? guild.channels.cache.find(c => c.type === 0 && c.name === resolvedName && !c.parent) as TextChannel | undefined
          : category?.children.cache.find(c => c.type === 0 && c.name === resolvedName) as TextChannel | undefined
          
        if (channel) {
          channels.push({
            id: channel.id,
            name: resolvedName,
            type: 'text',
            categoryId: category?.id, // Will be undefined for root-level channels
            topic: channelConfig.data.topic,
            overwrites: channelConfig.data.overwrites,
          })
        }
      }

      // Add voice channels
      for (const channelConfig of categoryStructure.voiceChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        const channel = categoryName === '_'
          ? guild.channels.cache.find(c => c.type === 2 && c.name === resolvedName && !c.parent) as VoiceChannel | undefined
          : category?.children.cache.find(c => c.type === 2 && c.name === resolvedName) as VoiceChannel | undefined
          
        if (channel) {
          channels.push({
            id: channel.id,
            name: resolvedName,
            type: 'voice',
            categoryId: category?.id, // Will be undefined for root-level channels
            overwrites: channelConfig.data.overwrites,
          })
        }
      }
    }

    const channelsState: ChannelState = {
      guildId: guild.id,
      appliedAt: new Date().toISOString(),
      channels,
    }

    const filePath = path.join(stateDir, 'channels.json')
    await fsPromises.writeFile(filePath, JSON.stringify(channelsState, null, 2))
    this.logger.debug(`💾 Saved channels state to ${filePath}`)
  }

  private async push(rootDir: string) {
    const structure = await parseRootDir(rootDir)

    // Get Discord client and guild first
    const client = await this.getDiscordClient()
    const guild = await this.selectGuild(client)

    if (this.dryRun) {
      await this.dryRunPush(structure, guild)
    } else {
      await this.applyChanges(structure, guild)
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

  private async dryRunPush(structure: RootDirStructure, guild: Guild) {
    this.logger.info('🔍 DRY RUN MODE - No changes will be applied')
    this.logger.info(`Target guild: ${guild.name} (${guild.id})`)

    // Server changes
    if (isParsedContent(structure.server)) {
      this.logger.info('\n📋 Server Changes:')
      this.logger.info(`  Name: ${guild.name} → ${structure.server.data.name}`)
      if (structure.server.data.icon_url) {
        this.logger.info(`  Icon URL: ${guild.iconURL() || 'None'} → ${structure.server.data.icon_url}`)
      }
      if (structure.server.data.banner_url) {
        this.logger.info(`  Banner URL: ${guild.bannerURL() || 'None'} → ${structure.server.data.banner_url}`)
      }
    } else {
      const error = structure.server && 'message' in structure.server 
        ? structure.server.message 
        : 'Unknown error'
      this.logger.warn(`⚠️  Skipping server changes due to config error: ${error}`)
    }

    // Roles changes
    if (isParsedContent(structure.roles)) {
      this.logger.info('\n👥 Role Changes:')
      const existingRoles = guild.roles.cache.filter(role => !role.managed && role.name !== '@everyone')
      
      for (const roleConfig of structure.roles.data) {
        const existingRole = existingRoles.find(r => r.name === roleConfig.name)
        if (existingRole) {
          this.logger.info(`  Update role: ${roleConfig.name}`)
          this.logger.info(`    Color: ${existingRole.hexColor} → ${roleConfig.color}`)
          this.logger.info(`    Hoist: ${existingRole.hoist} → ${roleConfig.hoist}`)
          this.logger.info(`    Mentionable: ${existingRole.mentionable} → ${roleConfig.mentionable}`)
        } else {
          this.logger.info(`  Create role: ${roleConfig.name}`)
          this.logger.info(`    Color: ${roleConfig.color}`)
          this.logger.info(`    Hoist: ${roleConfig.hoist}`)
          this.logger.info(`    Mentionable: ${roleConfig.mentionable}`)
        }
      }
    } else {
      const error = structure.roles && 'message' in structure.roles 
        ? structure.roles.message 
        : 'Unknown error'
      this.logger.warn(`⚠️  Skipping role changes due to config error: ${error}`)
    }

    // Categories and channels
    this.logger.info('\n📁 Category & Channel Changes:')
    for (const [categoryName, categoryStructure] of structure.categories) {
      if (categoryName === '_') {
        this.logger.info(`  Root-level channels (no category):`)
      } else {
        const existingCategory = guild.channels.cache.find(
          c => c.type === 4 && c.name === categoryName
        ) as CategoryChannel | undefined

        if (existingCategory) {
          this.logger.info(`  Update category: ${categoryName}`)
        } else {
          this.logger.info(`  Create category: ${categoryName}`)
        }
      }

      // Text channels
      for (const channelConfig of categoryStructure.textChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        const existingChannel = categoryName === '_'
          ? guild.channels.cache.find(c => c.type === 0 && c.name === resolvedName && !c.parent) as TextChannel | undefined
          : (guild.channels.cache.find(c => c.type === 4 && c.name === categoryName) as CategoryChannel | undefined)?.children.cache.find((c: any) => c.type === 0 && c.name === resolvedName) as TextChannel | undefined

        if (existingChannel) {
          const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
          this.logger.info(`    Update text channel: ${resolvedName} (${location})`)
        } else {
          const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
          this.logger.info(`    Create text channel: ${resolvedName} (${location})`)
        }
      }

      // Voice channels
      for (const channelConfig of categoryStructure.voiceChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        const existingChannel = categoryName === '_'
          ? guild.channels.cache.find(c => c.type === 2 && c.name === resolvedName && !c.parent) as VoiceChannel | undefined
          : (guild.channels.cache.find(c => c.type === 4 && c.name === categoryName) as CategoryChannel | undefined)?.children.cache.find((c: any) => c.type === 2 && c.name === resolvedName) as VoiceChannel | undefined

        if (existingChannel) {
          const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
          this.logger.info(`    Update voice channel: ${resolvedName} (${location})`)
        } else {
          const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
          this.logger.info(`    Create voice channel: ${resolvedName} (${location})`)
        }
      }
    }
  }

  private async applyChanges(structure: RootDirStructure, guild: Guild) {
    this.logger.info(`🚀 Applying changes to guild: ${guild.name} (${guild.id})`)

    let hasErrors = false
    let serverApplied = false
    let rolesApplied = false
    let categoriesApplied = false

    // Apply server changes
    if (isParsedContent(structure.server)) {
      try {
        await this.applyServerChanges(structure.server.data, guild)
        serverApplied = true
      } catch (error) {
        this.logger.error(`❌ Error applying server changes: ${error}`)
        hasErrors = true
      }
    } else {
      const error = structure.server && 'message' in structure.server 
        ? structure.server.message 
        : 'Unknown error'
      this.logger.warn(`⚠️  Skipping server changes due to config error: ${error}`)
    }

    // Apply role changes
    if (isParsedContent(structure.roles)) {
      try {
        await this.applyRoleChanges(structure.roles.data, guild)
        rolesApplied = true
      } catch (error) {
        this.logger.error(`❌ Error applying role changes: ${error}`)
        hasErrors = true
      }
    } else {
      const error = structure.roles && 'message' in structure.roles 
        ? structure.roles.message 
        : 'Unknown error'
      this.logger.warn(`⚠️  Skipping role changes due to config error: ${error}`)
    }

    // Apply category and channel changes
    try {
      await this.applyCategoryChanges(structure.categories, guild)
      categoriesApplied = true
    } catch (error) {
      this.logger.error(`❌ Error applying category/channel changes: ${error}`)
      hasErrors = true
    }

    // Save state for successfully applied changes
    try {
      if (serverApplied && isParsedContent(structure.server)) {
        await this.saveServerState(guild, structure.server.data)
      }
      if (rolesApplied && isParsedContent(structure.roles)) {
        await this.saveRolesState(guild, structure.roles.data)
      }
      if (categoriesApplied) {
        await this.saveCategoriesState(guild, structure.categories)
        await this.saveChannelsState(guild, structure.categories)
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

  private async applyServerChanges(serverConfig: any, guild: Guild) {
    this.logger.info('📋 Applying server changes...')
    
    const updates: any = {}
    
    if (serverConfig.name && serverConfig.name !== guild.name) {
      updates.name = serverConfig.name
    }
    
    if (serverConfig.icon_url && serverConfig.icon_url !== guild.iconURL()) {
      // Note: Discord.js doesn't support setting icon from URL directly
      // This would need to be implemented with file upload
      this.logger.warn('⚠️  Icon URL changes require file upload - not implemented yet')
    }

    if (serverConfig.banner_url && serverConfig.banner_url !== guild.bannerURL()) {
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

  private async applyRoleChanges(rolesConfig: any[], guild: Guild) {
    this.logger.info('👥 Applying role changes...')
    
    for (const roleConfig of rolesConfig) {
      const existingRole = guild.roles.cache.find(r => r.name === roleConfig.name && !r.managed)
      
      if (existingRole) {
        // Update existing role
        const updates: any = {}
        
        if (roleConfig.color && roleConfig.color !== existingRole.hexColor) {
          updates.color = roleConfig.color
        }
        
        if (roleConfig.hoist !== existingRole.hoist) {
          updates.hoist = roleConfig.hoist
        }
        
        if (roleConfig.mentionable !== existingRole.mentionable) {
          updates.mentionable = roleConfig.mentionable
        }

        if (Object.keys(updates).length > 0) {
          await existingRole.edit(updates)
          this.logger.info(`✅ Updated role: ${roleConfig.name}`)
        } else {
          this.logger.info(`ℹ️  No changes needed for role: ${roleConfig.name}`)
        }
      } else {
        // Create new role
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
    }
  }

  private async applyCategoryChanges(categories: Map<string, any>, guild: Guild) {
    this.logger.info('📁 Applying category and channel changes...')
    
    for (const [categoryName, categoryStructure] of categories) {
      try {
        let category: CategoryChannel | undefined = undefined

        // Handle "_" category specially - channels go to root level
        if (categoryName === '_') {
          this.logger.info(`📁 Processing root-level channels (no category)`)
        } else {
          // Create or update real category
          category = guild.channels.cache.find(
            c => c.type === 4 && c.name === categoryName
          ) as CategoryChannel | undefined

          if (!category) {
            const categoryOptions: any = {
              name: categoryName,
              type: 4, // CategoryChannel
            }
            
            // Add permission overrides if config exists and is valid
            if (isParsedContent(categoryStructure.config) && categoryStructure.config.data.overwrites) {
              categoryOptions.permissionOverwrites = categoryStructure.config.data.overwrites
            }
            
            const newCategory = await guild.channels.create(categoryOptions)
            category = newCategory as unknown as CategoryChannel
            this.logger.info(`✅ Created category: ${categoryName}`)
          } else {
            this.logger.info(`ℹ️  Using existing category: ${categoryName}`)
          }
        }

        // Create/update text channels
        for (const channelConfig of categoryStructure.textChannels) {
          try {
            const resolvedName = resolveChannelName(channelConfig.filePath)
            
            // For root-level channels, search in guild channels directly
            const existingChannel = categoryName === '_' 
              ? guild.channels.cache.find(c => c.type === 0 && c.name === resolvedName && !c.parent) as TextChannel | undefined
              : category?.children.cache.find(c => c.type === 0 && c.name === resolvedName) as TextChannel | undefined

            if (!existingChannel) {
              const channelOptions: any = {
                name: resolvedName,
                type: 0, // TextChannel
              }
              
              // Only set parent if it's not a root-level channel
              if (categoryName !== '_' && category) {
                channelOptions.parent = category
              }
              
              if (channelConfig.data.topic) {
                channelOptions.topic = channelConfig.data.topic
              }
              
              if (channelConfig.data.overwrites) {
                channelOptions.permissionOverwrites = channelConfig.data.overwrites
              }
              
              await guild.channels.create(channelOptions)
              const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
              this.logger.info(`✅ Created text channel: ${resolvedName} (${location})`)
            } else {
              this.logger.info(`ℹ️  Using existing text channel: ${resolvedName}`)
            }
          } catch (error) {
            this.logger.error(`❌ Error creating text channel ${resolveChannelName(channelConfig.filePath)}: ${error}`)
          }
        }

        // Create/update voice channels
        for (const channelConfig of categoryStructure.voiceChannels) {
          try {
            const resolvedName = resolveChannelName(channelConfig.filePath)
            
            // For root-level channels, search in guild channels directly
            const existingChannel = categoryName === '_' 
              ? guild.channels.cache.find(c => c.type === 2 && c.name === resolvedName && !c.parent) as VoiceChannel | undefined
              : category?.children.cache.find(c => c.type === 2 && c.name === resolvedName) as VoiceChannel | undefined

            if (!existingChannel) {
              const channelOptions: any = {
                name: resolvedName,
                type: 2, // VoiceChannel
              }
              
              // Only set parent if it's not a root-level channel
              if (categoryName !== '_' && category) {
                channelOptions.parent = category
              }
              
              if (channelConfig.data.overwrites) {
                channelOptions.permissionOverwrites = channelConfig.data.overwrites
              }
              
              await guild.channels.create(channelOptions)
              const location = categoryName === '_' ? 'root level' : `in category ${categoryName}`
              this.logger.info(`✅ Created voice channel: ${resolvedName} (${location})`)
            } else {
              this.logger.info(`ℹ️  Using existing voice channel: ${resolvedName}`)
            }
          } catch (error) {
            this.logger.error(`❌ Error creating voice channel ${resolveChannelName(channelConfig.filePath)}: ${error}`)
          }
        }
      } catch (error) {
        this.logger.error(`❌ Error processing category ${categoryName}: ${error}`)
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
