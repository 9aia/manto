import process from 'node:process'
import { Cli } from 'clipanion'
import { InitCommand } from './commands/init'

const cli = new Cli({
  binaryLabel: `Manto CLI`,
  binaryName: `manto`,
  binaryVersion: `1.0.0`,
})

cli.register(InitCommand)

cli.runExit(process.argv.slice(2))
