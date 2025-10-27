import { readdir, stat } from 'fs/promises'
import { join, basename, extname, dirname } from 'path'
import type { MantoServer } from '../schemas/server'
import type { MantoCategory } from '../schemas/category'
import type { MantoTextChannel } from '../schemas/text-channel'
import type { MantoVoiceChannel } from '../schemas/voice-channel'
import type { MantoRoles } from '../schemas/roles'
import type { 
  ParsedContent, 
  ParserOptions, 
  ParsableFileType,
  BatchParseResult,
  ParserError
} from './types'
import { 
  ServerParser,
  CategoryParser,
  TextChannelParser,
  VoiceChannelParser,
  RolesParser
} from './schema-parser'
import { 
  detectFileType, 
  groupFilesByType, 
  sortFilesByOrder,
  parseOrder,
  isValidOrder
} from './utils'
import { 
  createParserError,
  ParserErrorType,
  aggregateErrors,
  createErrorReport
} from './errors'

/**
 * Binary asset types supported for Discord server
 */
export type BinaryAssetType = 'icon' | 'banner' | 'role-icon' | 'channel-icon'

/**
 * Supported binary file extensions
 */
const BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp']

/**
 * Root directory structure for Discord server
 */
export interface RootDirStructure {
  /** Server configuration */
  server: ParsedContent<MantoServer> | ParserError
  /** Roles configuration */
  roles: ParsedContent<MantoRoles> | ParserError
  /** Server icon (takes precedence over files/) */
  icon?: ParsedContent<BinaryAsset>
  /** Server banner */
  banner?: ParsedContent<BinaryAsset>
  /** Binary assets from files/ directory */
  assets: ParsedContent<BinaryAsset>[]
  /** Categories with their channels */
  categories: Map<string, CategoryStructure>
  /** Parse statistics */
  stats: {
    totalFiles: number
    successfulFiles: number
    failedFiles: number
    duration: number
  }
}

/**
 * Binary asset information
 */
export interface BinaryAsset {
  /** Asset type */
  type: BinaryAssetType
  /** File path */
  filePath: string
  /** File name */
  fileName: string
  /** File extension */
  extension: string
  /** File size in bytes */
  size: number
  /** MIME type */
  mimeType: string
}

/**
 * Category structure with channels
 */
export interface CategoryStructure {
  /** Category configuration */
  config: ParsedContent<MantoCategory> | ParserError
  /** Text channels in this category */
  textChannels: ParsedContent<MantoTextChannel>[]
  /** Voice channels in this category */
  voiceChannels: ParsedContent<MantoVoiceChannel>[]
  /** Category name (from directory name) */
  name: string
  /** Category directory path */
  path: string
}

/**
 * Root directory parser optimized for Discord server structure
 */
export class RootDirParser {
  private options: ParserOptions
  private parsers: Map<ParsableFileType, any>

  constructor(options: Partial<ParserOptions> = {}) {
    this.options = { ...DEFAULT_PARSER_OPTIONS, ...options }
    this.parsers = new Map()
    this.initializeParsers()
  }

  /**
   * Initializes schema-specific parsers
   */
  private initializeParsers(): void {
    this.parsers.set('server', new ServerParser(this.options))
    this.parsers.set('category', new CategoryParser(this.options))
    this.parsers.set('text-channel', new TextChannelParser(this.options))
    this.parsers.set('voice-channel', new VoiceChannelParser(this.options))
    this.parsers.set('roles', new RolesParser(this.options))
  }

  /**
   * Parses a root directory with the strict Discord server structure
   * 
   * @param rootPath - Path to the root directory
   * @returns Complete root directory structure
   */
  async parseRootDir(rootPath: string): Promise<RootDirStructure> {
    const startTime = Date.now()
    const structure: RootDirStructure = {
      server: createParserError('Not found', rootPath, ParserErrorType.FILE),
      roles: createParserError('Not found', rootPath, ParserErrorType.FILE),
      assets: [],
      categories: new Map(),
      stats: {
        totalFiles: 0,
        successfulFiles: 0,
        failedFiles: 0,
        duration: 0,
      },
    }

    try {
      // Parse root level files
      await this.parseRootFiles(rootPath, structure)
      
      // Parse channels directory
      await this.parseChannelsDirectory(join(rootPath, 'channels'), structure)
      
      // Parse files directory for assets
      await this.parseAssetsDirectory(join(rootPath, 'files'), structure)
      
      // Calculate statistics
      structure.stats.duration = Date.now() - startTime
      structure.stats.totalFiles = this.countTotalFiles(structure)
      structure.stats.successfulFiles = this.countSuccessfulFiles(structure)
      structure.stats.failedFiles = this.countFailedFiles(structure)
      
    } catch (error) {
      // Ensure structure is properly initialized even on error
      if (!structure.server) {
        structure.server = createParserError('Not found', rootPath, ParserErrorType.FILE)
      }
      if (!structure.roles) {
        structure.roles = createParserError('Not found', rootPath, ParserErrorType.FILE)
      }
      
      throw createParserError(
        `Failed to parse root directory: ${error instanceof Error ? error.message : String(error)}`,
        rootPath,
        ParserErrorType.FILE,
        { originalError: error },
        error instanceof Error ? error : undefined
      )
    }

    return structure
  }

