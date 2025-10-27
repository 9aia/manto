import { extname, basename, dirname } from 'path'
import type { 
  OrderParseResult, 
  FileTypeDetectionResult, 
  ParsableFileType 
} from './types'

/**
 * Regular expression to match order prefixes in filenames
 * Matches patterns like: "1 ", "T 1 ", "V 2 ", etc.
 */
const ORDER_PATTERN = /^([A-Z])\s*(\d+)\s+(.+)$/

/**
 * File extension to type mapping
 */
const EXTENSION_TYPE_MAP: Record<string, ParsableFileType> = {
  '.json': 'server', // Default to server for .json files
  '.yml': 'server',
  '.yaml': 'server',
}

/**
 * Schema file patterns for type detection
 */
const SCHEMA_PATTERNS: Record<string, ParsableFileType> = {
  'server': 'server',
  'category': 'category',
  'text-channel': 'text-channel',
  'voice-channel': 'voice-channel',
  'roles': 'roles',
}

/**
 * Parses order information from a filename
 * 
 * @param filename - The filename to parse
 * @returns Order parsing result
 * 
 * @example
 * parseOrder("T 1 hello-world") // { order: 1, cleanName: "hello-world", hasOrder: true }
 * parseOrder("V 5 another-channel") // { order: 5, cleanName: "another-channel", hasOrder: true }
 * parseOrder("regular-file") // { order: null, cleanName: "regular-file", hasOrder: false }
 */
export function parseOrder(filename: string): OrderParseResult {
  const match = filename.match(ORDER_PATTERN)
  
  if (!match) {
    return {
      order: null,
      cleanName: filename,
      hasOrder: false,
    }
  }
  
  const [, , orderStr, cleanName] = match
  const order = parseInt(orderStr, 10)
  
  return {
    order: isNaN(order) ? null : order,
    cleanName: cleanName.trim(),
    hasOrder: true,
  }
}

/**
 * Detects file type based on various heuristics
 * 
 * @param filePath - Path to the file
 * @param content - Optional file content for content-based detection
 * @returns File type detection result
 */
export function detectFileType(
  filePath: string, 
  content?: string
): FileTypeDetectionResult {
  const filename = basename(filePath, extname(filePath))
  const extension = extname(filePath).toLowerCase()
  
  // Method 1: Extension-based detection
  if (EXTENSION_TYPE_MAP[extension]) {
    return {
      type: EXTENSION_TYPE_MAP[extension],
      confidence: 0.8,
      method: 'extension',
    }
  }
  
  // Method 2: Schema-based detection from filename
  for (const [pattern, type] of Object.entries(SCHEMA_PATTERNS)) {
    if (filename.includes(pattern)) {
      return {
        type,
        confidence: 0.9,
        method: 'schema',
      }
    }
  }
  
  // Method 3: Content-based detection (if content provided)
  if (content) {
    try {
      const parsed = JSON.parse(content)
      
      // Check for specific schema indicators
      if (parsed.manto_version) {
        return {
          type: 'server',
          confidence: 0.95,
          method: 'content',
        }
      }
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0]
        if (firstItem.name && firstItem.color) {
          return {
            type: 'roles',
            confidence: 0.9,
            method: 'content',
          }
        }
      }
      
      if (parsed.name && parsed.topic !== undefined) {
        return {
          type: 'text-channel',
          confidence: 0.7,
          method: 'content',
        }
      }
      
      if (parsed.name && parsed.topic === undefined) {
        return {
          type: 'voice-channel',
          confidence: 0.6,
          method: 'content',
        }
      }
    } catch {
      // Invalid JSON, skip content-based detection
    }
  }
  
  // Method 4: Directory-based detection
  const dirName = basename(dirname(filePath)).toLowerCase()
  if (SCHEMA_PATTERNS[dirName]) {
    return {
      type: SCHEMA_PATTERNS[dirName],
      confidence: 0.6,
      method: 'schema',
    }
  }
  
  return {
    type: null,
    confidence: 0,
    method: 'extension',
  }
}

/**
 * Normalizes a filename by removing order prefixes and cleaning up
 * 
 * @param filename - Original filename
 * @returns Normalized filename
 */
export function normalizeFilename(filename: string): string {
  const { cleanName } = parseOrder(filename)
  return cleanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
}

/**
 * Generates a filename with order prefix
 * 
 * @param name - Base name
 * @param order - Order number
 * @param type - Channel type prefix (T for text, V for voice, etc.)
 * @returns Formatted filename with order
 */
export function generateOrderedFilename(
  name: string, 
  order: number, 
  type?: string
): string {
  const prefix = type ? `${type} ` : ''
  return `${prefix}${order} ${name}`
}

/**
 * Extracts channel type from filename
 * 
 * @param filename - Filename to analyze
 * @returns Channel type or null if not found
 */
export function extractChannelType(filename: string): string | null {
  const match = filename.match(/^([A-Z])\s*\d+\s+/)
  return match ? match[1] : null
}

/**
 * Validates order number
 * 
 * @param order - Order number to validate
 * @returns Whether the order is valid
 */
export function isValidOrder(order: number): boolean {
  return Number.isInteger(order) && order >= 0 && order <= 9999
}

/**
 * Sorts files by their order numbers
 * 
 * @param files - Array of file paths
 * @returns Sorted array of file paths
 */
export function sortFilesByOrder(files: string[]): string[] {
  return files.sort((a, b) => {
    const orderA = parseOrder(basename(a)).order ?? Number.MAX_SAFE_INTEGER
    const orderB = parseOrder(basename(b)).order ?? Number.MAX_SAFE_INTEGER
    return orderA - orderB
  })
}

/**
 * Groups files by their detected type
 * 
 * @param files - Array of file paths
 * @returns Map of file type to file paths
 */
export function groupFilesByType(files: string[]): Map<ParsableFileType, string[]> {
  const groups = new Map<ParsableFileType, string[]>()
  
  for (const file of files) {
    const detection = detectFileType(file)
    if (detection.type) {
      if (!groups.has(detection.type)) {
        groups.set(detection.type, [])
      }
      groups.get(detection.type)!.push(file)
    }
  }
  
  return groups
}
