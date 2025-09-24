# Manto

> [!WARNING]
> Manto is currently a work in progress. Expect potential bugs, incomplete documentation, and ongoing development. Approach it with a growth mindset, enjoy experimenting, and refrain from using it for critical production purposes at this time.

Configure your Discord server with a file system approach.

```bash
github.com/9aia/discord
├── channels/                 # Channel configurations
│   ├── _/                    # Uncategorized channels
│   │   └── T 1 welcome.yml   # Text channel: welcome
│   ├── Community/            # Community category
│   │   ├── .config.yml       # Category configuration
│   │   ├── T 1 general.yml   # Text channel: general
│   │   ├── T 2 offtopic.yml  # Text channel: offtopic
│   │   ├── T 3 memes.yml     # Text channel: memes
│   │   ├── V Voice-1.yml     # Voice channel: Voice-1
│   │   └── V Voice-2.yml     # Voice channel: Voice-2
│   └── Server/               # Server category
│       ├── .config.yml       # Category configuration
│       ├── T 1 rules.yml     # Text channel: rules
│       ├── T 2 system.yml    # Text channel: system
│       ├── T 3 updates.yml   # Text channel: updates
│       └── V AFK.yml         # Voice channel: AFK
├── files/                    # File attachments and resources
├── roles.yml                 # Role definitions and permissions
└── server.yml                # Server settings and configuration
```

**File Naming Convention:**
- `T` prefix: Text channels
- `V` prefix: Voice channels
- Numbers indicate channel order within categories
- `.config.yml`: Category-specific configurations

**Note**: This project serves as a framework for server configuration. Additional scripting might be needed for automation or specific functionalities.

## Installing

// WIP

## Documentation

- [Getting Started](/docs/getting-started.md)
- [Examples](/docs/examples/index.md)
- [Documentation](/docs/index.md)

## Roadmap

You can find the roadmap [here](/project/ROADMAP.md).

---

[Contributing](/CONTRIBUTING.md) | [Security](/SECURITY.md) | [License](/LICENSE)
