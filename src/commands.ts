import { Client } from "discord.js";

import save from "./save";
import cloneGuild from "./clone";
function cloneHandler(client: Client) {

    client.on("messageCreate", async (message) => {
        if (!message.guild) return

        const args = message.content.split(/ +/)

        switch (args[0]) {
            case "!save":
                message.channel.send("Saving...")
                if (!args[1]) {
                    message.reply("Use `!save <template-name>`")
                    break
                }
                await save(message.guild, args[1])
                message.channel.send("Saved as " + args[1])
                break;

            case "!clone":
                await cloneGuild(message.guild, args[1])
                break;

            /// THIS IS FOR TESTING
            case "!clean":
                message.guild.channels.cache.forEach(each => each.delete())
                message.guild.channels.create({ name: "CMD", type: 0 })
                break;
            default:
                break;
        }
    })
}

export default { cloneHandler }
export { cloneHandler }


