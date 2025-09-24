# Common Patterns <!-- omit in toc -->

This guide will walk you through some common patterns for Manto configurations.

## Table of Contents <!-- omit in toc -->

- [Integration Patterns](#integration-patterns)
  - [Bot Integration](#bot-integration)
  - [Webhook Integration](#webhook-integration)

## Integration Patterns

### Bot Integration

Design channels with specific bot interactions in mind:

```yaml
# channels/bots/T 1 music-commands.yml
name: music-commands
topic: Music bot commands and requests
slow_mode: 10s
nsfw: false
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: Music Bot
    permissions:
      SendMessages: Allow
      ManageMessages: Allow
      EmbedLinks: Allow
      AttachFiles: Allow
```

### Webhook Integration

Configure channels for webhook notifications:

```yaml
# channels/integrations/T 1 github-notifications.yml
name: github-notifications
topic: GitHub webhook notifications and updates
slow_mode: off
nsfw: false
hide_threads_after: 3d
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
  - role: "@everyone"
    permissions:
      SendMessages: Deny # Only webhooks can send messages
  - role: GitHub Webhook
    permissions:
      SendMessages: Allow
      EmbedLinks: Allow
      AttachFiles: Allow
```
