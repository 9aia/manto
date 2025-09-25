# CLI Reference <!-- omit in toc -->

Manto provides a CLI to help with the configuration process.

## Table of Contents <!-- omit in toc -->

- [Commands](#commands)
  - [Init](#init)
  - [Description](#description)
  - [Usage](#usage)
  - [Options](#options)

## Commands

- `manto init` - Initialize a new Manto project
- `manto push` - Push the configuration to the Discord server
- `manto pull` - Pull the configuration from the Discord server
- `manto lint` - Lint the configuration
- `manto invite` - Generate an invite link for the Manto bot
- `manto invite --push|-p` - Generate an invite link for the Manto bot and push the configuration to the Discord server after the bot is added to the server
- `manto help` - Show help for a command
- `manto version` - Show the version of the Manto CLI
- `manto generate|g` - Generate a new configuration
  - `manto g category|ca` - Generate a new category folder and its `.config.yml` file

### Init

```bash
manto init
```

### Description

- If `rootDir` is not specified, prompt the user to choose the root folder for the server configuration.
- If `noGit` is not set, ask the user if they want to initialize a Git repository.  
  - If confirmed, run `git init` in the selected directory.
- If `noDiscord` is not set, ask if the user is adding Manto to an existing Discord server.
  - If not, provide guidance on creating a new Discord server ([Official Guide](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)).
- If `noInvite` is not set, generate and display an invite link for the Manto bot, and instruct the user to invite it to their server.
- Extract the server name and prompt the user to confirm or edit it.
- If `noScaffold` is not set, prompt the user to select which files and scaffolding to generate (e.g., Manto files, `.vscode` settings, `.gitignore`, `README.md`, etc.).
- If `cicd` is not set, ask if the user wants to add GitHub Actions for CI/CD.
- After setup, inform the user of the next steps:
  - Update your server name in `server.yml` if needed, then push your configuration with: `$ manto push`

### Usage

`manto init [rootDir]`

### Options

| Option | Signature | Description |
|--------|--------|-------------|
| rootDir | `string?` | Root directory for the server config |
| noGit | `boolean?` | Don't use Git |
| noDiscord | `boolean?` | Don't add to an existing Discord server |
| noInvite | `boolean?` | Don't generate an invite link for the Manto bot |
| readme | `boolean?` | Create a README.md file |
| vscode | `boolean?` | Create a .vscode directory |
| gitignore | `boolean?` | Create a .gitignore file |
| mantoFiles | `boolean?` | Create Manto files |
| cicd | `boolean?` | Add GitHub Actions for CI/CD |
| yes | `boolean?` | Yes to all options, just run the script without any prompts |
