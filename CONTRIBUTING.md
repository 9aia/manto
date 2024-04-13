# Contributing Guide

Thank you for considering contributing to Manto! We welcome contributions from the community to help improve the project and make it even better. This guide outlines the various ways you can contribute.

1. **Reporting Bugs:** If you encounter any bugs or issues with the project, please [open an issue](https://github.com/neogaialab/manto/issues) on GitHub. Include detailed information about the bug and steps to reproduce it.
2. **Feature Requests:** If you have ideas for new features or improvements, feel free to [open an issue](https://github.com/neogaialab/manto/issues) to discuss them. We value your feedback and ideas.
3. **Code Contributions:** If you're a developer and want to contribute code to the project, you can fork the repository, make your changes, and submit a pull request. Please follow our coding standards and guidelines.
4. **Documentation Improvements:** Help us improve the project's documentation by fixing typos, adding examples, or clarifying instructions. You can edit the documentation directly on GitHub.
5. **Sharing:** Share it with your network and help us reach more users who can benefit from it.

## Development

### Tools

We use the following tools for development:

- [Node.js](https://nodejs.org/en/download)
- [NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [Git](https://git-scm.com/downloads)
- [Vscode](https://code.visualstudio.com/download) (optional)
- [YAML for Vscode](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) (optional)

### Installation

```bash
git clone https://github.com/neogaialab/manto
cd manto
npm i
```

### Committing

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  - [Angular Commit Convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)

### Releasing

- [Semver](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

### Scripts

- `npm run start`: Start.
- `npm run dev`: Start in watch mode.
- `npm run build`: Build for production with minification and sourcemaps.
- `npm run lint`: Lint the codebase.
- `npm run lint --fix`: Automatically fix linting issues.
- `npm run release`: Release new version.
