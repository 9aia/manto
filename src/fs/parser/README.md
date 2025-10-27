# Manto Parser

A professional, type-safe, and efficient parser for Discord server configurations using Manto schemas.

## Features

- **Type-Safe**: Full TypeScript support with strict type checking
- **Efficient**: Optimized for performance with parallel processing
- **Order Parsing**: Supports order prefixes in filenames (e.g., "T 1 hello", "V 2 another")
- **Schema Validation**: Validates against Manto schemas using Zod
- **Error Handling**: Comprehensive error reporting and handling
- **Batch Processing**: Parse multiple files or entire directories
- **Flexible**: Configurable options for different parsing needs

## Installation

The parser is part of the Manto project and uses the existing schema definitions.

## Quick Start

```typescript
import { createMantoParser, parseMantoFile } from './src/fs/parser'

// Parse a single file
const result = await parseMantoFile('/path/to/server.json')

if ('filePath' in result) {
  console.log('Parsed successfully:', result.data)
} else {
  console.error('Parse error:', result.message)
}

// Parse multiple files
const parser = createMantoParser()
const batchResult = await parser.parseFiles([
  '/path/to/server.json',
  '/path/to/category.json',
  '/path/to/channel.json'
])

console.log(`Successfully parsed ${batchResult.successful.length} files`)
console.log(`Failed to parse ${batchResult.failed.length} files`)
```

## Order Parsing

The parser supports order prefixes in filenames to maintain channel ordering:

```
T 1 general          # Text channel, order 1, name "general"
T 2 announcements     # Text channel, order 2, name "announcements"
V 1 General Voice     # Voice channel, order 1, name "General Voice"
V 2 Gaming           # Voice channel, order 2, name "Gaming"
```

### Order Format

- `T <number> <name>` - Text channel
- `V <number> <name>` - Voice channel
- `<number> <name>` - Generic ordering

## API Reference

### Core Classes

#### `MantoParser`

Main parser class that orchestrates the parsing process.

```typescript
const parser = new MantoParser({
  validate: true,        // Enable schema validation
  parseOrder: true,      // Enable order parsing
  strictMode: true       // Throw on validation errors
})
```

#### `FileParser`

Base class for file parsing operations.

#### Schema-Specific Parsers

- `ServerParser` - Parses server configurations
- `CategoryParser` - Parses category configurations  
- `TextChannelParser` - Parses text channel configurations
- `VoiceChannelParser` - Parses voice channel configurations
- `RolesParser` - Parses roles configurations

### Methods

#### `parseFile(filePath: string)`

Parses a single file with automatic schema detection.

```typescript
const result = await parser.parseFile('/path/to/file.json')
```

#### `parseFiles(filePaths: string[])`

Parses multiple files in parallel.

```typescript
const result = await parser.parseFiles([
  '/path/to/file1.json',
  '/path/to/file2.json'
])
```

#### `parseDirectory(directoryPath: string, recursive?: boolean)`

Recursively parses all files in a directory.

```typescript
const result = await parser.parseDirectory('/path/to/config', true)
```

#### `parseFilesByType(filePaths: string[])`

Groups files by type and parses them separately.

```typescript
const results = await parser.parseFilesByType(filePaths)
for (const [type, result] of results) {
  console.log(`${type}: ${result.successful.length} files parsed`)
}
```

### Schema-Specific Methods

```typescript
// Parse specific schema types
const server = await parser.parseServer('/path/to/server.json')
const category = await parser.parseCategory('/path/to/category.json')
const textChannel = await parser.parseTextChannel('/path/to/text-channel.json')
const voiceChannel = await parser.parseVoiceChannel('/path/to/voice-channel.json')
const roles = await parser.parseRoles('/path/to/roles.json')
```

### Error Handling

The parser provides comprehensive error handling:

```typescript
const result = await parser.parseFile('/path/to/file.json')

if ('filePath' in result) {
  // Success - result is ParsedContent
  console.log('Data:', result.data)
  console.log('Order:', result.order)
  console.log('File Type:', result.fileType)
} else {
  // Error - result is ParserError
  console.error('Error:', result.message)
  console.error('Type:', result.type)
  console.error('Details:', result.details)
}
```

