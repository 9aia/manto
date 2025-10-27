# Manto Parser - Root Directory Parsing

A professional, type-safe, and efficient parser for Discord server configurations using Manto schemas, optimized for the strict Discord server directory structure.

## Features

- **Type-Safe**: Full TypeScript support with strict type checking
- **Efficient**: Optimized for performance with parallel processing
- **Order Parsing**: Supports order prefixes in filenames (e.g., "T 1 hello", "V 2 another")
- **Schema Validation**: Validates against Manto schemas using Zod
- **Error Handling**: Comprehensive error reporting and handling
- **Binary Assets**: Handles icons, banners, and other binary assets
- **Strict Structure**: Optimized for Discord server directory structure
- **Category Support**: Parses categories with their channels and configurations

## Directory Structure

The parser is optimized for this specific Discord server structure:

```
server-root/
├── server.yml|.yaml|.json          # Server configuration
├── roles.yml|.yaml|.json           # Roles configuration
├── icon.png|.jpg|.jpeg|.gif|.webp  # Server icon (takes precedence)
├── banner.png|.jpg|.jpeg|.gif|.webp # Server banner
├── files/                          # Binary assets directory
│   ├── icon.png                    # Additional icons
│   ├── banner.jpg                  # Additional banners
│   ├── role-icon.png               # Role icons
│   └── channel-icon.webp           # Channel icons
└── channels/                       # Channels directory
    ├── General/                    # Category directory
    │   ├── .config                 # Category configuration
    │   ├── T 1 general             # Text channel, order 1
    │   ├── T 2 announcements       # Text channel, order 2
    │   ├── V 1 General Voice       # Voice channel, order 1
    │   └── V 2 Gaming              # Voice channel, order 2
    ├── Staff/                      # Another category
    │   ├── .config                 # Category configuration
    │   ├── T 1 staff-general       # Text channel
    │   └── V 1 Staff Voice         # Voice channel
    └── ...
```

## Quick Start

```typescript
import { parseRootDir, createRootDirParser } from './src/fs/parser'

// Parse entire root directory
const structure = await parseRootDir('/path/to/server-root')

console.log('Server name:', structure.server.data?.name)
console.log('Roles count:', structure.roles.data?.length || 0)
console.log('Categories:', structure.categories.size)
console.log('Assets:', structure.assets.length)

// Access specific data
if ('filePath' in structure.server) {
  console.log('Server config loaded successfully')
} else {
  console.error('Server config error:', structure.server.message)
}
```

## API Reference

### `parseRootDir(rootPath: string, options?: ParserOptions)`

Parses a root directory with the strict Discord server structure.

```typescript
const structure = await parseRootDir('/path/to/server-root', {
  validate: true,        // Enable schema validation
  parseOrder: true,       // Enable order parsing
  strictMode: true       // Throw on validation errors
})
```

### `RootDirStructure`

The returned structure contains all parsed data:

```typescript
interface RootDirStructure {
  server: ParsedContent<MantoServer> | ParserError
  roles: ParsedContent<MantoRoles> | ParserError
  icon?: ParsedContent<BinaryAsset>      // Server icon (takes precedence)
  banner?: ParsedContent<BinaryAsset>     // Server banner
  assets: ParsedContent<BinaryAsset>[]   // All binary assets from files/
  categories: Map<string, CategoryStructure>
  stats: {
    totalFiles: number
    successfulFiles: number
    failedFiles: number
    duration: number
  }
}
```

### `CategoryStructure`

Each category contains its configuration and channels:

```typescript
interface CategoryStructure {
  config: ParsedContent<MantoCategory> | ParserError
  textChannels: ParsedContent<MantoTextChannel>[]
  voiceChannels: ParsedContent<MantoVoiceChannel>[]
  name: string        // Category name (from directory)
  path: string        // Category directory path
}
```

### `BinaryAsset`

Binary assets are parsed with metadata:

```typescript
interface BinaryAsset {
  type: BinaryAssetType    // 'icon' | 'banner' | 'role-icon' | 'channel-icon'
  filePath: string         // Full file path
  fileName: string         // File name
  extension: string         // File extension
  size: number            // File size in bytes
  mimeType: string         // MIME type
}
```

## Examples

### Basic Usage

```typescript
import { parseRootDir } from './src/fs/parser'

const structure = await parseRootDir('./my-server')

// Check if parsing was successful
if ('filePath' in structure.server) {
  console.log('✅ Server config loaded')
  console.log('Server name:', structure.server.data.name)
  console.log('Manto version:', structure.server.data.manto_version)
} else {
  console.error('❌ Server config failed:', structure.server.message)
}

if ('filePath' in structure.roles) {
  console.log('✅ Roles loaded:', structure.roles.data.length)
} else {
  console.error('❌ Roles failed:', structure.roles.message)
}
```

### Working with Categories

