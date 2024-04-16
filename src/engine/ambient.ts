import fs from 'fs'
import path from "path"
const templatesPath = path.resolve("./templates")

function configureAmbient() {
  if (!fs.existsSync("./templates"))
    fs.mkdirSync(templatesPath, { recursive: true })
}

export {configureAmbient,templatesPath}