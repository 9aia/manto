# Manto

This project aims to simplify Discord server configuration through a file system approach.

**Note**: This project serves as a framework for server configuration. Additional scripting might be needed for automation or specific functionalities.

## Goals

- **Simplify server setup**: Provide a user-friendly method for configuring channels, categories, roles, permissions, and general settings using a familiar file system structure.
- **Enable version control**: Allow tracking changes and reverting to previous configurations using version control systems like Git.
- **Facilitate collaboration**: Enable teams to manage server configuration collaboratively by sharing the configuration files.

## Scope

This project includes the creation and management of the following:

* **File System Structure**: A structured folder system to represent channels, categories, roles, and server settings.
* **Configuration Schemas**: YAML schemas to define server permissions, roles, and general settings.
* **Bot**: A Discord Bot to automate applying or saving configurations for a Discord server.
* **CLI**: A CLI application to scaffold the files

**The project does not include:**

* User management (adding/removing users)
* Advanced moderation tools or integrations

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
