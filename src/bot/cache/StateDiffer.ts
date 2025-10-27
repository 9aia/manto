import type { Guild } from 'discord.js'
import type {
  CategoryState,
  ChannelState,
  RoleState,
  ServerState,
} from './types'

/**
 * Change detection results
 */
export interface ChangeDetection {
  hasChanges: boolean
  changes: {
    server: ServerChanges | null
    roles: RoleChanges | null
    categories: CategoryChanges | null
    channels: ChannelChanges | null
  }
}

export interface ServerChanges {
  hasChanges: boolean
  changes: {
    name?: { from: string, to: string }
    icon_url?: { from: string | null, to: string | null }
    banner_url?: { from: string | null, to: string | null }
  }
}

export interface RoleChanges {
  hasChanges: boolean
  toCreate: Array<{ name: string, color: string, hoist: boolean, mentionable: boolean, permissions: string[] }>
  toUpdate: Array<{ id: string, name: string, changes: { color?: { from: string, to: string }, hoist?: { from: boolean, to: boolean }, mentionable?: { from: boolean, to: boolean } } }>
  toDelete: Array<{ id: string, name: string }>
}

export interface CategoryChanges {
  hasChanges: boolean
  toCreate: Array<{ name: string, overwrites?: any[] }>
  toUpdate: Array<{ id: string, name: string, changes: { overwrites?: { from: any[], to: any[] } } }>
  toDelete: Array<{ id: string, name: string }>
}

export interface ChannelChanges {
  hasChanges: boolean
  toCreate: Array<{ name: string, type: 'text' | 'voice', categoryId?: string, topic?: string, overwrites?: any[] }>
  toUpdate: Array<{ id: string, name: string, changes: { topic?: { from: string | null, to: string | null }, overwrites?: { from: any[], to: any[] } } }>
  toDelete: Array<{ id: string, name: string, type: 'text' | 'voice' }>
}

/**
 * Diffing utility for comparing current state with cached state
 */
export class StateDiffer {
  /**
   * Detect changes between current configuration and cached state
   */
  static async detectChanges(
    guild: Guild,
    structure: any,
    cachedState: any,
    resolveChannelName: (filePath: string) => string,
  ): Promise<ChangeDetection> {
    const changes = {
      server: await this.detectServerChanges(guild, structure.server, cachedState.server),
      roles: await this.detectRoleChanges(guild, structure.roles, cachedState.roles),
      categories: await this.detectCategoryChanges(guild, structure.categories, cachedState.categories),
      channels: await this.detectChannelChanges(guild, structure.categories, cachedState.channels, resolveChannelName),
    }

    const hasChanges = Object.values(changes).some(change => change?.hasChanges)

    return {
      hasChanges,
      changes,
    }
  }

  /**
   * Detect server configuration changes
   */
  private static async detectServerChanges(
    guild: Guild,
    currentServer: any,
    cachedServer: ServerState | null,
  ): Promise<ServerChanges | null> {
    if (!currentServer) {
      return null
    }

    // If no cached server, treat as first-time setup - no changes needed for server
    if (!cachedServer) {
      return {
        hasChanges: false,
        changes: {},
      }
    }

    const changes: ServerChanges['changes'] = {}

    // Check name changes
    if (currentServer.data.name !== cachedServer.serverConfig.name) {
      changes.name = { from: cachedServer.serverConfig.name, to: currentServer.data.name }
    }

    // Check icon changes
    const currentIcon = currentServer.data.icon_url || null
    const cachedIcon = cachedServer.serverConfig.icon_url || null
    if (currentIcon !== cachedIcon) {
      changes.icon_url = { from: cachedIcon, to: currentIcon }
    }

    // Check banner changes
    const currentBanner = currentServer.data.banner_url || null
    const cachedBanner = cachedServer.serverConfig.banner_url || null
    if (currentBanner !== cachedBanner) {
      changes.banner_url = { from: cachedBanner, to: currentBanner }
    }

    const hasChanges = Object.keys(changes).length > 0

    return {
      hasChanges,
      changes,
    }
  }

