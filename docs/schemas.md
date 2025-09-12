# Configuration Schemas

Manto uses JSON Schema to define the structure and validation rules for all configuration files. These schemas ensure your configuration is valid and provide helpful features like auto-completion and error detection.

## What are Schemas?

Schemas define the "shape" of your configuration files - what fields are allowed, what types of values they accept, and what's required vs. optional. They act as a contract between you and Manto, ensuring your configuration will work correctly.

## Schema Benefits

- **Validation**: Catch errors before deployment
- **IntelliSense**: Auto-completion in your editor
- **Documentation**: Built-in help for each field
- **Type Safety**: Ensure correct data types
- **Consistency**: Standardized configuration format

## Core Schemas

### Server Schema (`manto-server.json`)

Defines the main server configuration in `server.yml`.

#### Required Fields
- `manto_version`: Schema version (e.g., "0.1.0")
- `name`: Server name

#### Optional Fields
- `id`: Unique server identifier (auto-generated)
- `icon_url`: Server icon URL
- `afk_channel`: AFK channel name
- `afk_timeout`: AFK timeout duration
- `system_channel`: System messages channel
- `default_notifications`: Default notification level
- `enable_premium_progress_bar`: Show boost progress bar
- `banner_url`: Server banner URL

#### Example
```yaml
manto_version: 0.1.0
name: My Gaming Server
icon_url: "https://example.com/server-icon.png"
afk_channel: AFK
afk_timeout: 5min
system_channel: system
default_notifications: only_mentions
enable_premium_progress_bar: true
banner_url: "https://example.com/banner.png"
```

### Roles Schema (`manto-roles.json`)

Defines role configurations in `roles.yml`.

#### Role Properties
- `id`: Unique role identifier (auto-generated)
- `name`: Role name (required)
- `color`: Hex color code (required, e.g., "#ff0000")
- `icon_url`: Role icon URL (optional)
- `hoist`: Separate role members in member list
- `mentionable`: Allow role mentions
- `permissions`: Array of Discord permissions

#### Example
```yaml
- name: Admin
  color: "#ff0000"
  icon_url: "https://example.com/admin-icon.png"
  hoist: true
  mentionable: true
  permissions:
    - Administrator
- name: Moderator
  color: "#ffff00"
  hoist: true
  mentionable: false
  permissions:
    - ManageMessages
    - BanMembers
    - KickMembers
```

### Text Channel Schema (`manto-text-channel.json`)

Defines text channel configurations.

#### Properties
- `id`: Unique channel identifier (auto-generated)
- `name`: Channel name (optional, defaults to filename)
- `topic`: Channel topic/description
- `slow_mode`: Slow mode delay
- `nsfw`: Age restriction flag
- `hide_threads_after`: Thread archiving duration
- `overwrites`: Channel-specific permission overrides

#### Slow Mode Options
- `"off"`, `"5s"`, `"10s"`, `"15s"`, `"30s"`
- `"1m"`, `"2m"`, `"5m"`, `"10m"`, `"15m"`, `"30m"`
- `"1h"`, `"2h"`, `"6h"`

#### Thread Archiving Options
- `"1h"`, `"24h"`, `"3d"`, `"1w"`

#### Example
```yaml
name: general
topic: General discussion for the community
slow_mode: 5s
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: Muted
    permissions:
      SendMessages: Deny
  - role: VIP
    permissions:
      SendMessages: Allow
      ManageMessages: Allow
```

### Voice Channel Schema (`manto-voice-channel.json`)

Similar to text channels but for voice channels.

#### Properties
Same as text channels, with voice-specific considerations:
- `topic`: Channel topic (displayed when hovering)
- `slow_mode`: Applies to text in voice channels
- `nsfw`: Age restriction
- `hide_threads_after`: Thread archiving in voice channels
- `overwrites`: Voice-specific permissions

#### Example
```yaml
name: General Voice
topic: Main voice channel for general discussion
slow_mode: off
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: Muted
    permissions:
      Connect: Deny
      Speak: Deny
```

### Category Schema (`manto-category.json`)

Defines category configurations in `.config.yml` files.

#### Properties
- `id`: Unique category identifier (auto-generated)
- `name`: Category name (optional, defaults to directory name)
- `overwrites`: Category-level permission overrides

#### Example
```yaml
name: Community # Optional: override directory name
overwrites:
  - role: "@everyone"
    permissions:
      SendMessages: Allow
      ViewChannel: Allow
  - role: Muted
    permissions:
      SendMessages: Deny
      Connect: Deny
```

## Permission Overrides

Both channels and categories support permission overrides through the `overwrites` field.

### Override Structure
```yaml
overwrites:
  - role: RoleName # or "@everyone"
    permissions:
      PermissionName: Allow|Deny|Inherit
```

### Common Permissions
- **Text Channels**: `SendMessages`, `ReadMessageHistory`, `AddReactions`
- **Voice Channels**: `Connect`, `Speak`, `UseVAD`
- **General**: `ViewChannel`, `ManageChannel`, `ManageMessages`

### Example
```yaml
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
  - role: Muted
    permissions:
      SendMessages: Deny
  - role: Moderator
    permissions:
      ManageMessages: Allow
      ManageChannel: Allow
```

## Schema Validation

### In Your Editor
Most modern editors support JSON Schema validation:
- **VS Code**: Install YAML extension with schema support
- **IntelliJ**: Built-in YAML schema support
- **Vim/Neovim**: Use LSP with YAML language server

### Command Line
Manto provides validation tools to check your configuration:
```bash
manto check
```

### Common Validation Errors
1. **Missing required fields**: Ensure all required fields are present
2. **Invalid enum values**: Check that enum values match exactly
3. **Wrong data types**: Ensure strings, booleans, and arrays are correct
4. **Invalid color codes**: Use proper hex format (#rrggbb)

## Schema Evolution

Schemas are versioned to handle changes over time:
- **Major version changes**: Breaking changes requiring migration
- **Minor version changes**: New optional fields
- **Patch version changes**: Bug fixes and clarifications

Always specify the `manto_version` in your `server.yml` to ensure compatibility.

## Next Steps

Now that you understand the schemas, check out the [Advanced Usage Guide](./advanced-usage.md) to learn about complex configurations and best practices.
