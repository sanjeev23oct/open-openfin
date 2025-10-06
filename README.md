# Open OpenFin - Desktop & Web Interoperability Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![FDC3](https://img.shields.io/badge/FDC3-2.0-orange)](https://fdc3.finos.org/)

An open-source interoperability platform available in both **Desktop** (Electron) and **Web** (Browser) versions. Enables seamless communication and workflow orchestration between multiple applications with FDC3-compliant messaging, sophisticated window management, and enterprise-grade security.

## 🚀 Two Platform Options

### Desktop Platform (Electron)
- Native desktop application with full OS integration
- Advanced window management and system tray
- File system access and native notifications
- Multi-monitor support and keyboard shortcuts

### Web Platform (Browser) 🌐 **NEW!**
- Runs entirely in the browser - no installation required
- Cross-platform compatibility (Windows, Mac, Linux)
- Instant deployment and updates
- Perfect for cloud environments and demos
- **[Try Live Demo →](https://open-openfin-web.railway.app)** *(Coming Soon)*

## 🚀 Features

- **🖥️ Runtime Environment** - Chromium-based container (Desktop) or browser-based (Web) for hosting applications
- **📡 FDC3 Messaging** - Standards-based inter-application communication (FDC3 2.0 compliant)
- **🪟 Window Management** - Advanced window grouping, docking, snapping, and multi-monitor support
- **🔄 Application Lifecycle** - Centralized application management with crash detection and recovery
- **🔒 Security** - Granular permissions, sandboxing, CSP enforcement, and context isolation
- **📦 Platform Provider** - Extensible workspace and layout management
- **🎨 System Integration** - Native notifications, system tray (Desktop), and keyboard shortcuts
- **⚙️ Configuration** - Flexible JSON-based configuration with runtime updates
- **🔍 FDC3 Monitor** - Real-time diagnostic tool for debugging interop (Web Platform)

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Sample Applications](#sample-applications)
- [Development](#development)
- [Contributing](#contributing)
- [Community](#community)
- [License](#license)

## 📥 Download

### For End Users (No Installation Required)

**Download pre-built executables:**

#### Windows
- [Download Installer (.exe)](https://github.com/sanjeev23oct/open-openfin/releases/latest) - Recommended
- [Download Portable (.exe)](https://github.com/sanjeev23oct/open-openfin/releases/latest) - No installation needed

#### macOS
- [Download DMG](https://github.com/sanjeev23oct/open-openfin/releases/latest)

#### Linux
- [Download AppImage](https://github.com/sanjeev23oct/open-openfin/releases/latest)
- [Download .deb](https://github.com/sanjeev23oct/open-openfin/releases/latest) - For Debian/Ubuntu

**Quick Start:**
1. Download for your platform
2. Install/Run the application
3. Click "Add App" to add Gmail, Slack, etc.
4. Create workspaces to organize apps
5. Done! 🎉

## ⚡ Quick Start (For Developers)

### Prerequisites

- **Node.js** 20 LTS or higher
- **npm** or **yarn**
- **Git**

### Desktop Platform - Installation from Source

```bash
# Clone the repository
git clone https://github.com/sanjeev23oct/open-openfin.git
cd open-openfin

# Install dependencies
npm install

# Create placeholder icons
node create-icons.js

# Build all packages
npm run build

# Launch the desktop platform
npm start

# Or launch with sample workspace
npm run start:sample-app-1
npm run start:sample-app-2
```

### Web Platform 🌐 - Quick Start

```bash
# Navigate to web platform
cd packages/web-platform

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

**Or try the live demo:** [https://open-openfin-web.railway.app](https://open-openfin-web.railway.app) *(Coming Soon)*

### Build Executables

```bash
# Build for Windows
npm run build:exe

# Build for macOS
npm run build:mac

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

Executables will be in the `dist/` folder.

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

#### Shared Packages
- **FDC3 Core** - Platform-agnostic FDC3 logic
- **FDC3 Service** - FDC3-compliant messaging layer
- **SDK** - Developer SDK for building applications

#### Desktop Platform
- **RVM (Runtime Version Manager)** - Manages multiple runtime versions
- **Runtime Core** - Main Electron process hosting core services
- **Inter-Application Bus (IAB)** - Foundation for all messaging
- **Window Manager** - Advanced window management capabilities
- **Application Lifecycle Manager** - Application launch, monitoring, and crash recovery
- **Security Manager** - Permission validation and security enforcement
- **Platform Provider** - Workspace and layout management

#### Web Platform 🌐
- **Web Platform Core** - Browser-based platform orchestrator
- **FDC3 Bridge** - PostMessage-based FDC3 communication
- **Browser Window Manager** - Simulated window management with iframes
- **Storage Manager** - IndexedDB + localStorage persistence
- **FDC3 Monitor** - Real-time diagnostic tool for debugging

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
│   ├── fdc3-core/           # Platform-agnostic FDC3 logic
│   ├── fdc3/                # FDC3 Implementation
│   ├── sdk/                 # Platform SDK (fin API)
│   ├── rvm/                 # Runtime Version Manager (Desktop)
│   ├── runtime/             # Core Runtime (Desktop)
│   ├── provider/            # Default Platform Provider (Desktop)
│   └── web-platform/        # Web Platform 🌐 (Browser)
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
