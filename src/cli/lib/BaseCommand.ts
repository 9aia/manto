import type { BaseContext } from 'clipanion'
import { LogableCommand } from './LogableCommand'

export abstract class BaseCommand<C extends BaseContext = BaseContext> extends LogableCommand<C> {
  async catch(error: unknown) {
    this.logger.error(`Internal error: ${error instanceof Error ? error.message : String(error)}`)
  }
}
