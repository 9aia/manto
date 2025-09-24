# Tutorial: Basics 1

This tutorial will walk you through creating your first Manto configuration from scratch. By the end, you'll have a Discord server configured with Manto.

## Prerequisites

Before you begin, make sure you have:
- A text editor with YAML support (VS Code, IntelliJ, etc.)
- Basic understanding of YAML syntax (recommended)
- The Manto bot token and a Discord server where you have administrative permissions (if deploying)

## Step 1: Install the Manto CLI

// TODO: Add installation instructions

## Step 2: Create the Directory Structure

Start by creating the basic directory structure for your server configuration:

```bash
manto init --root-dir my-discord-server --yes # yes to all options, just run the script without any prompts
```

> [!NOTE]
> The `--root-dir` option is used to set the root directory of your server configuration. It's not required, but it's a good idea to set it to the name of your server.

Your structure should look like this:

```
my-discord-server/
├── .vscode/
├── .manto/
├── channels/
├── files/
├── roles.yml
├── server.yml
├── .gitignore
└── README.md
```

## Step 2: Open the Project

Open the project in your text editor. If you're using VS Code, you can run the following command:

```bash
code my-discord-server
```

## Step 3: Naming Your Server

Edit `server.yml` in the root directory:

```yaml
...
name: My Awesome Server # Replace with your server's name
```

## Step 4: Define Roles

Edit `roles.yml` with basic roles:

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
  permissions:
    - SendMessages
    - ReadMessageHistory
    - AddReactions
    - Connect
    - Speak
```

## Step 4: Create Categories

### Creating the Info Category

You can run the following command to generate the Info category:

```bash
manto ca a Info
```

This will create the category folder (`channels/Info`) and the category configuration file (`channels/Info/.config.yml`) where you can edit it to your liking.

### Deny Everyone from Sending Messages in the Info Category

Edit `channels/Info/.config.yml`:

```yaml
...
overwrites:
  - role: "@everyone"
    permissions:
      SendMessages: Deny
```

## Step 5: Create Channels

### Creating the Welcome Channel

Inside the `Info` category, you can create the welcome channel `T 1 welcome.yml`.

**File Naming Explanation**:
- `T`: Text channel
- `1`: Channel order within category
- `welcome`: Channel name

### Adding Permissions to the Welcome Channel

Edit `channels/Info/T 1 welcome.yml`:

```yaml
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