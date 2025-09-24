# File System <!-- omit in toc -->

This document explains the why Manto uses the file system it does.

## Table of Contents <!-- omit in toc -->

- [Language (YAML)](#language-yaml)
- [Naming Convention](#naming-convention)

## Language (YAML)

We use YAML to define the file system, because it is a human-readable format and is easy to write and read.

## Naming Convention

- **Channel Type**: Letters such as `T` and `V` are easily matched by simple glob-based matching. For example, `T*.yml` will match all text channel files and `V*.yml` will match all voice channel files.
- **Channel Order**: Numbers are used to indicate the order of the channels within a category, because we cannot re-order files in a directory without renaming them. Numbers are intuitive to understand.
- **Category as Directory**: The category name is used as the directory name, because it mirrors the Discord UI (channels are in categories).
- **Roles as a single File**: Roles are defined in a single file, because they are related to the server and are not tied to any specific category, which by this system are stored in folders. It is also separate from the `server.yml` file, because it could clutter the file when there are many roles.
