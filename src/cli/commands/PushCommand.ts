import { Option } from 'clipanion'
import { DjsCommand } from '../lib/DjsCommand'

export class PushCommand extends DjsCommand {
  dryRun = Option.Boolean('--dry-run,-n', {
    description: 'Dry run the command, don\'t apply the changes to the server.',
  })

  async execute() {
    await super.execute()

    const client = this.getDiscordClient()

    this.context.stdout.write(`Hello!${this.dryRun ? ' (dry run)' : ''}\n`)
    this.context.stdout.write(`Discord client ready: ${client.isReady()}\n`)
    this.context.stdout.write(`Bot username: ${client.user?.username || 'Not logged in'}\n`)

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
    this.context.stdout.write(`Guilds: ${JSON.stringify(guilds, null, 2)}\n`)
  }
}
