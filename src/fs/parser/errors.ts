import type { ZodIssue } from 'zod'
import type { ParserError } from './types'
import { ZodError } from 'zod'

/**
 * Error types for parser operations
 */
export enum ParserErrorType {
  VALIDATION = 'validation',
  PARSING = 'parsing',
  FILE = 'file',
  SCHEMA = 'schema',
}

/**
 * Creates a parser error with standardized format
 *
 * @param message - Error message
 * @param filePath - File path where error occurred
 * @param type - Error type
 * @param details - Additional error details
 * @param originalError - Original error if available
 * @returns Standardized parser error
 */
export function createParserError(
  message: string,
  filePath: string,
  type: ParserErrorType,
  details?: Record<string, unknown>,
  originalError?: Error,
): ParserError {
  return {
    message,
    filePath,
    type: type as ParserError['type'],
    details,
    originalError,
  }
}

/**
 * Creates a validation error from Zod validation failure
 *
 * @param error - Zod validation error
 * @param filePath - File path where validation failed
 * @returns Parser error for validation failure
 */
export function createValidationError(
  error: ZodError,
  filePath: string,
): ParserError {
  const issues = error.issues.map(formatZodIssue)

  return createParserError(
    `Validation failed: ${issues.join(', ')}`,
    filePath,
    ParserErrorType.VALIDATION,
    {
      issues: error.issues,
      formattedIssues: issues,
      errorCount: error.issues.length,
    },
    error,
  )
}

/**
 * Creates a file reading error
 *
 * @param error - File system error
 * @param filePath - File path that couldn't be read
 * @returns Parser error for file operation failure
 */
export function createFileError(
  error: Error,
  filePath: string,
): ParserError {
  return createParserError(
    `Failed to read file: ${error.message}`,
    filePath,
    ParserErrorType.FILE,
    {
      errorCode: (error as any).code,
      errorName: error.name,
    },
    error,
  )
}

/**
 * Creates a JSON parsing error
 *
 * @param error - JSON parsing error
 * @param filePath - File path with invalid JSON
 * @returns Parser error for JSON parsing failure
 */
export function createParsingError(
  error: Error,
  filePath: string,
): ParserError {
  return createParserError(
    `Failed to parse JSON: ${error.message}`,
    filePath,
    ParserErrorType.PARSING,
    {
      errorName: error.name,
    },
    error,
  )
}

/**
 * Creates a schema detection error
 *
 * @param filePath - File path where schema couldn't be detected
 * @param reason - Reason for detection failure
 * @returns Parser error for schema detection failure
 */
export function createSchemaError(
  filePath: string,
  reason: string,
): ParserError {
  return createParserError(
    `Schema detection failed: ${reason}`,
    filePath,
    ParserErrorType.SCHEMA,
    {
      reason,
    },
  )
}

/**
 * Formats a Zod issue into a readable string
 *
 * @param issue - Zod validation issue
 * @returns Formatted issue string
 */
function formatZodIssue(issue: ZodIssue): string {
  const path = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : ''
  return `${issue.message}${path}`
}

/**
 * Checks if an error is a parser error
 *
 * @param error - Error to check
 * @returns Whether the error is a parser error
 */
export function isParserError(error: unknown): error is ParserError {
  return (
    typeof error === 'object'
    && error !== null
    && 'type' in error
    && 'filePath' in error
    && 'message' in error
  )
}

/**
 * Aggregates multiple parser errors into a summary
 *
 * @param errors - Array of parser errors
 * @returns Summary of errors by type
 */
export function aggregateErrors(errors: ParserError[]): {
  total: number
  byType: Record<string, number>
  byFile: Record<string, number>
} {
  const byType: Record<string, number> = {}
  const byFile: Record<string, number> = {}

  for (const error of errors) {
    byType[error.type] = (byType[error.type] || 0) + 1
    byFile[error.filePath] = (byFile[error.filePath] || 0) + 1
  }

  return {
    total: errors.length,
    byType,
    byFile,
  }
}

/**
 * Creates a comprehensive error report
 *
 * @param errors - Array of parser errors
 * @returns Detailed error report
 */
export function createErrorReport(errors: ParserError[]): string {
  if (errors.length === 0) {
    return 'No errors found.'
  }

  const summary = aggregateErrors(errors)
  let report = `Found ${summary.total} error(s):\n\n`

  // Group by type
  report += 'By Error Type:\n'
  for (const [type, count] of Object.entries(summary.byType)) {
    report += `  ${type}: ${count}\n`
  }

  // Group by file
  report += '\nBy File:\n'
  for (const [file, count] of Object.entries(summary.byFile)) {
    report += `  ${file}: ${count} error(s)\n`
  }

  // Detailed errors
  report += '\nDetailed Errors:\n'
  for (const error of errors) {
    report += `\n${error.filePath} (${error.type}):\n`
    report += `  ${error.message}\n`

    if (error.details) {
      report += `  Details: ${JSON.stringify(error.details, null, 2)}\n`
    }
  }

  return report
}

/**
 * Error handler that can be used to wrap parsing operations
 *
 * @param operation - Function to execute
 * @param filePath - File path for error context
 * @param errorType - Default error type
 * @returns Result of operation or parser error
 */
export async function handleParserError<T>(
  operation: () => Promise<T>,
  filePath: string,
  errorType: ParserErrorType = ParserErrorType.PARSING,
): Promise<T | ParserError> {
  try {
    return await operation()
  }
  catch (error) {
    if (error instanceof ZodError) {
      return createValidationError(error, filePath)
    }

    if (error instanceof Error) {
      if (error.name === 'SyntaxError') {
        return createParsingError(error, filePath)
      }

      if ('code' in error) {
        return createFileError(error as Error, filePath)
      }
    }

    return createParserError(
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      filePath,
      errorType,
      { originalError: error },
      error instanceof Error ? error : undefined,
    )
  }
}
