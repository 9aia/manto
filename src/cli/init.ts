/*
Options:
- rootDir: string
- noGit: boolean
- noDiscord: boolean
- noInvite: boolean
- readme: boolean
- vscode: boolean
- gitignore: boolean
- mantoFiles: boolean
- cicd: boolean
- yes: boolean // yes to all options, just run the script without any prompts

Script:
- Prompt if rootDir option is undefined: root folder for the server config
- Prompt if noGit option is false: Want to use Git?
  - If yes, run `git init`
- Prompt if noDiscord option is false: Adding to an existing Discord server?
  - If no, guide user how to create a new Discord server manually (required by Discord): Create a Discord server if you don't have one ([Official Guide](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server))
- If noInvite option is false: Generate an invite link for the Manto bot, display it and inform user to invite it to their server
- Extract server name and prompt for user to confirm
- Prompt if noScaffold option is false: select what to scaffold (create Manto files, .vscode settings, .gitignore, README.md, etc.)
- Prompt if cicd option is false: Add GitHub Actions for CI/CD?
- Inform next steps:
  - Change your server name in `server.yml` and push your configuration again: `$ manto push`
*/
