import { BaseContext } from 'clipanion'
import type { Client } from 'discord.js'
import { DiscordClientManager } from '../../bot/client'
import { BaseCommand } from './BaseCommand'

let discordClientManager: DiscordClientManager | null = null

export abstract class DjsCommand<C extends BaseContext = BaseContext> extends BaseCommand<C> {

  getDiscordClient() {
    if (!discordClientManager) {
      throw new Error('Discord client manager not initialized. Call `await initializeDiscordClientManager()` at the start of your execute method.')
    }

    return discordClientManager.getClient()
  }

  private setupEventHandlers(client: Client) {
    client.on('ready', () => {
      this.logger.debug(`Logged in with ${client.user?.username}`)
    })

    client.on('error', (err) => {
      this.logger.error(`Discord client error: ${err}`)
    })
  }

  async initializeDiscordClientManager() {
    if (discordClientManager) {
      return
    }

    discordClientManager = new DiscordClientManager({
      onClientCreated: (client) => {
        this.setupEventHandlers(client)
      },
    })
    await discordClientManager.initialize()
  }

  async terminateDiscordClientManager() {
    if (!discordClientManager) {
      return
    }

    await discordClientManager.terminate()
    discordClientManager = null

    this.logger.debug('Discord client manager terminated')
  }
}
