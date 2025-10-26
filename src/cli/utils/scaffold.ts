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

const channels = {
  _: {
    'T 1 welcome.yml': {
      topic: 'A channel for new members to learn about the server and get started.',
    },
  },
  Community: {
    'T 1 general.yml': {
      topic: 'General discussion and chat',
    },
    'V Voice-1.yml ': {
      topic: 'Main voice channel for general discussion',
    },
  },
  Server: {
    'T 1 rules.yml': {
      topic: 'Official server rules and guidelines.',
    },
    'V AFK.yml': {
      topic: 'You\'ve been moved here due to inactivity',
    },
  },
}

async function scaffoldChannels(rootDir: string) {
  Object.keys(channels).forEach((categoryName) => {
    fs.mkdirSync(path.resolve(rootDir, 'channels', categoryName), { recursive: true })
    fs.writeFileSync(path.resolve(rootDir, 'channels', categoryName, '.config.yml'), '')
    Object.keys((channels as any)[categoryName]).forEach((channelName) => {
      const content = (channels as any)[categoryName][channelName]
      fs.writeFileSync(path.resolve(rootDir, 'channels', categoryName, channelName), yaml.stringify(content))
    })
  })
}

export async function scaffold(rootDir: string) {
  fs.mkdirSync(path.resolve(rootDir), { recursive: true })
  fs.writeFileSync(path.resolve(rootDir, 'server.yml'), yaml.stringify(serverYmlContent))
  fs.writeFileSync(path.resolve(rootDir, 'roles.yml'), yaml.stringify(roles))
  scaffoldChannels(rootDir)
  fs.mkdirSync(path.resolve(rootDir, 'files'), { recursive: true })

  const logoBytes = await file(logoManto).arrayBuffer()

  await Bun.write(path.resolve(rootDir, 'files/icon.png'), logoBytes)
}
