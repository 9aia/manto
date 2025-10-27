import type { BaseContext } from 'clipanion'
import type { Client } from 'discord.js'
import { DiscordClientManager } from '../../bot/client'
import { BaseCommand } from './BaseCommand'

let discordClientManager: DiscordClientManager | null = null

export abstract class DjsCommand<C extends BaseContext = BaseContext> extends BaseCommand<C> {
  async getDiscordClient() {
    if (!discordClientManager) {
      await this.preloadDiscordClientManager()
    }

    return discordClientManager!.getClient()
  }

  private setupEventHandlers(client: Client) {
    client.on('ready', () => {
      this.logger.debug(`Logged in with ${client.user?.username}`)
    })

    client.on('error', (err) => {
      this.logger.error(`Discord client error: ${err}`)
    })
  }

  async preloadDiscordClientManager() {
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
