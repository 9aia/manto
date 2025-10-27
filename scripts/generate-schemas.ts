import type { MantoSchema } from '../src/fs/types'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'fast-glob'
import { z } from 'zod'

function writeJsonSchemaToFile(schemaObj: unknown, targetPath: string) {
  const dir = path.dirname(targetPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(targetPath, JSON.stringify(schemaObj, null, 2))

  console.log(`[INFO] Schema written: ${targetPath}`)
}

async function registerMantoSchemas() {
  // Find all TypeScript files in the schemas directory (excluding components)
  const schemaFiles = await glob('src/fs/schemas/**/*.ts', {
    cwd: path.join(__dirname, '..'),
    absolute: true,
    ignore: ['**/components/**'],
  })

  console.log(`[INFO] Found ${schemaFiles.length} schema files:`)
  schemaFiles.forEach(file => console.log(`  - ${path.relative(path.join(__dirname, '..'), file)}`))

  // Process each schema file
  for (const filePath of schemaFiles) {
    try {
      // Dynamically import the schema file
      const module = await import(filePath)

      // Check if the module has a MANTO_SCHEMA export
      if (module.MANTO_SCHEMA && typeof module.MANTO_SCHEMA === 'object' && 'id' in module.MANTO_SCHEMA && 'zodSchema' in module.MANTO_SCHEMA) {
        const mantoSchema = module.MANTO_SCHEMA as MantoSchema

        // Register the schema with Zod
        z.globalRegistry.add(mantoSchema.zodSchema, { id: mantoSchema.id })
      }
      else {
        console.log(`[WARN] Skipping ${filePath}: No MANTO_SCHEMA export found`)
      }
    }
    catch (error) {
      console.error(`[ERROR] Error processing ${filePath}:`, error)
    }
  }
}

async function main() {
  registerMantoSchemas().catch(console.error).then(() => {
    console.log('[INFO] Generating JSON schemas...')

    const globalRegistrySchema = z.toJSONSchema(z.globalRegistry, {
      // TODO: Use a more permanent URI
      // uri: (id) => `https://manto.9aia.com/schemas/${id}`,
      uri: id => `manto-${id}.json`,
      target: 'draft-2020-12',
    })

    for (const [schemaName, jsonSchema] of Object.entries(globalRegistrySchema.schemas)) {
      const outputPath = path.join(__dirname, `../dist/schemas/manto-${schemaName}.json`)
      writeJsonSchemaToFile(jsonSchema, outputPath)
    }
  })
}

main()
