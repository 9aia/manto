# Overview

## The Problem with Traditional Discord Configuration

Managing Discord servers traditionally involves:
- Manually clicking through Discord's interface
- No version control or change tracking
- Difficult collaboration between team members
- No easy way to backup or restore configurations
- Inconsistent setups across different servers
- No automation possibilities (except simple templates using Discord Templates)

## Manto's Solution

Manto solves these problems by introducing a **file system approach** to Discord server configuration. Instead of using Discord's UI, you define your entire server structure using YAML files organized in a familiar directory structure.

## Core Concepts

### 1. File System as Configuration

Your Discord server configuration is represented as a directory structure where:
- **Directories** represent categories
- **Files** represent channels
- **YAML files** contain configuration data
- **Naming conventions** determine channel/category names and order, and types in channel files

### 2. Declarative Configuration

Instead of describing *how* to create channels and roles, you describe *what* your server should look like. Manto handles the implementation details.

### 3. Schema-Driven Validation

All configuration files follow strict schemas that provide:
- **Validation**: Catch errors before deployment
- **IntelliSense**: Auto-completion in your editor
- **Documentation**: Built-in help for each field

### 4. Version Control Integration

Since everything is stored in files, you can:
- Track changes with Git
- Review configuration changes in pull requests
- Roll back to previous configurations
- Collaborate with team members

### 5. AI-powered Generation

Since everything is stored in files and validated, you can use AI to generate your configuration files. Yes, you can vibecode your server configuration.

## How It Works

1. **Define Structure**: Create directories and files representing your server structure
2. **Configure Settings**: Fill YAML files with channel, role, and server settings
3. **Validate**: Manto validates your configuration against schemas
4. **Deploy**: Use the Manto bot to apply your configuration to Discord
5. **Sync**: Keep your file system and Discord server in sync

## Example Transformation

**Traditional Approach:**
1. Open Discord
2. Right-click server → Create Category
3. Name it "Community"
4. Right-click category → Create Channel
5. Choose "Text Channel"
6. Name it "general"
7. Set permissions
8. Repeat for each channel...

**Manto Approach:**
```yaml
# channels/Community/T 1 general.yml
topic: General discussion for the community
```

This will create a text channel named "general" in the "Community" category with the topic "General discussion for the community".

## Benefits in Practice

- **Speed**: Configure entire servers in minutes, not hours
- **Consistency**: Identical setups across multiple servers
- **Collaboration**: Multiple people can work on the same configuration
- **Automation**: Deploy changes automatically through CI/CD
- **Backup**: Your entire server configuration is in version control
- **Testing**: Test configuration changes before applying them

## What Manto Manages

Manto handles the creation and configuration of:
- **Server Settings**: Name, icon, AFK settings, notification preferences
- **Roles**: Permissions, colors, display options
- **Categories**: Organization and permission inheritance
- **Text Channels**: Topics, slow mode, NSFW settings, permissions
- **Voice Channels**: Similar to text channels with voice-specific options
- **Permissions**: Role-based and channel-specific permission overrides

## What Manto Doesn't Manage

Manto focuses on server structure and configuration, not:
- **User Management**: Adding or removing users
- **Moderation**: Banning users, managing warnings
- **Content**: Messages, files, or other user-generated content
- **Integrations**: Third-party bot configurations

## Next Steps

Now that you understand Manto's core concepts, learn about the [File Structure](./explanations/file-system.md) to understand why Manto uses the file system it does.
