import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { confirm, text } from '@clack/prompts'
import { Command, Option } from 'clipanion'
import { simpleGit } from 'simple-git'
import { scaffold } from '../utils/scaffold'

const DIR_PATH_REGEX = /^(?:[a-z]:\\|\.{1,2}[\\/]|[\\/])?[^<>:"|?*\n]*$/i

const git = simpleGit()

export class InitCommand extends Command {
  static paths = [['init']]

  rootDir = Option.String({ required: false })

  async execute() {
    if (!this.rootDir) {
      const answer = await text({
        message: 'Where do you wanna create the Manto project?',
        placeholder: './',
        validate: value => !DIR_PATH_REGEX.test(value) ? 'This should be a valid directory path.' : undefined,
        initialValue: './',
      })
      this.rootDir = String(answer)
    }
    const rootDir = this.rootDir ?? '.'
    const fullPath = path.resolve(process.cwd(), rootDir)

    try {
      if (fs.existsSync(fullPath)) {
        const message = process.cwd() === fullPath
          ? 'Current folder is not empty. Do you want to continue? Files may be overwritten. '
          : `${this.rootDir} exists. Do you want to continue? Files may be overwritten.`
        const shouldContinue = await confirm({
          message,
          initialValue: false,
        })
        if (!shouldContinue) {
          return 0
        }
      }

      await scaffold(rootDir)
      this.context.stdout.write(`Manto project scaffolded at ${fullPath}\n`)
    }
    catch (err) {
      this.context.stderr.write(`Failed to scaffold Manto project: ${(err as Error).message}\n`)
      return 1
    }

    const shouldGitInit = await confirm({
      message: 'Do you want to initialize a git repository?',
      initialValue: false,
    })
    if (shouldGitInit) {
      try {
        await git.cwd(fullPath)
        await git.init()
        this.context.stdout.write('Git repository initialized.\n')
      }
      catch (error) {
        this.context.stderr.write(`Failed to initialize git repository: ${(error as Error).message}\n`)
      }
    }
  }
}
