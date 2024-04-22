import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const templatesPath = path.resolve(process.env.TEMPLATES_PATH ?? "./templates")

function configureAmbient() {
  if (!fs.existsSync(templatesPath))
    fs.mkdirSync(templatesPath, { recursive: true })
}

export { configureAmbient, templatesPath }