  /**
   * Detect role changes
   */
  private static async detectRoleChanges(
    guild: Guild,
    currentRoles: any,
    cachedRoles: RoleState | null,
  ): Promise<RoleChanges | null> {
    if (!currentRoles) {
      return null
    }

    // If no cached roles, treat as first-time setup - all roles need to be created
    if (!cachedRoles) {
      const toCreate: RoleChanges['toCreate'] = currentRoles.data.map((roleConfig: any) => ({
        name: roleConfig.name,
        color: roleConfig.color,
        hoist: roleConfig.hoist,
        mentionable: roleConfig.mentionable,
        permissions: roleConfig.permissions || [],
      }))

      return {
        hasChanges: toCreate.length > 0,
        toCreate,
        toUpdate: [],
        toDelete: [],
      }
    }

    const toCreate: RoleChanges['toCreate'] = []
    const toUpdate: RoleChanges['toUpdate'] = []
    const toDelete: RoleChanges['toDelete'] = []

    const currentRoleNames = new Set(currentRoles.data.map((r: any) => r.name))
    const cachedRoleNames = new Set(cachedRoles.roles.map(r => r.name))

    // Find roles to create
    for (const roleConfig of currentRoles.data) {
      if (!cachedRoleNames.has(roleConfig.name)) {
        toCreate.push({
          name: roleConfig.name,
          color: roleConfig.color,
          hoist: roleConfig.hoist,
          mentionable: roleConfig.mentionable,
          permissions: roleConfig.permissions || [],
        })
      }
    }

    // Find roles to update or delete
    for (const cachedRole of cachedRoles.roles) {
      if (!currentRoleNames.has(cachedRole.name)) {
        // Role was removed from config
        toDelete.push({ id: cachedRole.id, name: cachedRole.name })
      }
      else {
        // Check if role needs updating
        const currentRole = currentRoles.data.find((r: any) => r.name === cachedRole.name)
        if (currentRole) {
          const changes: any = {}

          if (currentRole.color !== cachedRole.color) {
            changes.color = { from: cachedRole.color, to: currentRole.color }
          }
          if (currentRole.hoist !== cachedRole.hoist) {
            changes.hoist = { from: cachedRole.hoist, to: currentRole.hoist }
          }
          if (currentRole.mentionable !== cachedRole.mentionable) {
            changes.mentionable = { from: cachedRole.mentionable, to: currentRole.mentionable }
          }

          if (Object.keys(changes).length > 0) {
            toUpdate.push({
              id: cachedRole.id,
              name: cachedRole.name,
              changes,
            })
          }
        }
      }
    }

    const hasChanges = toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0

    return {
      hasChanges,
      toCreate,
      toUpdate,
      toDelete,
    }
  }

  /**
   * Detect category changes
   */
  private static async detectCategoryChanges(
    guild: Guild,
    currentCategories: Map<string, any>,
    cachedCategories: CategoryState | null,
  ): Promise<CategoryChanges | null> {
    // If no cached categories, treat as first-time setup - all categories need to be created
    if (!cachedCategories) {
      const toCreate: CategoryChanges['toCreate'] = []

      for (const [categoryName, categoryStructure] of currentCategories) {
        if (categoryName !== '_') { // Exclude "_" category
          toCreate.push({
            name: categoryName,
            overwrites: this.isParsedContent(categoryStructure.config) ? categoryStructure.config.data.overwrites : undefined,
          })
        }
      }

      return {
        hasChanges: toCreate.length > 0,
        toCreate,
        toUpdate: [],
        toDelete: [],
      }
    }

    const toCreate: CategoryChanges['toCreate'] = []
    const toUpdate: CategoryChanges['toUpdate'] = []
    const toDelete: CategoryChanges['toDelete'] = []

    const currentCategoryNames = new Set(Array.from(currentCategories.keys()).filter(name => name !== '_'))
    const cachedCategoryNames = new Set(cachedCategories.categories.map(c => c.name))

    // Find categories to create
    for (const [categoryName, categoryStructure] of currentCategories) {
      if (categoryName !== '_' && !cachedCategoryNames.has(categoryName)) {
        toCreate.push({
          name: categoryName,
          overwrites: this.isParsedContent(categoryStructure.config) ? categoryStructure.config.data.overwrites : undefined,
        })
      }
    }

    // Find categories to update or delete
    for (const cachedCategory of cachedCategories.categories) {
      if (!currentCategoryNames.has(cachedCategory.name)) {
        // Category was removed from config
        toDelete.push({ id: cachedCategory.id, name: cachedCategory.name })
      }
      else {
        // Check if category needs updating
        const currentCategory = currentCategories.get(cachedCategory.name)
        if (currentCategory && this.isParsedContent(currentCategory.config)) {
          const changes: any = {}
          const currentOverwrites = currentCategory.config.data.overwrites || []
          const cachedOverwrites = cachedCategory.overwrites || []

          if (JSON.stringify(currentOverwrites) !== JSON.stringify(cachedOverwrites)) {
            changes.overwrites = { from: cachedOverwrites, to: currentOverwrites }
          }

          if (Object.keys(changes).length > 0) {
            toUpdate.push({
              id: cachedCategory.id,
              name: cachedCategory.name,
              changes,
            })
          }
        }
      }
    }

    const hasChanges = toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0

    return {
      hasChanges,
      toCreate,
      toUpdate,
      toDelete,
    }
  }

