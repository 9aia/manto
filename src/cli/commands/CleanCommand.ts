import type { Channel, Guild, Role } from 'discord.js'
import { confirm } from '@clack/prompts'
import { Option } from 'clipanion'
import { DiscordAPIError } from 'discord.js'
import { DjsCommand } from '../lib/DjsCommand'

export class CleanCommand extends DjsCommand {
  static paths = [['clean']]

  guildId = Option.String('--guild-id,-g', {
    description: 'ID of the guild to clean. If not provided, all guilds the bot is in will be cleaned.',
  })

  dryRun = Option.Boolean('--dry-run,-n', {
    description: 'Dry run the command, don\'t apply the changes to the server.',
  })

  private async deleteChannel(channel: Channel): Promise<void> {
    try {
      await channel.delete()
    }
    catch (error) {
      const channelName = 'name' in channel ? channel.name : channel.id
      if (error instanceof DiscordAPIError) {
        switch (error.code) {
          case 50074:
            this.logger.warn(`Channel ${channelName} (${channel.id}) - Cannot delete channel required for community servers (SKIPPED)`)
            break
          case 50013:
            this.logger.error(`Channel ${channelName} (${channel.id}) - Missing permissions to delete`)
            break
          case 50028:
            this.logger.error(`Channel ${channelName} (${channel.id}) - Invalid channel`)
            break
          default:
            this.logger.error(`Error deleting channel ${channelName}: ${error.message}`)
        }
      }
      else {
        this.logger.error(`Error deleting channel ${channelName}: ${error}`)
      }
    }
  }

  private async deleteRole(role: Role): Promise<void> {
    try {
      await role.delete()
    }
    catch (error) {
      if (error instanceof DiscordAPIError) {
        switch (error.code) {
          case 50028:
            this.logger.error(`Role ${role.name} (${role.id}) - Invalid role`)
            break
          case 50013:
            this.logger.error(`Role ${role.name} (${role.id}) - Missing permissions to delete`)
            break
          default:
            this.logger.error(`Error deleting role ${role.name}: ${error.message}`)
        }
      }
      else {
        this.logger.error(`Error deleting role ${role.name}: ${error}`)
      }
    }
  }

  async deleteChannels(guild: Guild): Promise<void> {
    guild.channels.cache.forEach(async (channel) => {
      await this.deleteChannel(channel)
    })
  }

  async deleteRoles(guild: Guild): Promise<void> {
    guild.roles.cache.forEach(async (role) => {
      if (role.name === '@everyone')
        return
      if (role.managed)
        return
      await this.deleteRole(role)
    })
  }

  async cleanGuild(guild: Guild): Promise<void> {
    if (this.dryRun) {
      this.logger.info(`Would clean guild: ${guild.name}`)
      this.logger.info(`Would delete ${guild.channels.cache.size} channels:`)
      guild.channels.cache.forEach((channel) => {
        this.logger.info(`  - ${channel.type}: ${channel.name} (${channel.id})`)
      })
      this.logger.info(`Would delete ${guild.roles.cache.size} roles:`)
      guild.roles.cache.forEach((role) => {
        if (role.name === '@everyone')
          return
        if (role.managed)
          return
        this.logger.info(`  - ${role.name} (${role.id})`)
      })

      return
    }

    this.logger.info(`Cleaning guild: ${guild.name}`)

    await this.deleteChannels(guild)
    await this.deleteRoles(guild)
    this.logger.info(`Cleaned guild: ${guild.name}`)
  }

  async cleanAllGuilds(): Promise<void> {
    const client = this.getDiscordClient()

    if (this.dryRun) {
      for (const guild of client.guilds.cache.values()) {
        this.logger.info(`Would clean guild: ${guild.name}`)
        this.logger.info(`Would delete ${guild.channels.cache.size} channels:`)
        guild.channels.cache.forEach((channel) => {
          this.logger.info(`  - ${channel.type}: ${channel.name} (${channel.id})`)
        })
        this.logger.info(`Would delete ${guild.roles.cache.size} roles:`)
        guild.roles.cache.forEach((role) => {
          this.logger.info(`  - ${role.name} (${role.id})`)
        })
      }
    }
    else {
      for (const guild of client.guilds.cache.values()) {
        await this.deleteChannels(guild)
        await this.deleteRoles(guild)
      }
    }

    if (this.dryRun) {
      this.logger.info('DRY RUN COMPLETE - No actual changes were made')
    }
    else {
      this.logger.info(`Cleaned all guilds`)
    }
  }

  async execute() {
    await this.initializeDiscordClientManager()

    const client = this.getDiscordClient()

    let guild: Guild | undefined | null

    if (this.dryRun) {
      this.logger.info('DRY RUN MODE - No actual changes will be made')
    }

    if (!this.guildId) {
      const shouldContinue = await confirm({
        message: `${this.dryRun ? 'Simulate cleaning all guilds' : 'Clean *ALL* guilds'}? This will remove all channels and roles${this.dryRun ? ' (dry run, no changes will be made).' : '.'}`,
        initialValue: false,
      })
      if (!shouldContinue) {
        return 0
      }

      await this.cleanAllGuilds()
    }
    else {
      const shouldContinue = await confirm({
        message: `${this.dryRun ? `Simulate cleaning guild ${this.guildId}` : `Clean *guild ${this.guildId}*`}? This will remove all channels and roles${this.dryRun ? ' (dry run, no changes will be made).' : '.'}`,
        initialValue: false,
      })
      if (!shouldContinue) {
        return 0
      }

      guild = this.guildId ? client.guilds.cache.get(this.guildId) : null
      if (!guild) {
        this.logger.error(`Guild with ID ${this.guildId} not found`)
        return 1
      }

      if (guild) {
        await this.cleanGuild(guild)
        return
      }
    }

    await this.terminateDiscordClientManager()
  }
}
