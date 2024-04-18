import "dotenv/config"
import process from "node:process"
import { join } from "node:path"
import { Client, Collection, GatewayIntentBits } from "discord.js"
import loadCommands from "../lib/discord/slash-commands/loadCommands"
import { engineHandler } from "./commands"

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
})
client.commands = new Collection()

loadCommands(client, join(__dirname, "commands"))

client.on("ready", () => {
  console.log("Logged in with", client.user?.username)
})

client.on("error", (err) => {
  console.error("Error\n", err)
})

engineHandler(client)

client.login(process.env.DISCORD_TOKEN)
