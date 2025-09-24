# File Structure <!-- omit in toc -->

Manto uses a structured directory layout to represent your Discord server configuration. Understanding this structure is key to effectively using Manto.

## Table of Contents <!-- omit in toc -->

- [Root Directory Structure](#root-directory-structure)
- [Core Files](#core-files)
  - [`server.yml`](#serveryml)
  - [`roles.yml`](#rolesyml)
- [Channel Organization](#channel-organization)
  - [Directory Structure](#directory-structure)
  - [Naming Conventions](#naming-conventions)
    - [Channel Files](#channel-files)
    - [Category Directories](#category-directories)
  - [Category Configuration](#category-configuration)
- [File Contents](#file-contents)
  - [Text Channel Configuration](#text-channel-configuration)
  - [Voice Channel Configuration](#voice-channel-configuration)
- [Special Directories](#special-directories)
  - [`.manto/`](#manto)
  - [`files/`](#files)

## Root Directory Structure

```
your-server-config/
├── .manto/                   # Manto cache files (auto-generated)
├── channels/                 # Channel configurations
├── files/                    # File attachments and resources
├── roles.yml                 # Role definitions and permissions
└── server.yml                # Server settings and configuration
```

## Core Files

### `server.yml`
Defines the main server settings including name, icon, AFK configuration, and notification preferences.

```yaml
manto_version: 0.1.0
name: My Awesome Server
icon_url: "https://example.com/icon.png"
afk_channel: AFK
afk_timeout: 5min
system_channel: system
default_notifications: only_mentions
```

> [!IMPORTANT]
> You must specify the `manto_version` field in your server configuration file. If you don't, Manto will set it to the latest version automatically. Manto isn't able to validate your configuration properly without this field.

### `roles.yml`
Contains all role definitions with their permissions, colors, and display options.

```yaml
- name: Admin
  color: "#ff0000"
  permissions:
    - Administrator
- name: Moderator
  color: "#ffff00"
  permissions:
    - ManageMessages
    - BanMembers
```

## Channel Organization

### Directory Structure
```
channels/
├── _/                        # Uncategorized channels
│   └── T 1 welcome.yml       # Text channel: welcome
├── Community/                # Community category
│   ├── .config.yml           # Category configuration
│   ├── T 1 general.yml       # Text channel: general
│   ├── T 2 offtopic.yml      # Text channel: offtopic
│   ├── V Voice-1.yml         # Voice channel: Voice-1
│   └── V Voice-2.yml         # Voice channel: Voice-2
└── Server/                   # Server category
    ├── .config.yml           # Category configuration
    ├── T 1 rules.yml         # Text channel: rules
    └── V AFK.yml             # Voice channel: AFK
```

### Naming Conventions

#### Channel Files
- **`T` prefix**: Text channels
- **`V` prefix**: Voice channels
- **Numbers**: Channel order within categories (1, 2, 3, etc.)
- **Spaces**: Separate the type prefix from the name

Examples:
- `T 1 general.yml` → Text channel named "general", first in category
- `V Voice-1.yml` → Voice channel named "Voice-1"
- `T 2 announcements.yml` → Text channel named "announcements", second in category

#### Category Directories
- **Directory name**: Becomes the category name
- **`.config.yml`**: Optional category-specific configuration
- **Special directory `_`**: For uncategorized channels

### Category Configuration

Each category can have a `.config.yml` file for category-specific settings:

```yaml
# channels/Community/.config.yml
name: Community # Optional: override directory name
overwrites:
  - role: "@everyone"
    permissions:
      SendMessages: Allow
  - role: Muted
    permissions:
      SendMessages: Deny
```

## File Contents

### Text Channel Configuration
```yaml
# channels/Community/T 1 general.yml
name: general # Optional: override filename
topic: General discussion # Channel topic
slow_mode: off # Slow mode setting
nsfw: false # Age restriction
hide_threads_after: 24h # Thread archiving
overwrites: # Channel-specific permissions
  - role: Muted
    permissions:
      SendMessages: Deny
```

### Voice Channel Configuration
```yaml
# channels/Community/V Voice-1.yml
name: Voice-1 # Optional: override filename
topic: General voice chat # Channel topic
slow_mode: off # Slow mode setting
nsfw: false # Age restriction
hide_threads_after: 24h # Thread archiving
overwrites: # Channel-specific permissions
  - role: Muted
    permissions:
      Connect: Deny
```

## Special Directories

### `.manto/`
Auto-generated directory containing:
- Cache files for performance
- Temporary files during operations
- Metadata about the configuration

> [!CAUTION]
> **Do not edit files in this directory manually.**

### `files/`
Directory can be used for storing:
- Server icons and banners
- Role icons
- Channel attachments
- Message templates
- Other static resources
