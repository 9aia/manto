import process from 'node:process'
import { Builtins, Cli } from 'clipanion'
import packageJson from '../../package.json'
import { PushCommand } from './commands/PushCommand'

process.on('SIGINT', () => {
  process.stdout.write('\n\n')
  process.exit()
})

const cli = new Cli({
  binaryLabel: `Manto CLI`,
  binaryName: `manto`,
  binaryVersion: packageJson.version,
})

cli.register(PushCommand)
cli.register(Builtins.HelpCommand)
cli.register(Builtins.VersionCommand)

cli.runExit(process.argv.slice(2))
