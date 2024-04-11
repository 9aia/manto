import { Client, GatewayIntentBits } from 'discord.js'
import { cloneHandler } from './src/commands'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
    ]
})

client.on("ready", () => {
    console.log("Logged in with", client.user?.username)
})

client.on("error", (err) => {
    console.error("Error\n",err)
})

cloneHandler(client)

client.login(process.env.TOKEN)