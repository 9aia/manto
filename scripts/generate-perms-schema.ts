import fs from "node:fs"
import { PermissionFlagsBits } from "discord.js"

const tmpl = `type: object
properties:`

let content = tmpl

Object.keys(PermissionFlagsBits).forEach((key) => {
  const modes = ["Default", "Allow", "Deny"]

  modes.forEach((mode) => {
    content += `
  ${mode}${key}:
    type: array
    items:
      type: string
      description: A user mention or role name (e.g., "@everyone", "role_name").
  `
  })
})

fs.writeFileSync("./schemas/permissions.schema.yml", content)
