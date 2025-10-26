import process from 'node:process'
import { Client, GatewayIntentBits, REST } from 'discord.js'

export class DiscordClientManager {
  private client: Client | null = null
  private rest: REST | null = null
  private isInitialized = false
  private initPromise: Promise<void> | null = null
  private onClientCreated: (client: Client) => void

  constructor(options: {
    onClientCreated?: (client: Client) => void
  } = {}) {
    this.onClientCreated = options.onClientCreated || (() => {})
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return
    }

    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('No DISCORD_BOT_TOKEN provided')
    }
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
      ],
    })
    this.rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!)

    this.onClientCreated(this.client as Client)
    
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = this.client.login(process.env.DISCORD_BOT_TOKEN!).then(() => {
      // Login returns a token string, but we just need to wait for it to complete
    })
    await this.initPromise
    this.isInitialized = true
  }

  async terminate() {
    if (!this.client) {
      return
    }
    await this.client.destroy()
    this.client = null
    this.isInitialized = false
    this.initPromise = null
  }

  getClient() {
    if (!this.isInitialized) {
      throw new Error('Discord client not initialized. Call initialize() first.')
    }
    return this.client as Client
  }

  getRest() {
    if (!this.rest) {
      throw new Error('REST not initialized. Call initialize() first.')
    }
    return this.rest
  }
}
