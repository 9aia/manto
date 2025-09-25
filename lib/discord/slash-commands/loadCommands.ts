import type { Client } from 'discord.js'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

async function loadCommands(client: Client, folderPath: string) {
  const commandsFolder = readdirSync(folderPath).filter(file => file.endsWith('.ts'))

  for (const file of commandsFolder) {
    const filePath = join(folderPath, file)
    const command = await import(filePath)

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command)
      client.commands.set(command.data.name, command)

    else
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
  }
}

export default loadCommands