```typescript
const structure = await parseRootDir('./my-server')

// Iterate through categories
for (const [categoryName, category] of structure.categories) {
  console.log(`\n📁 Category: ${categoryName}`)
  
  // Check category config
  if ('filePath' in category.config) {
    console.log('  Config:', category.config.data.name || categoryName)
  } else {
    console.log('  Config error:', category.config.message)
  }
  
  // List text channels
  console.log('  📝 Text channels:')
  for (const channel of category.textChannels) {
    const order = channel.order ? `[${channel.order}] ` : ''
    console.log(`    ${order}${channel.data.name || channel.cleanName}`)
  }
  
  // List voice channels
  console.log('  🔊 Voice channels:')
  for (const channel of category.voiceChannels) {
    const order = channel.order ? `[${channel.order}] ` : ''
    console.log(`    ${order}${channel.data.name || channel.cleanName}`)
  }
}
```

### Working with Binary Assets

```typescript
const structure = await parseRootDir('./my-server')

// Server icon (takes precedence)
if (structure.icon) {
  console.log('🖼️ Server icon:', structure.icon.data.fileName)
  console.log('  Size:', structure.icon.data.size, 'bytes')
  console.log('  Type:', structure.icon.data.mimeType)
}

// Server banner
if (structure.banner) {
  console.log('🖼️ Server banner:', structure.banner.data.fileName)
}

// All assets from files/ directory
console.log('📁 Assets from files/:')
for (const asset of structure.assets) {
  console.log(`  ${asset.data.type}: ${asset.data.fileName} (${asset.data.size} bytes)`)
}
```

### Error Handling

```typescript
const structure = await parseRootDir('./my-server')

// Check for errors
const errors: ParserError[] = []

if ('type' in structure.server) errors.push(structure.server)
if ('type' in structure.roles) errors.push(structure.roles)

for (const category of structure.categories.values()) {
  if ('type' in category.config) errors.push(category.config)
}

if (errors.length > 0) {
  console.error('❌ Parsing errors found:')
  for (const error of errors) {
    console.error(`  ${error.filePath}: ${error.message}`)
  }
} else {
  console.log('✅ All files parsed successfully!')
}

// Print statistics
console.log('\n📊 Statistics:')
console.log(`  Total files: ${structure.stats.totalFiles}`)
console.log(`  Successful: ${structure.stats.successfulFiles}`)
console.log(`  Failed: ${structure.stats.failedFiles}`)
console.log(`  Duration: ${structure.stats.duration}ms`)
console.log(`  Success rate: ${(structure.stats.successfulFiles / structure.stats.totalFiles * 100).toFixed(1)}%`)
```

### Converting to Discord API Format

```typescript
const structure = await parseRootDir('./my-server')

// Convert to Discord API format
const discordServer = {
  name: structure.server.data?.name || 'My Server',
  icon: structure.icon?.data.filePath,
  banner: structure.banner?.data.filePath,
}

const discordCategories = Array.from(structure.categories.entries()).map(([name, category]) => ({
  name: category.config.data?.name || name,
  position: 0, // You might want to add ordering logic
  channels: [
    // Text channels
    ...category.textChannels.map(channel => ({
      name: channel.data.name || channel.cleanName,
      type: 0, // Text channel
      position: channel.order || 0,
      topic: channel.data.topic,
      nsfw: channel.data.nsfw || false,
      // ... other Discord channel properties
    })),
    // Voice channels
    ...category.voiceChannels.map(channel => ({
      name: channel.data.name || channel.cleanName,
      type: 2, // Voice channel
      position: channel.order || 0,
      // ... other Discord channel properties
    })),
  ],
}))

const discordRoles = structure.roles.data?.map(role => ({
  name: role.name,
  color: parseInt(role.color.replace('#', ''), 16),
  hoist: role.hoist || false,
  mentionable: role.mentionable || false,
  permissions: role.permissions || [],
  // ... other Discord role properties
})) || []

console.log('Discord server config:', {
  server: discordServer,
  categories: discordCategories,
  roles: discordRoles,
})
```

## Advanced Usage

### Custom Parser Options

```typescript
import { createRootDirParser } from './src/fs/parser'

const parser = createRootDirParser({
  validate: true,        // Enable schema validation
  parseOrder: true,      // Enable order parsing
  strictMode: false,     // Don't throw on validation errors
})

const structure = await parser.parseRootDir('./my-server')

// Update options dynamically
parser.updateOptions({ strictMode: true })
```

### File Type Detection

The parser automatically detects file types based on:

1. **Root files**: `server.*`, `roles.*`, `icon.*`, `banner.*`
2. **Channel files**: `T *` (text), `V *` (voice)
3. **Category config**: `.config` files
4. **Binary assets**: File extensions (`.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`)

### Order Parsing

Channel order is parsed from filenames:

- `T 1 general` → Text channel, order 1, name "general"
- `V 2 Gaming` → Voice channel, order 2, name "Gaming"
- `T 10 announcements` → Text channel, order 10, name "announcements"

Channels are automatically sorted by order within each category.

## Performance

- **Parallel Processing**: Files are parsed concurrently for better performance
- **Efficient Parsing**: Optimized for the strict directory structure
- **Memory Efficient**: Only loads necessary file metadata for binary assets
- **Caching**: Schema parsers are cached for reuse

## Error Types

- `validation` - Schema validation errors
- `parsing` - JSON parsing errors
- `file` - File system errors
- `schema` - Schema detection errors

## Contributing

When extending the root parser:

1. Follow the existing type-safe patterns
2. Add comprehensive error handling
3. Include proper JSDoc documentation
4. Write tests for new functionality
5. Update this README with new features
