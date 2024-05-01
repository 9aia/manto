import fs from "node:fs"
import path from "node:path"

export function replaceExtname(filePath: string, newExtension: string) {
  const oldExtension = path.extname(filePath)
  const baseName = path.basename(filePath, oldExtension)
  const newFilePath = path.join(path.dirname(filePath), `${baseName}.${newExtension}`)
  return newFilePath
}

export interface MantoFileData {
  file_path?: string
  id?: string
}

export function saveMantoFile<T extends MantoFileData>(
  templateDir: string,
  data: T,
) {
  if (!data.file_path)
    return

  const mantoPath = path.join(templateDir, ".manto", data.file_path!)

  if (!fs.existsSync(path.dirname(mantoPath)))
    fs.mkdirSync(path.dirname(mantoPath), { recursive: true })

  fs.writeFileSync(replaceExtname(mantoPath, "json"), JSON.stringify(data))
}
