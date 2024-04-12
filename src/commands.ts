import { Client } from "discord.js";
import { parseFS } from "./engine/FSParser";
function engineHandler(client: Client) {

    client.on("messageCreate", async (message) => {
        if (!message.guild) return

        const args = message.content.split(/ +/)

        switch (args[0]) {
            case "!clone":
                if (!args[1] || args[1].trim() == "") {
                    message.reply("Use !clone `name of your template`")
                    break;
                }
                await parseFS(message.guild, "./templates/" + args[1])
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

export default { engineHandler }
export { engineHandler }


