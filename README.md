# Desktop Interoperability Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![FDC3](https://img.shields.io/badge/FDC3-2.0-orange)](https://fdc3.finos.org/)

An open-source desktop interoperability platform that enables seamless communication and workflow orchestration between multiple applications running on the desktop. Built with Electron and TypeScript, providing FDC3-compliant inter-application messaging, sophisticated window management, and enterprise-grade security.

## 🚀 Features

- **🖥️ Runtime Environment** - Chromium-based container for hosting web applications with process isolation
- **📡 FDC3 Messaging** - Standards-based inter-application communication (FDC3 2.0 compliant)
- **🪟 Window Management** - Advanced window grouping, docking, snapping, and multi-monitor support
- **🔄 Application Lifecycle** - Centralized application management with crash detection and recovery
- **🔒 Security** - Granular permissions, sandboxing, CSP enforcement, and context isolation
- **📦 Platform Provider** - Extensible workspace and layout management
- **🎨 System Integration** - Native notifications, system tray, and global keyboard shortcuts
- **⚙️ Configuration** - Flexible JSON-based configuration with runtime updates

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Sample Applications](#sample-applications)
- [Development](#development)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## ⚡ Quick Start

### Prerequisites

- **Node.js** 20 LTS or higher
- **npm** or **yarn**
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/sanjeev23oct/open-openfin.git
cd open-openfin

# Install dependencies
npm install

# Build all packages
npm run build
```

### Run Sample Applications

```bash
# First time setup - create placeholder icons
node create-icons.js

# Launch the platform with sample workspace
npm run start

# Or launch individual sample apps
npm run start:sample-app-1
npm run start:sample-app-2
```

**Note:** The `create-icons.js` script creates minimal placeholder icons. For production, replace `assets/icon.png` and `assets/tray-icon.png` with proper icon files.

### Your First Application

Create a simple application manifest:

```json
{
  "startup_app": {
    "uuid": "my-first-app",
    "name": "My First App",
    "url": "https://example.com/app",
    "autoShow": true,
    "defaultWidth": 800,
    "defaultHeight": 600
  },
  "runtime": {
    "version": "0.1.0"
  },
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true
    }
  }
}
```

Launch your application:

```javascript
const app = await fin.Application.create({
  manifestUrl: 'path/to/manifest.json'
});
await app.run();
```

See the [Getting Started Guide](docs/GETTING-STARTED.md) for detailed instructions.

## 🏗️ Architecture

The platform follows a multi-process architecture similar to OpenFin:

```
┌─────────────────────────────────────────────────────────┐
│                Runtime Version Manager (RVM)             │
│         Manages runtime versions and launches            │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Runtime Process (Main)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Window Mgr   │  │ App Lifecycle│  │ Security Mgr │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ FDC3 Service │  │ IAB (Message │  │ Config Svc   │  │
│  │              │  │     Bus)     │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Application 1│    │ Application 2│    │ Application 3│
│  (Process)   │    │  (Process)   │    │  (Process)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### Key Components

- **RVM (Runtime Version Manager)** - Manages multiple runtime versions and launches appropriate version
- **Runtime Core** - Main process hosting core services
- **Inter-Application Bus (IAB)** - Foundation for all messaging
- **FDC3 Service** - FDC3-compliant messaging layer built on IAB
- **Window Manager** - Advanced window management capabilities
- **Application Lifecycle Manager** - Application launch, monitoring, and crash recovery
- **Security Manager** - Permission validation and security enforcement
- **Platform Provider** - Workspace and layout management

See [ARCHITECTURE-EXPLAINED.md](ARCHITECTURE-EXPLAINED.md) for detailed architecture documentation.

## 📚 Documentation

### Core Documentation

- **[Getting Started Guide](docs/GETTING-STARTED.md)** - Quick start tutorial and first application
- **[API Documentation](docs/API.md)** - Complete API reference for fin and FDC3 APIs
- **[Application Manifest Guide](docs/MANIFEST.md)** - Manifest configuration and examples
- **[Platform Configuration](docs/CONFIGURATION.md)** - Platform settings and deployment options

### Additional Resources