  /**
   * Detect channel changes
   */
  private static async detectChannelChanges(
    guild: Guild,
    currentCategories: Map<string, any>,
    cachedChannels: ChannelState | null,
    resolveChannelName: (filePath: string) => string,
  ): Promise<ChannelChanges | null> {
    // If no cached channels, treat as first-time setup - all channels need to be created
    if (!cachedChannels) {
      const toCreate: ChannelChanges['toCreate'] = []

      for (const [categoryName, categoryStructure] of currentCategories) {
        const categoryId = categoryName === '_' ? undefined : guild.channels.cache.find(c => c.type === 4 && c.name === categoryName)?.id

        // Add text channels
        for (const channelConfig of categoryStructure.textChannels) {
          const resolvedName = resolveChannelName(channelConfig.filePath)
          toCreate.push({
            name: resolvedName,
            type: 'text',
            categoryId,
            topic: channelConfig.data.topic,
            overwrites: channelConfig.data.overwrites,
          })
        }

        // Add voice channels
        for (const channelConfig of categoryStructure.voiceChannels) {
          const resolvedName = resolveChannelName(channelConfig.filePath)
          toCreate.push({
            name: resolvedName,
            type: 'voice',
            categoryId,
            overwrites: channelConfig.data.overwrites,
          })
        }
      }

      return {
        hasChanges: toCreate.length > 0,
        toCreate,
        toUpdate: [],
        toDelete: [],
      }
    }

    const toCreate: ChannelChanges['toCreate'] = []
    const toUpdate: ChannelChanges['toUpdate'] = []
    const toDelete: ChannelChanges['toDelete'] = []

    // Build current channels map
    const currentChannels = new Map<string, any>()
    for (const [categoryName, categoryStructure] of currentCategories) {
      const categoryId = categoryName === '_' ? undefined : guild.channels.cache.find(c => c.type === 4 && c.name === categoryName)?.id

      for (const channelConfig of categoryStructure.textChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        currentChannels.set(`${resolvedName}-${categoryId || 'root'}`, {
          name: resolvedName,
          type: 'text' as const,
          categoryId,
          topic: channelConfig.data.topic,
          overwrites: channelConfig.data.overwrites,
        })
      }

      for (const channelConfig of categoryStructure.voiceChannels) {
        const resolvedName = resolveChannelName(channelConfig.filePath)
        currentChannels.set(`${resolvedName}-${categoryId || 'root'}`, {
          name: resolvedName,
          type: 'voice' as const,
          categoryId,
          overwrites: channelConfig.data.overwrites,
        })
      }
    }

    // Build cached channels map
    const cachedChannelsMap = new Map<string, any>()
    for (const cachedChannel of cachedChannels.channels) {
      const key = `${cachedChannel.name}-${cachedChannel.categoryId || 'root'}`
      cachedChannelsMap.set(key, cachedChannel)
    }

    // Find channels to create
    for (const [key, currentChannel] of currentChannels) {
      if (!cachedChannelsMap.has(key)) {
        toCreate.push(currentChannel)
      }
    }

    // Find channels to update or delete
    for (const [key, cachedChannel] of cachedChannelsMap) {
      if (!currentChannels.has(key)) {
        // Channel was removed from config
        toDelete.push({
          id: cachedChannel.id,
          name: cachedChannel.name,
          type: cachedChannel.type,
        })
      }
      else {
        // Check if channel needs updating
        const currentChannel = currentChannels.get(key)!
        const changes: any = {}

        if (currentChannel.topic !== cachedChannel.topic) {
          changes.topic = { from: cachedChannel.topic || null, to: currentChannel.topic || null }
        }

        const currentOverwrites = currentChannel.overwrites || []
        const cachedOverwrites = cachedChannel.overwrites || []
        if (JSON.stringify(currentOverwrites) !== JSON.stringify(cachedOverwrites)) {
          changes.overwrites = { from: cachedOverwrites, to: currentOverwrites }
        }

        if (Object.keys(changes).length > 0) {
          toUpdate.push({
            id: cachedChannel.id,
            name: cachedChannel.name,
            changes,
          })
        }
      }
    }

    const hasChanges = toCreate.length > 0 || toUpdate.length > 0 || toDelete.length > 0

    return {
      hasChanges,
      toCreate,
      toUpdate,
      toDelete,
    }
  }

  /**
   * Type guard to check if a value is ParsedContent
   */
  private static isParsedContent<T>(value: any): value is { data: T } {
    return value !== null && typeof value === 'object' && 'data' in value && !('type' in value)
  }
}
