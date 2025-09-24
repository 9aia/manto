# Intellisense <!-- omit in toc -->

Manto provides intellisense for your configuration files.

## Table of Contents <!-- omit in toc -->

- [Intellisense](#intellisense)

## VS Code or VS Code-based editors

1. Install the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml).

2. Run the following command to install the Manto schemas:

   ```bash
   manto install-schemas vscode
   ```

   This will add the following to your `settings.json`:

   ```jsonc
   {
     // ...
     "yaml.schemas": {
       "./src/schemas/manto-server.json": [
         "**/server.{yml,yaml}"
       ],
       "./src/schemas/manto-roles.json": [
         "**/roles.{yml,yaml}"
       ],
       "./src/schemas/manto-category.json": [
         "**/channels/*/.config.{yml,yaml}"
       ],
       "./src/schemas/manto-text-channel.json": [
         "**/channels/*/T*.{yml,yaml}"
       ],
       "./src/schemas/manto-voice-channel.json": [
         "**/channels/*/V*.{yml,yaml}"
       ]
     }
     // ...
   }
   ```

3. Restart your editor or reload the extension to apply the changes.
