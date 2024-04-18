import "dotenv/config"
import process from "node:process"
import { join } from "node:path"
import { Client, Collection, GatewayIntentBits, REST } from "discord.js"
import loadCommands from "../lib/discord/slash-commands/loadCommands"
import deployCommands from "../lib/discord/slash-commands/deployCommands"
import handleCommands from "../lib/discord/slash-commands/handleCommands"
import { engineHandler } from "./commands"

export const rest = new REST().setToken(process.env.DISCORD_TOKEN!)
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

loadCommands(client, join(__dirname, "commands")).then(() => {
  deployCommands(client, rest)
})

client.on("interactionCreate", handleCommands)

client.on("ready", () => {
  console.log("Logged in with", client.user?.username)
})

client.on("error", (err) => {
  console.error("Error\n", err)
})

engineHandler(client)

client.login(process.env.DISCORD_TOKEN)
