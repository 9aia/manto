import fs from "node:fs"
import path from "node:path"
import type { HideThreadAfterString, SlowModeString } from "../channels/types"

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

export function getDiscordType(type: string) {
  let dType

  switch (type) {
    case "text":
      dType = 0
      break
    case "voice":
      dType = 2
      break
    default:
      dType = 0
      break
  }

  return dType
}

const slowModeDurations: { [key in SlowModeString]: number } = {
  "off": 0,
  "5s": 5,
  "10s": 10,
  "15s": 15,
  "30s": 30,
  "1m": 60,
  "2m": 2 * 60,
  "5m": 5 * 60,
  "10m": 10 * 60,
  "15m": 15 * 60,
  "30m": 30 * 60,
  "1h": 1 * 60 * 60,
  "2h": 2 * 60 * 60,
  "6h": 6 * 60 * 60,
}

export function parseSlowMode(slowMode: SlowModeString): number {
  return slowModeDurations[slowMode] ?? 0
}

const hideThreadsAfterDurations: { [key in HideThreadAfterString]: number } = {
  "1h": 1 * 60 * 60,
  "24h": 24 * 60 * 60,
  "3d": 3 * 24 * 60 * 60,
  "1w": 1 * 7 * 24 * 60 * 60,
}

export function parseHideThreadsAfterDurations(hideThreadsAfter: HideThreadAfterString): number {
  return hideThreadsAfterDurations[hideThreadsAfter] ?? 0
}
