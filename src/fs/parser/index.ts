import { readdir, stat } from 'fs/promises'
import { extname, join } from 'path'
import {
  ParserErrorType,
  aggregateErrors,
  createErrorReport,
  createParserError
} from './errors'
import {
  CategoryParser,
  RolesParser,
  ServerParser,
  TextChannelParser,
  VoiceChannelParser
} from './schema-parser'
import type {
  BatchParseResult,
  ParsableFileType,
  ParsedContent,
  ParserError,
  ParserOptions
} from './types'
import {
  detectFileType,
  groupFilesByType
} from './utils'
import { MantoServer } from '../schemas/server'
import { MantoCategory } from '../schemas/category'
import { MantoTextChannel } from '../schemas/text-channel'
import { MantoVoiceChannel } from '../schemas/voice-channel'
import { MantoRoles } from '../schemas/roles'

/**
 * Main parser class that orchestrates the parsing of Discord server configurations
 */
export class MantoParser {
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
   * Parses a single file with automatic schema detection
   * 
   * @param filePath - Path to the file to parse
   * @returns Parsed content or error
   */
  async parseFile(filePath: string): Promise<ParsedContent | ParserError> {
    try {
      // Detect file type
      const fileTypeDetection = detectFileType(filePath)
      if (!fileTypeDetection.type) {
        return createParserError(
          `Could not determine file type for: ${filePath}`,
          filePath,
          ParserErrorType.SCHEMA
        )
      }

      // Get appropriate parser
      const parser = this.parsers.get(fileTypeDetection.type)
      if (!parser) {
        return createParserError(
          `No parser available for file type: ${fileTypeDetection.type}`,
          filePath,
          ParserErrorType.SCHEMA
        )
      }

      // Parse the file
      const result = await parser.parseFile(filePath)
      
      if (!result.success) {
        return result.error
      }

      return result.content
    } catch (error) {
      return createParserError(
        `Failed to parse file: ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        ParserErrorType.PARSING,
        { originalError: error },
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * Parses multiple files in parallel
   * 
   * @param filePaths - Array of file paths to parse
   * @returns Batch parse result
   */
  async parseFiles(filePaths: string[]): Promise<BatchParseResult> {
    const startTime = Date.now()
    const successful: ParsedContent[] = []
    const failed: ParserError[] = []

    // Process files in parallel
    const results = await Promise.allSettled(
      filePaths.map(filePath => this.parseFile(filePath))
    )

    // Process results
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const filePath = filePaths[i]

      if (result.status === 'fulfilled') {
        if ('filePath' in result.value) {
          // It's a ParsedContent
          successful.push(result.value as ParsedContent)
        } else {
          // It's a ParserError
          failed.push(result.value as ParserError)
        }
      } else {
        // Promise was rejected
        failed.push(createParserError(
          `Promise rejected: ${result.reason}`,
          filePath,
          ParserErrorType.PARSING,
          { reason: result.reason }
        ))
      }
    }

    return {
      successful,
      failed,
      total: filePaths.length,
      duration: Date.now() - startTime,
    }
  }

  /**
   * Recursively parses all files in a directory
   * 
   * @param directoryPath - Path to directory to parse
   * @param recursive - Whether to parse subdirectories
   * @returns Batch parse result
   */
  async parseDirectory(
    directoryPath: string, 
    recursive: boolean = true
  ): Promise<BatchParseResult> {
    const filePaths = await this.collectFiles(directoryPath, recursive)
    return this.parseFiles(filePaths)
  }

  /**
   * Collects all parseable files from a directory
   * 
   * @param directoryPath - Directory to scan
   * @param recursive - Whether to scan subdirectories
   * @returns Array of file paths
   */
  private async collectFiles(
    directoryPath: string, 
    recursive: boolean
  ): Promise<string[]> {
    const files: string[] = []
    
    try {
      const entries = await readdir(directoryPath)
      
      for (const entry of entries) {
        const fullPath = join(directoryPath, entry)
        const stats = await stat(fullPath)
        
        if (stats.isDirectory() && recursive) {
          const subFiles = await this.collectFiles(fullPath, recursive)
          files.push(...subFiles)
        } else if (stats.isFile() && this.isParseableFile(fullPath)) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      throw createParserError(
        `Failed to collect files from directory: ${error instanceof Error ? error.message : String(error)}`,
        directoryPath,
        ParserErrorType.FILE,
        { originalError: error },
        error instanceof Error ? error : undefined
      )
    }
    
    return files
  }

  /**
   * Checks if a file is parseable based on extension and content
   * 
   * @param filePath - File path to check
   * @returns Whether the file is parseable
   */
  private isParseableFile(filePath: string): boolean {
    const extension = extname(filePath).toLowerCase()
    const parseableExtensions = ['.json', '.yml', '.yaml']
    
    if (!parseableExtensions.includes(extension)) {
      return false
    }
    
    // Additional checks could be added here
    return true
  }

  /**
   * Parses files grouped by type for better organization
   * 
   * @param filePaths - Array of file paths
   * @returns Map of file type to parse results
   */
  async parseFilesByType(filePaths: string[]): Promise<Map<ParsableFileType, BatchParseResult>> {
    const groupedFiles = groupFilesByType(filePaths)
    const results = new Map<ParsableFileType, BatchParseResult>()
    
    for (const [fileType, files] of groupedFiles) {
      const parser = this.parsers.get(fileType)
      if (parser) {
        const batchResult = await parser.parseFiles(files)
        results.set(fileType, batchResult)
      }
    }
    
    return results
  }

  /**
   * Parses server configuration specifically
   * 
   * @param filePath - Path to server configuration file
   * @returns Parsed server configuration
   */
  async parseServer(filePath: string): Promise<ParsedContent<MantoServer> | ParserError> {
    const parser = this.parsers.get('server') as ServerParser
    const result = await parser.parseServer(filePath)
    
    if (!result.success) {
      return result.error
    }
    
    return result.content
  }

  /**
   * Parses category configuration specifically
   * 
   * @param filePath - Path to category configuration file
   * @returns Parsed category configuration
   */
  async parseCategory(filePath: string): Promise<ParsedContent<MantoCategory> | ParserError> {
    const parser = this.parsers.get('category') as CategoryParser
    const result = await parser.parseCategory(filePath)
    
    if (!result.success) {
      return result.error
    }
    
    return result.content
  }

  /**
   * Parses text channel configuration specifically
   * 
   * @param filePath - Path to text channel configuration file
   * @returns Parsed text channel configuration
   */
  async parseTextChannel(filePath: string): Promise<ParsedContent<MantoTextChannel> | ParserError> {
    const parser = this.parsers.get('text-channel') as TextChannelParser
    const result = await parser.parseTextChannel(filePath)
    
    if (!result.success) {
      return result.error
    }
    
    return result.content
  }

  /**
   * Parses voice channel configuration specifically
   * 
   * @param filePath - Path to voice channel configuration file
   * @returns Parsed voice channel configuration
   */
  async parseVoiceChannel(filePath: string): Promise<ParsedContent<MantoVoiceChannel> | ParserError> {
    const parser = this.parsers.get('voice-channel') as VoiceChannelParser
    const result = await parser.parseVoiceChannel(filePath)
    
    if (!result.success) {
      return result.error
    }
    
    return result.content
  }

  /**
   * Parses roles configuration specifically
   * 
   * @param filePath - Path to roles configuration file
   * @returns Parsed roles configuration
   */
  async parseRoles(filePath: string): Promise<ParsedContent<MantoRoles> | ParserError> {
    const parser = this.parsers.get('roles') as RolesParser
    const result = await parser.parseRoles(filePath)
    
    if (!result.success) {
      return result.error
    }
    
    return result.content
  }

  /**
   * Updates parser options and reinitializes parsers
   * 
   * @param options - New options to merge
   */
  updateOptions(options: Partial<ParserOptions>): void {
    this.options = { ...this.options, ...options }
    this.initializeParsers()
  }

  /**
   * Gets current parser options
   * 
   * @returns Current parser options
   */
  getOptions(): ParserOptions {
    return { ...this.options }
  }

  /**
   * Generates a comprehensive error report
   * 
   * @param errors - Array of parser errors
   * @returns Formatted error report
   */
  generateErrorReport(errors: ParserError[]): string {
    return createErrorReport(errors)
  }

  /**
   * Gets parser statistics
   * 
   * @param result - Batch parse result
   * @returns Parser statistics
   */
  getStatistics(result: BatchParseResult): {
    totalFiles: number
    successfulFiles: number
    failedFiles: number
    successRate: number
    averageTimePerFile: number
    errorBreakdown: Record<string, number>
  } {
    const errorBreakdown = aggregateErrors(result.failed).byType
    
    return {
      totalFiles: result.total,
      successfulFiles: result.successful.length,
      failedFiles: result.failed.length,
      successRate: result.total > 0 ? (result.successful.length / result.total) * 100 : 0,
      averageTimePerFile: result.total > 0 ? result.duration / result.total : 0,
      errorBreakdown,
    }
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
 * Creates a new Manto parser instance
 * 
 * @param options - Parser options
 * @returns New Manto parser instance
 */
export function createMantoParser(options?: Partial<ParserOptions>): MantoParser {
  return new MantoParser(options)
}

/**
 * Quick parse functions for common operations
 */
export const parseMantoFile = (filePath: string, options?: Partial<ParserOptions>) => 
  new MantoParser(options).parseFile(filePath)

export const parseMantoDirectory = (directoryPath: string, options?: Partial<ParserOptions>) => 
  new MantoParser(options).parseDirectory(directoryPath)

export const parseMantoFiles = (filePaths: string[], options?: Partial<ParserOptions>) => 
  new MantoParser(options).parseFiles(filePaths)

// Export root directory parser functionality
export {
  createRootDirParser,
  parseRootDir, type BinaryAsset,
  type BinaryAssetType, type CategoryStructure, type RootDirStructure
} from './root-parser'

