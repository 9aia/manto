# Advanced Configuration <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [Complex Permission Systems](#complex-permission-systems)
  - [Advanced Permission Overrides](#advanced-permission-overrides)
- [Advanced Channel Configurations](#advanced-channel-configurations)
  - [Slow Mode Strategies](#slow-mode-strategies)
  - [NSFW Channel Management](#nsfw-channel-management)
  - [Thread Management](#thread-management)

## Complex Permission Systems

### Advanced Permission Overrides

Create sophisticated permission systems using channel-specific overrides:

```yaml
# channels/private-staff/T 1 sensitive-discussions.yml
name: sensitive-discussions
topic: Confidential staff discussions - highest clearance only
slow_mode: off
nsfw: false
hide_threads_after: 1w
overwrites:
  # Deny everyone by default
  - role: "@everyone"
    permissions:
      ViewChannel: Deny

  # Allow viewing but not participating for lower staff
  - role: Helper
    permissions:
      ViewChannel: Allow
      ReadMessageHistory: Allow

  # Allow participation for moderators
  - role: Moderator
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow

  # Full access for senior staff
  - role: Senior Moderator
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      ManageMessages: Allow

  # Complete control for admins
  - role: Admin
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      ManageMessages: Allow
      ManageChannel: Allow
```

## Advanced Channel Configurations

### Slow Mode Strategies

Use slow mode strategically to control channel activity:

```yaml
# High-activity channel with moderate slow mode
name: "general"
slow_mode: "5s"
topic: "General discussion - please keep conversations flowing"

# Announcement channel with strict slow mode
name: "announcements"
slow_mode: "30s"
topic: "Important announcements only - think before posting"

# Spam channel with no slow mode
name: "spam"
slow_mode: "off"
topic: "Feel free to spam here - no restrictions!"
```

### NSFW Channel Management

Properly configure age-restricted content:

```yaml
# channels/nsfw/T 1 adult-discussion.yml
name: adult-discussion
topic: "18+ discussions only - you must be 18+ to participate"
slow_mode: off
nsfw: true
hide_threads_after: 24h
overwrites:
  - role: "@everyone"
    permissions:
      ViewChannel: Deny
  - role: "18+ Verified"
    permissions:
      ViewChannel: Allow
      SendMessages: Allow
      ReadMessageHistory: Allow
      AddReactions: Allow
      AttachFiles: Allow
```

### Thread Management

Configure thread archiving for different channel types:

```yaml
# Quick discussion channels
hide_threads_after: "1h"

# General discussion channels
hide_threads_after: "24h"

# Long-term project channels
hide_threads_after: "3d"

# Archive channels
hide_threads_after: "1w"
```
