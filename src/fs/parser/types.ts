import type { z } from 'zod'
import type { MantoCategory } from '../schemas/category'
import type { MantoRoles } from '../schemas/roles'
import type { MantoServer } from '../schemas/server'
import type { MantoTextChannel } from '../schemas/text-channel'
import type { MantoVoiceChannel } from '../schemas/voice-channel'

/**
 * Supported file types that can be parsed
 */
export type ParsableFileType
  = | 'server'
    | 'category'
    | 'text-channel'
    | 'voice-channel'
    | 'roles'

/**
 * Parsed content with metadata
 */
export interface ParsedContent<T = unknown> {
  /** The parsed and validated data */
  data: T
  /** File path where the content was parsed from */
  filePath: string
  /** Order number extracted from filename (if present) */
  order?: number
  /** Raw filename without order prefix */
  cleanName: string
  /** File type detected from schema */
  fileType: ParsableFileType
  /** Whether the file had an order prefix */
  hasOrder: boolean
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  /** Whether to validate parsed content against schemas */
  validate: boolean
  /** Whether to include order parsing */
  parseOrder: boolean
  /** Whether to throw on validation errors */
  strictMode: boolean
  /** Custom file type detection function */
  fileTypeDetector?: (filePath: string) => ParsableFileType | null
}

/**
 * Default parser options
 */
export const DEFAULT_PARSER_OPTIONS: ParserOptions = {
  validate: true,
  parseOrder: true,
  strictMode: true,
}

/**
 * Parser result for a single file
 */
export type ParserResult<T = unknown>
  = | { success: true, content: ParsedContent<T> }
    | { success: false, error: ParserError }

/**
 * Parser error with detailed information
 */
export interface ParserError {
  /** Error message */
  message: string
  /** File path where error occurred */
  filePath: string
  /** Error type */
  type: 'validation' | 'parsing' | 'file' | 'schema'
  /** Additional error details */
  details?: Record<string, unknown>
  /** Original error if available */
  originalError?: Error
}

/**
 * Batch parsing result
 */
export interface BatchParseResult {
  /** Successfully parsed files */
  successful: ParsedContent[]
  /** Failed parsing attempts */
  failed: ParserError[]
  /** Total files processed */
  total: number
  /** Processing duration in milliseconds */
  duration: number
}

/**
 * Schema-specific parser result types
 */
export type ServerParseResult = ParserResult<MantoServer>
export type CategoryParseResult = ParserResult<MantoCategory>
export type TextChannelParseResult = ParserResult<MantoTextChannel>
export type VoiceChannelParseResult = ParserResult<MantoVoiceChannel>
export type RolesParseResult = ParserResult<MantoRoles>

/**
 * Order parsing result
 */
export interface OrderParseResult {
  /** Extracted order number */
  order: number | null
  /** Clean filename without order prefix */
  cleanName: string
  /** Whether order was found */
  hasOrder: boolean
}

/**
 * File type detection result
 */
export interface FileTypeDetectionResult {
  /** Detected file type */
  type: ParsableFileType | null
  /** Confidence level (0-1) */
  confidence: number
  /** Detection method used */
  method: 'extension' | 'schema' | 'content' | 'custom'
}
