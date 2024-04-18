import process from "node:process"
import type { Client, REST, SlashCommandBuilder } from "discord.js"
import { Routes } from "discord.js"

async function deployCommands(client: Client, rest: REST) {
  try {
    console.log(`Started refreshing ${client.commands.size} application (/) commands.`)

    const commands: SlashCommandBuilder[] = client.commands.map(c => c.data)

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_BOT_CLIENT_ID!),
      { body: commands },
    ) as any

    console.log(`Successfully reloaded ${data.length} application (/) commands.`)
  }
  catch (error) {
    console.error(error)
  }
}

export default deployCommands
