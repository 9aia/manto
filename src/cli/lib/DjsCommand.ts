import type { Client } from 'discord.js'
import { Command } from 'clipanion'
import { DiscordClientManager } from '../../bot/client'

export abstract class DjsCommand extends Command {
  private discordClientManager: DiscordClientManager | null = null

  getDiscordClient() {
    if (!this.discordClientManager) {
      throw new Error('Discord client manager not initialized. Call `await super.execute()` first at the start of the command.')
    }

    return this.discordClientManager.getClient()
  }

  private setupEventHandlers(client: Client) {
    client.on('ready', () => {
      console.log('Logged in with', client.user?.username)
    })

    client.on('error', (err) => {
      console.error('Error\n', err)
    })
  }

  private async initializeDiscordClientManager() {
    if (this.discordClientManager) {
      return
    }

    this.discordClientManager = new DiscordClientManager({
      onClientCreated: (client) => {
        this.setupEventHandlers(client)
      },
    })
    await this.discordClientManager.initialize()
  }

  async execute() {
    await this.initializeDiscordClientManager()
  }
}
