import type { BaseContext } from 'clipanion'
import c from 'chalk-template'
import { Command } from 'clipanion'

export function createLogger<C extends BaseContext = BaseContext>(command: Command<C>) {
  return {
    info(message: string) {
      command.context.stdout.write(c`[{green INFO}] ${message}\n`)
    },

    warn(message: string) {
      command.context.stdout.write(c`[{yellow WARN}] ${message}\n`)
    },

    error(message: string) {
      command.context.stderr.write(c`[{red ERROR}] ${message}\n`)
    },

    debug(message: string) {
      if (Bun.env.NODE_ENV !== 'development') {
        return
      }

      command.context.stdout.write(c`[{gray DEBUG}] ${message}\n`)
    },
  }
}

export abstract class LogableCommand<C extends BaseContext = BaseContext> extends Command<C> {
  public logger = createLogger(this)
}
