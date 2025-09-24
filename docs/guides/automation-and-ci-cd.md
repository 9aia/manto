# Automation and CI/CD <!-- omit in toc -->

This guide will walk you through setting up common automation and CI/CD for your Manto project.

## Table of Contents <!-- omit in toc -->

- [Configuration Linting](#configuration-linting)
- [Automated Deployment (Pushing)](#automated-deployment-pushing)

## Configuration Linting

Set up automated linting in your CI/CD pipeline:

```yaml
# .github/workflows/validate-config.yml
name: Lint Manto Configuration
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Lint Manto Config
        run: |
          manto lint
```

## Automated Deployment (Pushing)

Deploy configurations automatically:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Discord
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Discord
        run: |
          manto push --token ${{ secrets.DISCORD_BOT_TOKEN }}
        env:
          DISCORD_BOT_TOKEN: ${{ secrets.DISCORD_BOT_TOKEN }}
```
