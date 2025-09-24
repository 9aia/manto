# Overview

## Description

// TODO: add description

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

### Requirements

To use this project effectively, the user will need:

- A basic understanding of Discord server configuration, including channels, categories, roles, and permissions.
- Familiarity with file system management concepts like creating and editing folders and files.
- Knowledge of YAML format, used for defining roles and permissions configurations.
- A text editor or IDE might be helpful for editing the files.
- (Optional) A version control system like Git for tracking configuration changes.
