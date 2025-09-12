# Manto Documentation

Welcome to Manto, an innovative approach to Discord server configuration that brings the power of file systems, allowing version control and transparent collaboration to your Discord server management.

## What is Manto?

Manto is a framework that transforms Discord server configuration from a complex, manual process into a structured, file-based system. Instead of clicking through Discord's interface to configure channels, roles, and permissions, you define everything using YAML files in a familiar directory structure.

## Key Benefits

- **Version Control**: Track changes to your server configuration using Git
- **Collaboration**: Multiple team members can work on server configuration simultaneously on GitHub
- **Automation**: Deploy configuration changes automatically through bots and CI/CD
- **Consistency**: Maintain consistent server setups across different environments
- **Backup & Recovery**: Easy backup and restoration of server configurations

## Documentation Structure

- [**Overview**](./overview.md) - Understanding Manto's core concepts
- [**File Structure**](./file-structure.md) - How to organize your configuration files
- [**Configuration Schemas**](./schemas.md) - Understanding the YAML configuration format
- [**Getting Started**](./getting-started.md) - Your first Manto configuration
- [**Advanced Usage**](./advanced-usage.md) - Complex configurations and best practices
- [**Examples**](./examples.md) - Real-world configuration examples

## Quick Start

1. Create a Discord server if you don't have one ([Official Guide](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server))
2. Scaffold your server configuration using the Manto CLI: `$ manto init`
3. Invite the Manto bot and push your configuration: `$ manto invite --push`
4. Change your server name in `server.yml` and push your configuration again: `$ manto push`

## Next Steps

Now that you understand the schemas, check out the [Getting Started Guide](./getting-started.md) to create your first Manto configuration.
