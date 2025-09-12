# Advanced Usage

Once you're comfortable with the basics of Manto, you can explore advanced features and techniques to create more sophisticated Discord server configurations.

## Complex Permission Systems

### Role Hierarchy and Inheritance

Design your role hierarchy carefully to leverage Discord's permission inheritance:

```yaml
# roles.yml - Ordered from highest to lowest
- name: Owner
  color: "#ff0000"
  hoist: true
  permissions:
    - Administrator

- name: Admin
  color: "#ff4500"
  hoist: true
  permissions:
    - ManageGuild
    - ManageChannels
    - ManageRoles
    - BanMembers
    - KickMembers

- name: Senior Moderator
  color: "#ff8c00"
  hoist: true
  permissions:
    - ManageMessages
    - BanMembers
    - KickMembers
    - ManageChannels
    - MuteMembers
    - DeafenMembers

- name: Moderator
  color: "#ffff00"
  hoist: true
  permissions:
    - ManageMessages
    - KickMembers
    - MuteMembers

- name: Helper
  color: "#00ff00"
  hoist: true
  permissions:
    - ManageMessages

- name: VIP
  color: "#ff69b4"
  hoist: true
  permissions:
    - PrioritySpeaker
    - CreateInstantInvite

- name: Member
  color: "#00bfff"
  hoist: false
  permissions:
    - SendMessages
    - ReadMessageHistory
    - AddReactions
    - Connect
    - Speak
    - UseVAD

- name: Muted
  color: "#808080"
  hoist: false
  permissions:
    - ReadMessageHistory
    - ViewChannel
```

### Advanced Permission Overrides

Create sophisticated permission systems using channel-specific overrides:

```yaml
# channels/private-staff/T 1 sensitive-discussions.yml
name: sensitive-discussions
topic: Confidential staff discussions - highest clearance only
slow_mode: off
nsfw: false
hide_threads_after: 1w
overwrites:
  # Deny everyone by default
  - role: "@everyone"
    permissions:
      ViewChannel: Deny

  # Allow viewing but not participating for lower staff
  - role: Helper
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow

  # Allow participation for moderators
  - role: Moderator
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow

  # Full access for senior staff
  - role: Senior Moderator
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      ManageMessages: Allow

  # Complete control for admins
  - role: Admin
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      ManageMessages: Allow
      ManageChannel: Allow
```

## Dynamic Channel Management

### Temporary Channels

Create channels that can be easily modified or removed:

```yaml
# channels/events/T 1 current-event.yml
name: current-event
topic: Current server event - check announcements for details
slow_mode: 10s
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: Event Manager
    permissions:
      ManageMessages: Allow
      ManageChannel: Allow
```

### Seasonal Channels

Design channels that can be easily toggled for seasonal events:

```yaml
# channels/seasonal/T 1 halloween-2024.yml
name: halloween-2024
topic: Halloween event discussions and costume sharing
slow_mode: off
nsfw: false
hide_threads_after: 3d
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      AttachFiles: Allow
```

## Multi-Server Configurations

### Template-Based Approach

Create reusable templates for consistent server setups:

```yaml
# templates/gaming-server/server.yml
manto_version: 0.1.0
name: "{{SERVER_NAME}}"
icon_url: "{{SERVER_ICON}}"
afk_channel: AFK
afk_timeout: 15min
system_channel: announcements
default_notifications: only_mentions
enable_premium_progress_bar: true
```

## Advanced Channel Configurations

### Slow Mode Strategies

Use slow mode strategically to control channel activity:

```yaml
# High-activity channel with moderate slow mode
name: "general"
slow_mode: "5s"
topic: "General discussion - please keep conversations flowing"

# Announcement channel with strict slow mode
name: "announcements"
slow_mode: "30s"
topic: "Important announcements only - think before posting"

# Spam channel with no slow mode
name: "spam"
slow_mode: "off"
topic: "Feel free to spam here - no restrictions!"
```

### NSFW Channel Management

Properly configure age-restricted content:

```yaml
# channels/nsfw/T 1 adult-discussion.yml
name: adult-discussion
topic: "18+ discussions only - you must be 18+ to participate"
slow_mode: off
nsfw: true
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Deny
  - role: "18+ Verified"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      AttachFiles: Allow
```

