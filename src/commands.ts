import type { Client } from "discord.js"

function engineHandler(client: Client) {
  client.on("messageCreate", async (message) => {
    if (!message.guild)
      return

    const args = message.content.split(/ +/)

    switch (args[0]) {
      /// THIS IS FOR TESTING
      case "!clean":
        message.guild.channels.cache.forEach(each => each.delete())
        message.guild.channels.create({ name: "CMD", type: 0 })
        break
      default:
        break
    }
  })
}

export default { engineHandler }
export { engineHandler }
