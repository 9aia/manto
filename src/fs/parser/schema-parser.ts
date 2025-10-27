import { z } from 'zod'
import type { MantoServer } from '../schemas/server'
import type { MantoCategory } from '../schemas/category'
import type { MantoTextChannel } from '../schemas/text-channel'
import type { MantoVoiceChannel } from '../schemas/voice-channel'
import type { MantoRoles } from '../schemas/roles'
import { 
  mantoServerSchema
} from '../schemas/server'
import { 
  mantoCategorySchema
} from '../schemas/category'
import { 
  mantoTextChannelSchema
} from '../schemas/text-channel'
import { 
  mantoVoiceChannelSchema
} from '../schemas/voice-channel'
import { 
  mantoRolesSchema
} from '../schemas/roles'
import type { 
  ParsedContent, 
  ParserResult, 
  ParserOptions,
  ServerParseResult,
  CategoryParseResult,
  TextChannelParseResult,
  VoiceChannelParseResult,
  RolesParseResult
} from './types'
import { FileParser } from './file-parser'
import { 
  createSchemaError,
  ParserErrorType 
} from './errors'

/**
 * Schema-specific parser for Manto server configurations
 */
export class ServerParser extends FileParser {
  constructor(options?: Partial<ParserOptions>) {
    super(options)
  }

  /**
   * Parses a server configuration file
   * 
   * @param filePath - Path to server configuration file
   * @returns Parsed server configuration
   */
  async parseServer(filePath: string): Promise<ServerParseResult> {
    const result = await this.parseFile<MantoServer>(filePath)
    
    if (!result.success) {
      return result
    }

    try {
      // Validate against server schema
      const validatedData = this.validateContent(
        result.content.data,
        mantoServerSchema,
        filePath
      )

      return {
        success: true,
        content: {
          ...result.content,
          data: validatedData,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: createSchemaError(
          filePath,
          `Server validation failed: ${error instanceof Error ? error.message : String(error)}`
        ),
      }
    }
  }
}

/**
 * Schema-specific parser for Manto category configurations
 */
export class CategoryParser extends FileParser {
  constructor(options?: Partial<ParserOptions>) {
    super(options)
  }

  /**
   * Parses a category configuration file
   * 
   * @param filePath - Path to category configuration file
   * @returns Parsed category configuration
   */
  async parseCategory(filePath: string): Promise<CategoryParseResult> {
    const result = await this.parseFile<MantoCategory>(filePath)
    
    if (!result.success) {
      return result
    }

    try {
      // Validate against category schema
      const validatedData = this.validateContent(
        result.content.data,
        mantoCategorySchema,
        filePath
      )

      return {
        success: true,
        content: {
          ...result.content,
          data: validatedData,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: createSchemaError(
          filePath,
          `Category validation failed: ${error instanceof Error ? error.message : String(error)}`
        ),
      }
    }
  }
}

/**
 * Schema-specific parser for Manto text channel configurations
 */
export class TextChannelParser extends FileParser {
  constructor(options?: Partial<ParserOptions>) {
    super(options)
  }

  /**
   * Parses a text channel configuration file
   * 
   * @param filePath - Path to text channel configuration file
   * @returns Parsed text channel configuration
   */
  async parseTextChannel(filePath: string): Promise<TextChannelParseResult> {
    const result = await this.parseFile<MantoTextChannel>(filePath)
    
    if (!result.success) {
      return result
    }

    try {
      // Validate against text channel schema
      const validatedData = this.validateContent(
        result.content.data,
        mantoTextChannelSchema,
        filePath
      )

      return {
        success: true,
        content: {
          ...result.content,
          data: validatedData,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: createSchemaError(
          filePath,
          `Text channel validation failed: ${error instanceof Error ? error.message : String(error)}`
        ),
      }
    }
  }
}

/**
 * Schema-specific parser for Manto voice channel configurations
 */
export class VoiceChannelParser extends FileParser {
  constructor(options?: Partial<ParserOptions>) {
    super(options)
  }

  /**
   * Parses a voice channel configuration file
   * 
   * @param filePath - Path to voice channel configuration file
   * @returns Parsed voice channel configuration
   */
  async parseVoiceChannel(filePath: string): Promise<VoiceChannelParseResult> {
    const result = await this.parseFile<MantoVoiceChannel>(filePath)
    
    if (!result.success) {
      return result
    }

    try {
      // Validate against voice channel schema
      const validatedData = this.validateContent(
        result.content.data,
        mantoVoiceChannelSchema,
        filePath
      )

      return {
        success: true,
        content: {
          ...result.content,
          data: validatedData,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: createSchemaError(
          filePath,
          `Voice channel validation failed: ${error instanceof Error ? error.message : String(error)}`
        ),
      }
    }
  }
}

/**
 * Schema-specific parser for Manto roles configurations
 */
export class RolesParser extends FileParser {
  constructor(options?: Partial<ParserOptions>) {
    super(options)
  }

  /**
   * Parses a roles configuration file
   * 
   * @param filePath - Path to roles configuration file
   * @returns Parsed roles configuration
   */
  async parseRoles(filePath: string): Promise<RolesParseResult> {
    const result = await this.parseFile<MantoRoles>(filePath)
    
    if (!result.success) {
      return result
    }

    try {
      // Validate against roles schema
      const validatedData = this.validateContent(
        result.content.data,
        mantoRolesSchema,
        filePath
      )

      return {
        success: true,
        content: {
          ...result.content,
          data: validatedData,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: createSchemaError(
          filePath,
          `Roles validation failed: ${error instanceof Error ? error.message : String(error)}`
        ),
      }
    }
  }
}

/**
 * Factory function to create schema-specific parsers
 * 
 * @param schemaType - Type of schema parser to create
 * @param options - Parser options
 * @returns Appropriate schema parser instance
 */
export function createSchemaParser(
  schemaType: 'server' | 'category' | 'text-channel' | 'voice-channel' | 'roles',
  options?: Partial<ParserOptions>
): ServerParser | CategoryParser | TextChannelParser | VoiceChannelParser | RolesParser {
  switch (schemaType) {
    case 'server':
      return new ServerParser(options)
    case 'category':
      return new CategoryParser(options)
    case 'text-channel':
      return new TextChannelParser(options)
    case 'voice-channel':
      return new VoiceChannelParser(options)
    case 'roles':
      return new RolesParser(options)
    default:
      throw new Error(`Unknown schema type: ${schemaType}`)
  }
}

/**
 * Quick parse functions for each schema type
 */
export const parseServer = (filePath: string, options?: Partial<ParserOptions>) => 
  new ServerParser(options).parseServer(filePath)

export const parseCategory = (filePath: string, options?: Partial<ParserOptions>) => 
  new CategoryParser(options).parseCategory(filePath)

export const parseTextChannel = (filePath: string, options?: Partial<ParserOptions>) => 
  new TextChannelParser(options).parseTextChannel(filePath)

export const parseVoiceChannel = (filePath: string, options?: Partial<ParserOptions>) => 
  new VoiceChannelParser(options).parseVoiceChannel(filePath)

export const parseRoles = (filePath: string, options?: Partial<ParserOptions>) => 
  new RolesParser(options).parseRoles(filePath)
