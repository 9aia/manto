import fs from 'node:fs'
import path from 'node:path'
import { file } from 'bun'
import * as yaml from 'yaml'
import logoManto from '../../assets/manto-logo.png' with { type: 'file' }

const serverYmlContent = {
  manto_version: '0.1.0',
  name: 'Awesome Server',
  icon_url: 'icon.png',
}

const roles = [
  {
    name: 'Admin',
    color: '#ff0000',
    hoist: true,
    mentionable: true,
    permissions: ['Administrator'],
  },
  {
    name: 'Moderator',
    color: '#ffff00',
    hoist: true,
    mentionable: true,
    permissions: [
      'ManageMessages',
      'BanMembers',
      'KickMembers',
      'ManageChannels',
    ],
  },
  {
    name: 'Member',
    color: '#00ff00',
    permissions: [
      'SendMessages',
      'ReadMessageHistory',
      'AddReactions',
      'Connect',
      'Speak',
    ],
  },
]

export async function scaffold(rootDir: string) {
  fs.mkdirSync(path.resolve(rootDir), { recursive: true })
  fs.writeFileSync(path.resolve(rootDir, 'server.yml'), yaml.stringify(serverYmlContent))
  fs.writeFileSync(path.resolve(rootDir, 'roles.yml'), yaml.stringify(roles))
  fs.mkdirSync(path.resolve(rootDir, 'channels/_'), { recursive: true })
  fs.mkdirSync(path.resolve(rootDir, 'files'), { recursive: true })

  const logoBytes = await file(logoManto).arrayBuffer()

  await Bun.write(path.resolve(rootDir, 'files/icon.png'), logoBytes)
}
