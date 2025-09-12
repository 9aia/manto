# Getting Started

This guide will walk you through creating your first Manto configuration from scratch. By the end, you'll have a complete Discord server configuration ready to deploy.

## Prerequisites

Before you begin, make sure you have:
- A text editor with YAML support (VS Code, IntelliJ, etc.)
- Basic understanding of YAML syntax
- A Discord server where you have administrative permissions
- The Manto bot token (if deploying)

## Step 1: Create the Directory Structure

Start by creating the basic directory structure for your server configuration:

```bash
mkdir my-discord-server
cd my-discord-server
mkdir channels
mkdir channels/General
mkdir channels/Staff
mkdir files
```

Your structure should look like this:
```
my-discord-server/
├── channels/
│   ├── General/
│   └── Staff/
└── files/
```

## Step 2: Configure Server Settings

Create `server.yml` in the root directory:

```yaml
manto_version: 0.1.0
name: My Awesome Server
icon_url: "" # Optional: URL to server icon
afk_channel: AFK
afk_timeout: 5min
system_channel: system
default_notifications: only_mentions
enable_premium_progress_bar: true
banner_url: "" # Optional: URL to server banner
```

### Key Settings Explained
- `manto_version`: Always specify the schema version
- `name`: Your server's display name
- `afk_channel`: Channel for inactive users (we'll create this)
- `afk_timeout`: How long before users are considered AFK
- `system_channel`: Where Discord sends system messages
- `default_notifications`: Default notification level for new members

## Step 3: Define Roles

Create `roles.yml` with basic roles:

```yaml
- name: Admin
  color: "#ff0000"
  hoist: true
  mentionable: true
  permissions:
    - Administrator

- name: Moderator
  color: "#ffff00"
  hoist: true
  mentionable: true
  permissions:
    - ManageMessages
    - BanMembers
    - KickMembers
    - ManageChannels

- name: Member
  color: "#00ff00"
  hoist: false
  mentionable: false
  permissions:
    - SendMessages
    - ReadMessageHistory
    - AddReactions
    - Connect
    - Speak
```

### Role Hierarchy
Roles are applied in the order they appear in the file. The first role (Admin) will have the highest position in Discord.

## Step 4: Create Categories

### General Category
Create `channels/General/.config.yml`:

```yaml
name: General
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
```

### Staff Category
Create `channels/Staff/.config.yml`:

```yaml
name: Staff
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Deny
  - role: Moderator
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
  - role: Admin
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      ManageMessages: Allow
```

## Step 5: Create Channels

### Welcome Channel (Uncategorized)
Create `channels/_/T 1 welcome.yml`:

```yaml
name: welcome
topic: Welcome to our server! Please read the rules and introduce yourself.
slow_mode: off
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: "@everyone"
    permissions:
      SendMessages: Deny # Only staff can send messages
  - role: Moderator
    permissions:
      SendMessages: Allow
```

### General Discussion
Create `channels/General/T 1 general.yml`:

```yaml
name: general
topic: General discussion and chat
slow_mode: off
nsfw: false
hide_threads_after: 24h
```

### Voice Channel
Create `channels/General/V Voice Chat.yml`:

```yaml
name: Voice Chat
topic: Main voice channel for general discussion
slow_mode: off
nsfw: false
hide_threads_after: 24h
```

### AFK Channel
Create `channels/General/V AFK.yml`:

```yaml
name: AFK
topic: "You've been moved here due to inactivity"
slow_mode: off
nsfw: false
hide_threads_after: 24h
```

### System Channel
Create `channels/General/T 2 system.yml`:

```yaml
name: system
topic: System messages and server updates
slow_mode: off
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow
  - role: "@everyone"
    permissions:
      SendMessages: Deny # Only bots can send messages
```

### Staff Channels
Create `channels/Staff/T 1 staff-chat.yml`:

```yaml
name: staff-chat
topic: Private channel for staff discussions
slow_mode: off
nsfw: false
hide_threads_after: 24h
```

Create `channels/Staff/V Staff Voice.yml`:

```yaml
name: Staff Voice
topic: Private voice channel for staff
slow_mode: off
nsfw: false
hide_threads_after: 24h
```

## Step 6: Validate Your Configuration

Before deploying, validate your configuration:

```bash
# If you have the Manto CLI installed
manto validate

# Or check manually:
# - Ensure all YAML files are valid
# - Check that required fields are present
# - Verify role names match in overwrites
```

## Step 7: Deploy to Discord

### Using the Manto Bot
1. Invite the Manto bot to your Discord server
2. Give it administrative permissions
3. Run the deployment command:

```bash
manto deploy --token YOUR_BOT_TOKEN
```

### Manual Deployment
If you prefer to set up manually:
1. Create the server with the name from `server.yml`
2. Create roles in the order specified in `roles.yml`
3. Create categories and channels according to your file structure
4. Set permissions as defined in your configuration files

## Your Complete Structure

After following this guide, your configuration should look like this:

```
my-discord-server/
├── server.yml
├── roles.yml
├── channels/
│   ├── _/
│   │   └── T 1 welcome.yml
│   ├── General/
│   │   ├── .config.yml
│   │   ├── T 1 general.yml
│   │   ├── T 2 system.yml
│   │   ├── V Voice Chat.yml
│   │   └── V AFK.yml
│   └── Staff/
│       ├── .config.yml
│       ├── T 1 staff-chat.yml
│       └── V Staff Voice.yml
└── files/
```

## Next Steps

Now that you have a basic configuration:

1. **Customize**: Modify channels, roles, and permissions to fit your needs
2. **Add More Channels**: Create additional categories and channels
3. **Fine-tune Permissions**: Adjust permission overrides for specific use cases
4. **Version Control**: Initialize Git to track changes
5. **Automate**: Set up automated deployment workflows

## Common Issues and Solutions

### Permission Errors
- Ensure role names in `overwrites` match exactly with role names in `roles.yml`
- Check that you have the necessary permissions to create channels/roles

### Validation Errors
- Verify YAML syntax is correct
- Ensure all required fields are present
- Check that enum values match the schema exactly

### Deployment Issues
- Make sure the bot has sufficient permissions
- Verify the bot token is correct
- Check that channel names don't conflict with existing channels

---

Congratulations! You've created your first Manto configuration. Your Discord server is now defined as code, ready for version control and automated deployment.

## Next Steps

Now that you have a basic configuration, explore the [Overview](./overview.md) to understand how Manto works.

### Advanced Configuration

Once you're comfortable with the basics, explore:
- [Advanced Usage](./advanced-usage.md) for complex configurations
- [Examples](./examples.md) for real-world server setups
- Custom permission combinations
- Integration with CI/CD pipelines
