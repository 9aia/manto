import fs from "node:fs"
import path from "node:path"

const templatesPath = path.resolve("./templates")

function configureAmbient() {
  if (!fs.existsSync("./templates"))
    fs.mkdirSync(templatesPath, { recursive: true })
}

export { configureAmbient, templatesPath }
