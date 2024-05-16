import fs from "node:fs"
import path from "node:path"

export function replaceExtname(filePath: string, newExtension: string) {
  const oldExtension = path.extname(filePath)
  const baseName = path.basename(filePath, oldExtension)
  const newFilePath = path.join(path.dirname(filePath), `${baseName}.${newExtension}`)
  return newFilePath
}

export function saveMantoFile<T extends object>(
  rootDir: string,
  name: string,
  data: T,
) {
  const mantoPath = path.join(rootDir, ".manto", name)

  if (!fs.existsSync(path.dirname(mantoPath)))
    fs.mkdirSync(path.dirname(mantoPath), { recursive: true })

  fs.writeFileSync(replaceExtname(mantoPath, "json"), JSON.stringify(data))
}

export function readMantoFile<T extends object>(rootDir: string, name: string) {
  let data = {} as T

  const roleFilePath = replaceExtname(path.join(rootDir, ".manto", name), "json")

  if (fs.existsSync(roleFilePath)) {
    const content = fs.readFileSync(roleFilePath, { encoding: "utf-8" })
    data = JSON.parse(content)
  }

  return data
}
