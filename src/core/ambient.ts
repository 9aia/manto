import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const DEFAULT_TEMPLATE_PATH = path.join(process.env.TEMPLATE_PATH ?? './')

function configureAmbient() {
  if (!fs.existsSync(DEFAULT_TEMPLATE_PATH))
    fs.mkdirSync(DEFAULT_TEMPLATE_PATH, { recursive: true })
}

export { configureAmbient, DEFAULT_TEMPLATE_PATH }
