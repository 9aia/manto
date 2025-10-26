import { Option } from 'clipanion'
import { DIR_PATH_REGEX } from '../constants/regex'
import { DjsCommand } from '../lib/DjsCommand'

export class PushCommand extends DjsCommand {
  static paths = [['push']]

  rootDir = Option.String('--root-dir,-r', './', { description: 'Root directory of the Manto project.' })
  dryRun = Option.Boolean('--dry-run,-n', {
    description: 'Dry run the command, don\'t apply the changes to the server.',
  })

  async execute() {
    if (!DIR_PATH_REGEX.test(this.rootDir)) {
      this.logger.error(`Invalid root directory: ${this.rootDir}`)
      return
    }

    await super.execute()

    const client = this.getDiscordClient()

    this.logger.info(`Root directory: ${this.rootDir}`)

    this.logger.info(`Hello!${this.dryRun ? ' (dry run)' : ''}`)
    // TODO: client should be always ready
    this.logger.info(`Discord client ready: ${client.isReady()}`)
    this.logger.info(`Bot username: ${client.user?.username || 'Not logged in'}`)

    // list all guilds the bot is in
    const guilds = await Promise.all(
      client.guilds.cache.map(async (guild) => {
        // Fetch the guild to ensure we have all the data
        const fullGuild = await guild.fetch().catch(() => guild)
        return {
          id: guild.id,
          name: fullGuild.name || 'Unknown Guild',
        }
      }),
    )
    this.logger.info(`Guilds: ${JSON.stringify(guilds, null, 2)}`)

    this.terminateDiscordClientManager()
  }
}
