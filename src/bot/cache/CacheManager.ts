import type { CategoryChannel, Guild, TextChannel, VoiceChannel } from 'discord.js'
import type {
  CategoryState,
  ChannelState,
  GuildCachePaths,
  GuildState,
  RoleState,
  ServerState,
} from './types'
import { promises as fsPromises } from 'node:fs'
import path from 'node:path'

/**
 * Cache manager for tracking Discord server state
 */
export class CacheManager {
  private rootDir: string

  constructor(rootDir: string) {
    this.rootDir = rootDir
  }

  /**
   * Get the state directory path for a guild
   */
  private getStateDirectory(guildId: string): string {
    return path.join(this.rootDir, '.manto', guildId)
  }

  /**
   * Get cache file paths for a guild
   */
  private getCachePaths(guildId: string): GuildCachePaths {
    const stateDir = this.getStateDirectory(guildId)
    return {
      server: path.join(stateDir, 'server.json'),
      roles: path.join(stateDir, 'roles.json'),
      categories: path.join(stateDir, 'categories.json'),
      channels: path.join(stateDir, 'channels.json'),
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fsPromises.access(dirPath)
    }
    catch {
      await fsPromises.mkdir(dirPath, { recursive: true })
    }
  }

  /**
   * Load server state from cache
   */
  async loadServerState(guildId: string): Promise<ServerState | null> {
    try {
      const paths = this.getCachePaths(guildId)
      const data = await fsPromises.readFile(paths.server, 'utf-8')
      return JSON.parse(data)
    }
    catch {
      return null
    }
  }

  /**
   * Load roles state from cache
   */
  async loadRolesState(guildId: string): Promise<RoleState | null> {
    try {
      const paths = this.getCachePaths(guildId)
      const data = await fsPromises.readFile(paths.roles, 'utf-8')
      return JSON.parse(data)
    }
    catch {
      return null
    }
  }

  /**
   * Load categories state from cache
   */
  async loadCategoriesState(guildId: string): Promise<CategoryState | null> {
    try {
      const paths = this.getCachePaths(guildId)
      const data = await fsPromises.readFile(paths.categories, 'utf-8')
      return JSON.parse(data)
    }
    catch {
      return null
    }
  }

  /**
   * Load channels state from cache
   */
  async loadChannelsState(guildId: string): Promise<ChannelState | null> {
    try {
      const paths = this.getCachePaths(guildId)
      const data = await fsPromises.readFile(paths.channels, 'utf-8')
      return JSON.parse(data)
    }
    catch {
      return null
    }
  }

  /**
   * Load complete guild state from cache
   */
  async loadGuildState(guildId: string): Promise<GuildState> {
    const [server, roles, categories, channels] = await Promise.all([
      this.loadServerState(guildId),
      this.loadRolesState(guildId),
      this.loadCategoriesState(guildId),
      this.loadChannelsState(guildId),
    ])

    return { server, roles, categories, channels }
  }

  /**
   * Save server state to cache
   */
  async saveServerState(guild: Guild, serverConfig: any): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await this.ensureDirectoryExists(stateDir)

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

    const paths = this.getCachePaths(guild.id)
    await fsPromises.writeFile(paths.server, JSON.stringify(serverState, null, 2))
  }

  /**
   * Save roles state to cache
   */
  async saveRolesState(guild: Guild, rolesConfig: any[]): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await this.ensureDirectoryExists(stateDir)

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

    const paths = this.getCachePaths(guild.id)
    await fsPromises.writeFile(paths.roles, JSON.stringify(rolesState, null, 2))
  }

  /**
   * Save categories state to cache
   */
  async saveCategoriesState(guild: Guild, categories: Map<string, any>): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await this.ensureDirectoryExists(stateDir)

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
            overwrites: this.isParsedContent(categoryStructure.config) ? categoryStructure.config.data.overwrites : undefined,
          }
        }),
    }

    const paths = this.getCachePaths(guild.id)
    await fsPromises.writeFile(paths.categories, JSON.stringify(categoriesState, null, 2))
  }

  /**
   * Save channels state to cache
   */
  async saveChannelsState(guild: Guild, categories: Map<string, any>, resolveChannelName: (filePath: string) => string): Promise<void> {
    const stateDir = this.getStateDirectory(guild.id)
    await this.ensureDirectoryExists(stateDir)

    const channels: ChannelState['channels'] = []

    for (const [categoryName, categoryStructure] of categories) {
      let category: CategoryChannel | undefined

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

    const paths = this.getCachePaths(guild.id)
    await fsPromises.writeFile(paths.channels, JSON.stringify(channelsState, null, 2))
  }

  /**
   * Type guard to check if a value is ParsedContent
   */
  private isParsedContent<T>(value: any): value is { data: T } {
    return value !== null && typeof value === 'object' && 'data' in value && !('type' in value)
  }

  /**
   * Find role by name in cached state
   */
  async findRoleByName(guildId: string, roleName: string): Promise<RoleState['roles'][0] | null> {
    const rolesState = await this.loadRolesState(guildId)
    if (!rolesState)
      return null

    return rolesState.roles.find(role => role.name === roleName) || null
  }

  /**
   * Find category by name in cached state
   */
  async findCategoryByName(guildId: string, categoryName: string): Promise<CategoryState['categories'][0] | null> {
    const categoriesState = await this.loadCategoriesState(guildId)
    if (!categoriesState)
      return null

    return categoriesState.categories.find(category => category.name === categoryName) || null
  }

  /**
   * Find channel by name in cached state
   */
  async findChannelByName(guildId: string, channelName: string, categoryId?: string): Promise<ChannelState['channels'][0] | null> {
    const channelsState = await this.loadChannelsState(guildId)
    if (!channelsState)
      return null

    return channelsState.channels.find(channel =>
      channel.name === channelName
      && (categoryId ? channel.categoryId === categoryId : !channel.categoryId),
    ) || null
  }

  /**
   * Clear all cached state for a guild
   */
  async clearGuildState(guildId: string): Promise<void> {
    try {
      const stateDir = this.getStateDirectory(guildId)
      await fsPromises.rm(stateDir, { recursive: true, force: true })
    }
    catch {
      // Ignore errors if directory doesn't exist
    }
  }
}