  /**
   * Parses root level files (server.yml, roles.yml, icon.png, etc.)
   */
  private async parseRootFiles(rootPath: string, structure: RootDirStructure): Promise<void> {
    try {
      const entries = await readdir(rootPath)
      
      for (const entry of entries) {
        const fullPath = join(rootPath, entry)
        const stats = await stat(fullPath)
        
        if (!stats.isFile()) continue
        
        const extension = extname(entry).toLowerCase()
        const nameWithoutExt = basename(entry, extension)
        
        // Parse server configuration
        if (nameWithoutExt === 'server' && this.isConfigFile(extension)) {
          console.log(`Found server config: ${fullPath}`)
          const serverParser = this.parsers.get('server') as ServerParser
          const result = await serverParser.parseServer(fullPath)
          console.log(`Server parse result:`, result.success ? 'success' : 'failed', result.success ? '' : (result.error?.message || 'Unknown error'))
          structure.server = result.success ? result.content : result.error
        }
        
        // Parse roles configuration
        else if (nameWithoutExt === 'roles' && this.isConfigFile(extension)) {
          console.log(`Found roles config: ${fullPath}`)
          const rolesParser = this.parsers.get('roles') as RolesParser
          const result = await rolesParser.parseRoles(fullPath)
          console.log(`Roles parse result:`, result.success ? 'success' : 'failed', result.success ? '' : (result.error?.message || 'Unknown error'))
          structure.roles = result.success ? result.content : result.error
        }
        
        // Parse server icon (takes precedence)
        else if (nameWithoutExt === 'icon' && this.isBinaryFile(extension)) {
          const asset = await this.parseBinaryAsset(fullPath, 'icon')
          if (asset) {
            structure.icon = asset
          }
        }
        
        // Parse server banner
        else if (nameWithoutExt === 'banner' && this.isBinaryFile(extension)) {
          const asset = await this.parseBinaryAsset(fullPath, 'banner')
          if (asset) {
            structure.banner = asset
          }
        }
      }
    } catch (error) {
      // If we can't read the directory, that's fine - files just won't be found
      console.warn(`Warning: Could not read root directory ${rootPath}:`, error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Parses the channels directory structure
   */
  private async parseChannelsDirectory(channelsPath: string, structure: RootDirStructure): Promise<void> {
    try {
      const entries = await readdir(channelsPath)
      
      for (const entry of entries) {
        const categoryPath = join(channelsPath, entry)
        const stats = await stat(categoryPath)
        
        if (!stats.isDirectory()) continue
        
        const categoryStructure = await this.parseCategoryDirectory(categoryPath, entry)
        structure.categories.set(entry, categoryStructure)
      }
    } catch (error) {
      // channels directory might not exist
      if ((error as any).code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Parses a single category directory
   */
  private async parseCategoryDirectory(categoryPath: string, categoryName: string): Promise<CategoryStructure> {
    const categoryStructure: CategoryStructure = {
      config: createParserError('Not found', categoryPath, ParserErrorType.FILE),
      textChannels: [],
      voiceChannels: [],
      name: categoryName,
      path: categoryPath,
    }

    const entries = await readdir(categoryPath)
    
    for (const entry of entries) {
      const fullPath = join(categoryPath, entry)
      const stats = await stat(fullPath)
      
      if (!stats.isFile()) continue
      
      // Parse category configuration
      if (entry === '.config') {
        const categoryParser = this.parsers.get('category') as CategoryParser
        const result = await categoryParser.parseCategory(fullPath)
        categoryStructure.config = result.success ? result.content : result.error
      }
      
      // Parse text channels (T prefix)
      else if (entry.startsWith('T ')) {
        const textChannelParser = this.parsers.get('text-channel') as TextChannelParser
        const result = await textChannelParser.parseTextChannel(fullPath)
        if (result.success) {
          categoryStructure.textChannels.push(result.content)
        }
      }
      
      // Parse voice channels (V prefix)
      else if (entry.startsWith('V ')) {
        const voiceChannelParser = this.parsers.get('voice-channel') as VoiceChannelParser
        const result = await voiceChannelParser.parseVoiceChannel(fullPath)
        if (result.success) {
          categoryStructure.voiceChannels.push(result.content)
        }
      }
    }
    
    // Sort channels by order
    categoryStructure.textChannels.sort((a, b) => (a.order || 0) - (b.order || 0))
    categoryStructure.voiceChannels.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    return categoryStructure
  }

  /**
   * Parses the files directory for binary assets
   */
  private async parseAssetsDirectory(filesPath: string, structure: RootDirStructure): Promise<void> {
    try {
      const entries = await readdir(filesPath)
      
      for (const entry of entries) {
        const fullPath = join(filesPath, entry)
        const stats = await stat(fullPath)
        
        if (!stats.isFile()) continue
        
        const extension = extname(entry).toLowerCase()
        if (!this.isBinaryFile(extension)) continue
        
        // Determine asset type based on filename
        const assetType = this.detectAssetType(entry)
        const asset = await this.parseBinaryAsset(fullPath, assetType)
        
        if (asset) {
          structure.assets.push(asset)
        }
      }
    } catch (error) {
      // files directory might not exist
      if ((error as any).code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Parses a binary asset file
   */
  private async parseBinaryAsset(filePath: string, type: BinaryAssetType): Promise<ParsedContent<BinaryAsset> | null> {
    try {
      const stats = await stat(filePath)
      const fileName = basename(filePath)
      const extension = extname(filePath).toLowerCase()
      
      const asset: BinaryAsset = {
        type,
        filePath,
        fileName,
        extension,
        size: stats.size,
        mimeType: this.getMimeType(extension),
      }
      
      return {
        data: asset,
        filePath,
        order: undefined,
        cleanName: fileName,
        fileType: 'server', // Use server as fallback type
        hasOrder: false,
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Detects asset type from filename
   */
  private detectAssetType(filename: string): BinaryAssetType {
    const lowerName = filename.toLowerCase()
    
    if (lowerName.includes('icon')) return 'icon'
    if (lowerName.includes('banner')) return 'banner'
    if (lowerName.includes('role')) return 'role-icon'
    if (lowerName.includes('channel')) return 'channel-icon'
    
    return 'icon' // Default to icon
  }

  /**
   * Gets MIME type from file extension
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }
    
    return mimeTypes[extension] || 'application/octet-stream'
  }

  /**
   * Checks if file is a configuration file
   */
  private isConfigFile(extension: string): boolean {
    return ['.json', '.yml', '.yaml'].includes(extension)
  }

  /**
   * Checks if file is a binary asset file
   */
  private isBinaryFile(extension: string): boolean {
    return BINARY_EXTENSIONS.includes(extension)
  }

  /**
   * Type guard to check if a value is ParsedContent
   */
  private isParsedContent<T>(value: ParsedContent<T> | ParserError): value is ParsedContent<T> {
    return value !== null && typeof value === 'object' && 'filePath' in value && !('type' in value)
  }

  /**
   * Type guard to check if a value is ParserError
   */
  private isParserError(value: ParsedContent<any> | ParserError): value is ParserError {
    return value !== null && typeof value === 'object' && 'type' in value
  }

  /**
   * Counts total files in structure
   */
  private countTotalFiles(structure: RootDirStructure): number {
    let count = 2 // server and roles files
    
    if (structure.icon) count++
    if (structure.banner) count++
    
    count += structure.assets.length
    
    for (const category of structure.categories.values()) {
      count++ // .config file
      count += category.textChannels.length
      count += category.voiceChannels.length
    }
    
    return count
  }

  /**
   * Counts successful files in structure
   */
  private countSuccessfulFiles(structure: RootDirStructure): number {
    let count = 0
    
    if (this.isParsedContent(structure.server)) count++
    if (this.isParsedContent(structure.roles)) count++
    if (structure.icon) count++
    if (structure.banner) count++
    
    count += structure.assets.length
    
    for (const category of structure.categories.values()) {
      if (this.isParsedContent(category.config)) count++
      count += category.textChannels.length
      count += category.voiceChannels.length
    }
    
    return count
  }

  /**
   * Counts failed files in structure
   */
  private countFailedFiles(structure: RootDirStructure): number {
    let count = 0
    
    if (this.isParserError(structure.server)) count++
    if (this.isParserError(structure.roles)) count++
    
    for (const category of structure.categories.values()) {
      if (this.isParserError(category.config)) count++
    }
    
    return count
  }

  /**
   * Updates parser options and reinitializes parsers
   */
  updateOptions(options: Partial<ParserOptions>): void {
    this.options = { ...this.options, ...options }
    this.initializeParsers()
  }

  /**
   * Gets current parser options
   */
  getOptions(): ParserOptions {
    return { ...this.options }
  }
}

/**
 * Default parser options
 */
const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  validate: true,
  parseOrder: true,
  strictMode: true,
}

/**
 * Creates a new root directory parser instance
 * 
 * @param options - Parser options
 * @returns New root directory parser instance
 */
export function createRootDirParser(options?: Partial<ParserOptions>): RootDirParser {
  return new RootDirParser(options)
}

/**
 * Quick parse function for root directory
 * 
 * @param rootPath - Path to root directory
 * @param options - Parser options
 * @returns Root directory structure
 */
export async function parseRootDir(
  rootPath: string, 
  options?: Partial<ParserOptions>
): Promise<RootDirStructure> {
  const parser = createRootDirParser(options)
  return parser.parseRootDir(rootPath)
}
