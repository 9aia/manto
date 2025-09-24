---
description: A timeline of key milestones and upcoming features or releases.
---

# Roadmap

## Phases

### Bare Server Setup

**0.1.0** - Push

- Bring your own Discord Bot key
- `$ manto push`: apply current config to server
- `$ manto push --dry-run`: apply current config to server in dry run

**0.2.0** - Init

- `$ manto init`: interactive guide for bare server setup
  - selection of root folder for the server config
  - how to setup the server guide
  - git init option
  - invite bot link creation
  - extract server name and prompt for user to confirm
  - scaffolding (create Manto files, .vscode settings, .gitignore, README.md, etc.)

**0.3.0** - Linting

- Add **schemas** for server objects (roles, channels, categories, etc.)
- `$ manto lint`: validate config structure based on schemas
- `$ manto lint --fix`: validate config structure based on schemas and fix issues

**0.4.0** - Invite Bot

- `$ manto invite`: generate invite link for the Manto bot so you can easily invite it to your server
- `$ manto invite --push`: same as above but also push the config after the bot is added to your server

### Sync

**0.4.0** - Pull

- `$ manto pull`: fetch current server state into local config
- `$ manto pull --dry-run`: fetch current server state into local config in dry run
- Update scaffolding options to include init from an existing Discord server

**0.5.0** - Conflict Detection & Resolution

- Detect & warn about drift between server and local files
- Resolve conflicts

### GitHub Integration

**0.6.0** - Auto-push on merge with GitHub Actions

- Auto-push configs on merge into a production branch
- Prebuilt GitHub Actions for CI/CD on Discord config changes
- Update scaffolding options to include GitHub Actions

**0.7.0** - GitHub Scaffolding

- Scaffold GitHub repository with Manto files
- Update CLI to be able to scaffold a new GitHub repository as well

### Website

**0.7.0** - Homepage & Docs

- Create a docs website for the project

**0.8.0** - Web-based Wizard

- Similar interactive flow as the CLI but on a website
- Connect GitHub account on the website and scaffold a new Manto repository easily

### Paid Features

**0.8.0** - HTTP API

- Expose HTTP API endpoints to communicate with the Discord Bot
  - Authentication
  - Client-side cache of config file diff
- `$ manto auth`: authenticate CLI with hosted bot
- Official Manto Bot deployment

**0.9.0** - Discord bot client

- Use commands from the CLI inside the Discord bot

**0.10.0** - AI Tools

- Use AI to generate Manto files
- Edit Manto files with prompts

### Community Expansions

This include things the community can do to help the project.

// TODO: Add info
