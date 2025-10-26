import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { confirm, text } from '@clack/prompts'
import { Option } from 'clipanion'
import { simpleGit } from 'simple-git'
import { DIR_PATH_REGEX } from '../constants/regex'
import { BaseCommand } from '../lib/BaseCommand'
import { scaffold } from '../utils/scaffold'

const git = simpleGit()

export class InitCommand extends BaseCommand {
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
      this.logger.info(`Manto project scaffolded at ${fullPath}`)
    }
    catch (err) {
      this.logger.error(`Failed to scaffold Manto project: ${(err as Error).message}`)
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
        this.logger.info('Git repository initialized.')
      }
      catch (error) {
        this.logger.error(`Failed to initialize git repository: ${(error as Error).message}`)
        return 1
      }
    }

    this.logger.info('Manto project initialized successfully.')
    return 0
  }
}