### Thread Management

Configure thread archiving for different channel types:

```yaml
# Quick discussion channels
hide_threads_after: "1h"

# General discussion channels
hide_threads_after: "24h"

# Long-term project channels
hide_threads_after: "3d"

# Archive channels
hide_threads_after: "1w"
```

## Integration Patterns

### Bot Integration

Design channels with specific bot interactions in mind:

```yaml
# channels/bots/T 1 music-commands.yml
name: music-commands
topic: Music bot commands and requests
slow_mode: 10s
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: Music Bot
    permissions:
      SendMessages: Allow
      ManageMessages: Allow
      EmbedLinks: Allow
      AttachFiles: Allow
```

### Webhook Integration

Configure channels for webhook notifications:

```yaml
# channels/integrations/T 1 github-notifications.yml
name: github-notifications
topic: GitHub webhook notifications and updates
slow_mode: off
nsfw: false
hide_threads_after: 3d
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: "@everyone"
    permissions:
      SendMessages: Deny # Only webhooks can send messages
  - role: GitHub Webhook
    permissions:
      SendMessages: Allow
      EmbedLinks: Allow
      AttachFiles: Allow
```

## Performance Optimization

### Channel Organization

Optimize server performance with strategic channel organization:

```yaml
# Group related channels to reduce permission calculations
channels/
├── public/          # All public channels together
├── private/         # All private channels together
├── voice/           # All voice channels together
└── system/          # System channels together
```

### Permission Optimization

Minimize permission overrides to improve performance:

```yaml
# Use category-level permissions when possible
# channels/private/.config.yml
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Deny
  - role: "Member"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow

# Then individual channels only need specific overrides
# channels/private/T 1 admin-only.yml
overwrites:
  - role: "Member"
    permissions:
      ViewChannel: Deny
  - role: "Admin"
    permissions:
      ViewChannel: Allow
```

## Automation and CI/CD

### Configuration Validation

Set up automated validation in your CI/CD pipeline:

```yaml
# .github/workflows/validate-config.yml
name: Validate Manto Configuration
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Manto Config
        run: |
          manto validate
          manto lint
```

### Automated Deployment

Deploy configurations automatically:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Discord
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Discord
        run: |
          manto deploy --token ${{ secrets.DISCORD_BOT_TOKEN }}
        env:
          DISCORD_BOT_TOKEN: ${{ secrets.DISCORD_BOT_TOKEN }}
```

## Best Practices

### Configuration Management

1. **Version Control**: Always use Git to track configuration changes
2. **Documentation**: Document complex permission setups
3. **Testing**: Test configurations in a development server first
4. **Backup**: Keep backups of working configurations
5. **Review**: Use pull requests for configuration changes

### Security Considerations

1. **Principle of Least Privilege**: Give users only the permissions they need
2. **Regular Audits**: Periodically review permissions and roles
3. **Sensitive Channels**: Protect sensitive information with proper permissions
4. **Bot Permissions**: Limit bot permissions to what's necessary

### Performance Tips

1. **Minimize Overrides**: Use category permissions when possible
2. **Logical Grouping**: Group related channels together
3. **Role Hierarchy**: Design role hierarchy for efficient permission inheritance
4. **Channel Limits**: Be mindful of Discord's channel limits

## Troubleshooting

### Common Issues

**Permission Conflicts**: When permissions don't work as expected, check:
- Role hierarchy order
- Channel-specific overrides
- Category-level permissions
- Discord's permission inheritance rules

**Validation Errors**: For schema validation issues:
- Check YAML syntax
- Verify required fields are present
- Ensure enum values match exactly
- Validate against the latest schema

**Deployment Failures**: When deployment fails:
- Verify bot permissions
- Check for naming conflicts
- Ensure all referenced roles exist
- Validate network connectivity

### Debugging Tools

Use Manto's built-in debugging features:
```bash
# Validate configuration
manto check --verbose

# Check for common issues
manto lint

# Fix linting issues
manto lint:fix

# Dry run deployment
manto push --dry-run

# Generate configuration report
manto report
```

These advanced techniques will help you create sophisticated, maintainable Discord server configurations that scale with your community's needs.
