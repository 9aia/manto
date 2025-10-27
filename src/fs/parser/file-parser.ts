import { readFile } from 'fs/promises'
import { extname } from 'path'
import { z } from 'zod'
import { parse as parseYaml } from 'yaml'
import type { 
  ParsedContent, 
  ParserResult, 
  ParserOptions, 
  ParsableFileType 
} from './types'
import { 
  parseOrder, 
  detectFileType, 
  normalizeFilename 
} from './utils'
import { 
  createParserError, 
  createFileError, 
  createParsingError, 
  createSchemaError,
  ParserErrorType,
  handleParserError,
  createValidationError
} from './errors'

/**
 * File parser class for handling individual file parsing operations
 */
export class FileParser {
  private options: ParserOptions

  constructor(options: Partial<ParserOptions> = {}) {
    this.options = { ...DEFAULT_PARSER_OPTIONS, ...options }
  }

  /**
   * Parses a single file and returns structured content
   * 
   * @param filePath - Path to the file to parse
   * @returns Parser result with parsed content or error
   */
  async parseFile<T = unknown>(filePath: string): Promise<ParserResult<T>> {
    return handleParserError(async () => {
      // Read file content
      const content = await this.readFileContent(filePath)
      
      // Detect file type
      const fileTypeDetection = detectFileType(filePath, content)
      if (!fileTypeDetection.type) {
        throw createSchemaError(
          filePath, 
          'Could not determine file type from filename or content'
        )
      }
      
      // Parse JSON/YAML content
      const parsedData = this.parseConfigContent(content, filePath)
      
      // Parse order information
      const orderInfo = this.parseOrderInfo(filePath)
      
      // Create parsed content object
      const parsedContent: ParsedContent<T> = {
        data: parsedData as T,
        filePath,
        order: orderInfo.order ?? undefined,
        cleanName: orderInfo.cleanName,
        fileType: fileTypeDetection.type,
        hasOrder: orderInfo.hasOrder,
      }
      
      return { success: true, content: parsedContent }
    }, filePath, ParserErrorType.PARSING) as Promise<ParserResult<T>>
  }

  /**
   * Parses multiple files in parallel
   * 
   * @param filePaths - Array of file paths to parse
   * @returns Array of parser results
   */
  async parseFiles<T = unknown>(filePaths: string[]): Promise<ParserResult<T>[]> {
    const parsePromises = filePaths.map(filePath => this.parseFile<T>(filePath))
    return Promise.all(parsePromises)
  }

  /**
   * Reads file content with proper encoding detection
   * 
   * @param filePath - Path to the file
   * @returns File content as string
   */
  private async readFileContent(filePath: string): Promise<string> {
    try {
      const buffer = await readFile(filePath)
      
      // Try to detect encoding
      const encoding = this.detectEncoding(buffer)
      
      return buffer.toString(encoding)
    } catch (error) {
      throw createFileError(error as Error, filePath)
    }
  }

  /**
   * Detects file encoding from buffer
   * 
   * @param buffer - File buffer
   * @returns Detected encoding
   */
  private detectEncoding(buffer: Buffer): BufferEncoding {
    // Simple UTF-8 detection
    if (this.isUtf8(buffer)) {
      return 'utf8'
    }
    
    // Default to utf8 for most cases
    return 'utf8'
  }

  /**
   * Checks if buffer contains valid UTF-8
   * 
   * @param buffer - Buffer to check
   * @returns Whether buffer is valid UTF-8
   */
  private isUtf8(buffer: Buffer): boolean {
    try {
      buffer.toString('utf8')
      return true
    } catch {
      return false
    }
  }

  /**
   * Parses JSON or YAML content with error handling
   * 
   * @param content - Raw file content
   * @param filePath - File path for error context
   * @returns Parsed object
   */
  private parseConfigContent(content: string, filePath: string): unknown {
    try {
      const extension = extname(filePath).toLowerCase()
      
      if (extension === '.json') {
        // Clean content before parsing JSON
        const cleanedContent = this.cleanJsonContent(content)
        return JSON.parse(cleanedContent)
      } else if (extension === '.yml' || extension === '.yaml') {
        // Parse YAML content
        return parseYaml(content)
      } else {
        // Try JSON first, then YAML as fallback
        try {
          const cleanedContent = this.cleanJsonContent(content)
          return JSON.parse(cleanedContent)
        } catch {
          return parseYaml(content)
        }
      }
    } catch (error) {
      throw createParsingError(error as Error, filePath)
    }
  }

  /**
   * Cleans JSON content by removing comments and fixing common issues
   * 
   * @param content - Raw JSON content
   * @returns Cleaned JSON content
   */
  private cleanJsonContent(content: string): string {
    return content
      // Remove single-line comments
      .replace(/\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Trim whitespace
      .trim()
  }

  /**
   * Parses order information from file path
   * 
   * @param filePath - File path to analyze
   * @returns Order parsing result
   */
  private parseOrderInfo(filePath: string): ReturnType<typeof parseOrder> {
    if (!this.options.parseOrder) {
      const filename = filePath.split('/').pop() || ''
      return {
        order: null,
        cleanName: filename,
        hasOrder: false,
      }
    }
    
    const filename = filePath.split('/').pop() || ''
    return parseOrder(filename)
  }

  /**
   * Validates parsed content against a schema
   * 
   * @param data - Data to validate
   * @param schema - Zod schema to validate against
   * @param filePath - File path for error context
   * @returns Validated data
   */
  validateContent<T>(
    data: unknown, 
    schema: z.ZodSchema<T>, 
    filePath: string
  ): T {
    if (!this.options.validate) {
      return data as T
    }
    
    try {
      return schema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw createValidationError(error, filePath)
      }
      throw error
    }
  }

  /**
   * Updates parser options
   * 
   * @param options - New options to merge
   */
  updateOptions(options: Partial<ParserOptions>): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Gets current parser options
   * 
   * @returns Current parser options
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
 * Creates a new file parser instance
 * 
 * @param options - Parser options
 * @returns New file parser instance
 */
export function createFileParser(options?: Partial<ParserOptions>): FileParser {
  return new FileParser(options)
}

/**
 * Quick parse function for single files
 * 
 * @param filePath - Path to file to parse
 * @param options - Parser options
 * @returns Parser result
 */
export async function parseFile<T = unknown>(
  filePath: string, 
  options?: Partial<ParserOptions>
): Promise<ParserResult<T>> {
  const parser = createFileParser(options)
  return parser.parseFile<T>(filePath)
}

/**
 * Quick parse function for multiple files
 * 
 * @param filePaths - Paths to files to parse
 * @param options - Parser options
 * @returns Array of parser results
 */
export async function parseFiles<T = unknown>(
  filePaths: string[], 
  options?: Partial<ParserOptions>
): Promise<ParserResult<T>[]> {
  const parser = createFileParser(options)
  return parser.parseFiles<T>(filePaths)
}
