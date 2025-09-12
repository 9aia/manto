# Manto

> [!WARNING]
> Manto is currently a work in progress. Expect potential bugs, incomplete documentation, and ongoing development. Approach it with a growth mindset, enjoy experimenting, and refrain from using it for critical production purposes at this time.

This project aims to simplify Discord server configuration through a file system approach.

**Note**: This project serves as a framework for server configuration. Additional scripting might be needed for automation or specific functionalities.

## Goals

- **Simplify server setup**: Provide a user-friendly method for configuring channels, categories, roles, permissions, and general settings using a familiar file system structure.
- **Enable version control**: Allow tracking changes and reverting to previous configurations using version control systems like Git.
- **Facilitate collaboration**: Enable teams to manage server configuration collaboratively by sharing the configuration files.

## Scope

This project includes the creation and management of the following:

* **File System Structure**: A structured folder system to represent channels, categories, roles, server settings and more.
* **Configuration Schemas**: YAML schemas to define server permissions, roles, and general settings, making it possible for validation, intellisense and context for AI for the files.
* **Discord Bot**: A deployed Discord Bot that makes it possible to automate pushing or pulling configurations from a Discord server.
* **API**: A REST API that communicates with the Discord Bot and provide AI tools to help with the configuration process such as generating based on a prompt.
* **CLI**: A CLI application that communicates with the API to help with the configuration process such as scaffolding the files, communicating with the Discord Bot, using AI tools, etc.
* **GitHub Bot**: A GitHub Bot that communicates with the Discord Bot when PRs are merged.
* **Web-based Wizard**: A deployed website that simplifies the configuration process by allowing you to connect your GitHub account, automatically create new repositories and generate the files using AI.

**The project does not include:**

* User management (adding/removing users)
* Advanced moderation tools or integrations

## Documentation

### Example

```bash
github.com/9aia/discord
├── .manto/                   # Manto cache files
├── channels/                 # Channel configurations
│   ├── _/                    # Uncategorized channels
│   │   └── T 1 welcome.yml   # Text channel: welcome
│   ├── Community/            # Community category
│   │   ├── .config.yml       # Category configuration
│   │   ├── T 1 general.yml   # Text channel: general
│   │   ├── T 2 offtopic.yml  # Text channel: offtopic
│   │   ├── T 3 memes.yml     # Text channel: memes
│   │   ├── V Voice-1.yml     # Voice channel: Voice-1
│   │   └── V Voice-2.yml     # Voice channel: Voice-2
│   └── Server/               # Server category
│       ├── .config.yml       # Category configuration
│       ├── T 1 rules.yml     # Text channel: rules
│       ├── T 2 system.yml    # Text channel: system
│       ├── T 3 updates.yml   # Text channel: updates
│       └── V AFK.yml         # Voice channel: AFK
├── files/                    # File attachments and resources
├── .gitignore                # Git ignore rules
├── roles.yml                 # Role definitions and permissions
└── server.yml                # Server settings and configuration
```

**File Naming Convention:**
- `T` prefix: Text channels
- `V` prefix: Voice channels
- Numbers indicate channel order within categories
- `.config.yml`: Category-specific configurations

## User Guide

### Requirements

To use this project effectively, you will need:

- A basic understanding of Discord server configuration, including channels, categories, roles, and permissions.
- Familiarity with file system management concepts like creating and editing folders and files.
- Knowledge of YAML format, used for defining roles and permissions configurations.
- A text editor or IDE might be helpful for editing the files.
- (Optional) A version control system like Git for tracking configuration changes.

### Run

You will need a discord bot token.

```bash
TOKEN=YourTokenHere ts-node index.ts
```

## Developer Guide

Check out [CONTRIBUTING](/CONTRIBUTING.md).
