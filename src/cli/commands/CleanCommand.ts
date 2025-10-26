import type { Guild } from 'discord.js'
import { confirm } from '@clack/prompts'
import { Option } from 'clipanion'
import { DjsCommand } from '../lib/DjsCommand'

export class CleanCommand extends DjsCommand {
  static paths = [['clean']]

  guildId = Option.String('--guild-id,-g', {
    description: 'ID of the guild to clean. If not provided, all guilds the bot is in will be cleaned.',
  })

  dryRun = Option.Boolean('--dry-run,-n', {
    description: 'Dry run the command, don\'t apply the changes to the server.',
  })

  async execute() {
    await this.initializeDiscordClientManager()

    const shouldContinue = await confirm({
      message: `Are you sure you want to ${this.dryRun ? 'SIMULATE CLEANING ALL GUILDS' : '*CLEAN ALL GUILDS*'} the bot is in? This is a dangerous operation and will remove all channels, categories and roles.`,
      initialValue: false,
    })
    if (!shouldContinue) {
      return 0
    }

    return 0

    const client = this.getDiscordClient()

    let guild: Guild | undefined | null

    if (this.dryRun) {
      this.logger.info('DRY RUN MODE - No actual changes will be made')
    }

    if (!this.guildId) {
      const shouldContinue = await confirm({
        message: `Are you sure you want to ${this.dryRun ? 'SIMULATE CLEANING ALL GUILDS' : '*CLEAN ALL GUILDS*'} the bot is in? This is a dangerous operation and will remove all channels, categories and roles.`,
        initialValue: false,
      })
      if (!shouldContinue) {
        return 0
      }
    }
    else {
      guild = this.guildId ? client.guilds.cache.get(this.guildId) : null
      if (!guild) {
        this.logger.error(`Guild with ID ${this.guildId} not found`)
        return 1
      }
    }

    if (guild) {
      if (this.dryRun) {
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
      else {
        guild.channels.cache.forEach(async (channel) => {
          await channel.delete()
        })
        guild.roles.cache.forEach(async (role) => {
          await role.delete()
        })
        this.logger.info(`Cleaned guild: ${guild.name}`)
      }

      return
    }

    for (const guild of client.guilds.cache.values()) {
      if (this.dryRun) {
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
      else {
        guild.channels.cache.forEach(async (channel) => {
          await channel.delete()
        })
        guild.roles.cache.forEach(async (role) => {
          await role.delete()
        })
      }
    }

    if (this.dryRun) {
      this.logger.info('DRY RUN COMPLETE - No actual changes were made')
    }
    else {
      this.logger.info(`Cleaned all guilds`)
    }

    this.terminateDiscordClientManager()
  }
}