- **[Architecture Overview](ARCHITECTURE-EXPLAINED.md)** - Detailed architecture documentation
- **[Platform Guide](PLATFORM-GUIDE.md)** - Platform features and capabilities
- **[FDC3 Testing](TEST-FDC3.md)** - FDC3 implementation testing guide
- **[What's New](WHATS-NEW.md)** - Latest features and updates

## 🎯 Sample Applications

The project includes sample applications demonstrating FDC3 capabilities:

### Sample App 1 - Broadcaster
- Broadcasts FDC3 instrument context
- Handles ViewChart and ViewNews intents
- Joins user channels (red, blue, green)
- Location: `apps/sample-app-1/`

### Sample App 2 - Listener
- Listens for FDC3 instrument context
- Raises ViewChart and ViewNews intents
- Channel switching UI
- Location: `apps/sample-app-2/`

### Sample Workspace
- Pre-configured workspace with both sample apps
- Side-by-side layout
- Location: `workspaces/sample-workspace.json`

Launch the sample workspace:

```bash
npm run start:workspace
```

## 🛠️ Development

### Project Structure

```
open-openfin/
├── packages/
│   ├── rvm/                 # Runtime Version Manager
│   ├── runtime/             # Core Runtime
│   ├── sdk/                 # Platform SDK (fin API)
│   ├── fdc3/                # FDC3 Implementation
│   └── provider/            # Default Platform Provider
├── apps/
│   ├── sample-app-1/        # Sample broadcaster app
│   ├── sample-app-2/        # Sample listener app
│   └── sample-app-3/        # Advanced sample app
├── workspaces/              # Sample workspace configurations
├── docs/                    # Documentation
└── .kiro/                   # Kiro IDE specifications
```

### Development Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Development mode
npm run dev:rvm          # Run RVM in dev mode
npm run dev:runtime      # Run Runtime in dev mode
npm run dev:provider     # Run Provider in dev mode

# Clean build artifacts
npm run clean
```

### Testing

```bash
# Run all tests
npm test

# Run specific package tests
npm test -- packages/runtime

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Debugging

Use VS Code launch configurations:

```json
{
  "name": "Debug Main Process",
  "type": "node",
  "request": "launch",
  "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron",
  "args": ["packages/runtime/src/main.ts"]
}
```

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or creating sample applications, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
7. **Push to your branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### Contribution Guidelines

- Follow the [TypeScript style guide](https://google.github.io/styleguide/tsguide.html)
- Write tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure all tests pass before submitting PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Good First Issues

Looking for a place to start? Check out issues labeled [`good first issue`](https://github.com/sanjeev23oct/open-openfin/labels/good%20first%20issue) or [`help wanted`](https://github.com/sanjeev23oct/open-openfin/labels/help%20wanted).

## 👥 Community

### Get Help

- **GitHub Issues** - [Report bugs or request features](https://github.com/sanjeev23oct/open-openfin/issues)
- **GitHub Discussions** - [Ask questions and discuss ideas](https://github.com/sanjeev23oct/open-openfin/discussions)
- **Documentation** - [Read the docs](https://github.com/sanjeev23oct/open-openfin/tree/main/docs)

### Stay Updated

- **Watch** this repository for updates
- **Star** the project if you find it useful
- **Follow** [@sanjeev23oct](https://github.com/sanjeev23oct) for announcements

### Contributors

Thank you to all our contributors! 🎉

<!-- Contributors will be automatically added here -->

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [OpenFin](https://www.openfin.co/)
- Built with [Electron](https://www.electronjs.org/)
- Implements [FDC3](https://fdc3.finos.org/) standard by FINOS
- Developed with [TypeScript](https://www.typescriptlang.org/)

## 🗺️ Roadmap

- [ ] Complete RVM implementation
- [ ] Implement remaining IAB features
- [ ] Add window grouping and docking
- [ ] Implement security manager
- [ ] Create comprehensive test suite
- [ ] Add CI/CD pipeline
- [ ] Create installer packages
- [ ] Add more sample applications
- [ ] Implement plugin system
- [ ] Add telemetry and analytics

See [open issues](https://github.com/sanjeev23oct/open-openfin/issues) for a full list of proposed features and known issues.

---

**Made with ❤️ by the open-source community**

If you find this project useful, please consider giving it a ⭐️!