### Error Types

- `validation` - Schema validation errors
- `parsing` - JSON parsing errors
- `file` - File system errors
- `schema` - Schema detection errors

### Batch Results

```typescript
const batchResult = await parser.parseFiles(filePaths)

console.log('Total files:', batchResult.total)
console.log('Successful:', batchResult.successful.length)
console.log('Failed:', batchResult.failed.length)
console.log('Duration:', batchResult.duration, 'ms')

// Get statistics
const stats = parser.getStatistics(batchResult)
console.log('Success rate:', stats.successRate, '%')
console.log('Error breakdown:', stats.errorBreakdown)
```

## Configuration Options

```typescript
interface ParserOptions {
  validate: boolean        // Enable schema validation (default: true)
  parseOrder: boolean     // Enable order parsing (default: true)
  strictMode: boolean     // Throw on validation errors (default: true)
  fileTypeDetector?: (filePath: string) => ParsableFileType | null
}
```

## File Type Detection

The parser automatically detects file types using multiple methods:

1. **Extension-based**: `.json`, `.yml`, `.yaml`
2. **Schema-based**: Filename patterns (`server`, `category`, etc.)
3. **Content-based**: JSON structure analysis
4. **Directory-based**: Parent directory name

## Performance

- **Parallel Processing**: Files are parsed concurrently for better performance
- **Efficient Parsing**: Optimized JSON parsing with content cleaning
- **Memory Efficient**: Streams large files when possible
- **Caching**: Schema parsers are cached for reuse

## Examples

### Parse Server Configuration

```typescript
import { parseServer } from './src/fs/parser'

const server = await parseServer('/path/to/server.json')
if ('filePath' in server) {
  console.log('Server name:', server.data.name)
  console.log('Manto version:', server.data.manto_version)
}
```

### Parse Directory Structure

```typescript
const parser = createMantoParser()
const result = await parser.parseDirectory('./config')

// Group by file type
const byType = new Map()
for (const content of result.successful) {
  if (!byType.has(content.fileType)) {
    byType.set(content.fileType, [])
  }
  byType.get(content.fileType).push(content)
}

console.log('Server configs:', byType.get('server')?.length || 0)
console.log('Categories:', byType.get('category')?.length || 0)
console.log('Text channels:', byType.get('text-channel')?.length || 0)
console.log('Voice channels:', byType.get('voice-channel')?.length || 0)
console.log('Roles:', byType.get('roles')?.length || 0)
```

### Handle Errors

```typescript
const result = await parser.parseFiles(filePaths)

if (result.failed.length > 0) {
  const report = parser.generateErrorReport(result.failed)
  console.error('Parse errors:\n', report)
  
  // Handle specific error types
  for (const error of result.failed) {
    switch (error.type) {
      case 'validation':
        console.error(`Validation error in ${error.filePath}:`, error.message)
        break
      case 'parsing':
        console.error(`JSON error in ${error.filePath}:`, error.message)
        break
      case 'file':
        console.error(`File error in ${error.filePath}:`, error.message)
        break
    }
  }
}
```

## Integration with Discord API

The parsed configurations can be easily adapted for Discord API requests:

```typescript
const parser = createMantoParser()
const result = await parser.parseDirectory('./server-config')

// Convert to Discord API format
const discordChannels = result.successful
  .filter(content => content.fileType === 'text-channel')
  .map(content => ({
    name: content.data.name || content.cleanName,
    type: 0, // Text channel
    position: content.order || 0,
    topic: content.data.topic,
    nsfw: content.data.nsfw || false,
    // ... other Discord channel properties
  }))
  .sort((a, b) => a.position - b.position)
```

## Contributing

When extending the parser:

1. Follow the existing type-safe patterns
2. Add comprehensive error handling
3. Include proper JSDoc documentation
4. Write tests for new functionality
5. Update this README with new features
