import { confirm } from "@clack/prompts";
import { Cli, Command, Option } from "clipanion";
import * as fs from "fs";
import * as path from "path";

class CreateFolderCommand extends Command {
  static paths = [["init"]];

  rootDir = Option.String({ required: false });

  async execute() {
    const rootDir = this.rootDir ?? '.'
    const fullPath = path.resolve(process.cwd(), rootDir);

    try {
      const stats = fs.statSync(fullPath)
      if (stats) {

        let message;
        if (process.cwd() == fullPath) {
          message = 'Current folder is not empty. Do you want to continue? Files may be deleted. '
        } else {
          message = `${this.rootDir} exists. Do you want to continue? Files may be deleted.`;
        }
        const shouldContinue = await confirm({
          message,
        });
        if (!shouldContinue) {
          return 0
        }
      }
      fs.mkdirSync(fullPath, { recursive: true });
      this.context.stdout.write(`Pasta criada: ${fullPath}\n`);

    } catch (err: any) {
      this.context.stderr.write(`Erro: ${err.message}\n`);
      return 1;
    }
  }
}

const cli = new Cli({
  binaryLabel: `Manto CLI`,
  binaryName: `manto`,
  binaryVersion: `1.0.0`,
});

cli.register(CreateFolderCommand);

cli.runExit(process.argv.slice(2));
