# 🚀 Desktop Interop Platform

A full-featured desktop interoperability platform inspired by OpenFin, enabling seamless communication between web applications through FDC3 standards.

## ✨ Features

### Core Platform
- 🎯 **Visual Container** - Beautiful launcher UI for app management
- 📱 **App Directory** - Browse and launch applications with one click
- 🔧 **System Tray** - Background platform with quick access menu
- 📊 **Real-time Monitoring** - See running apps and channel activity
- 🎨 **Channel Visualization** - Monitor FDC3 channel connections

### FDC3 Messaging
- 📡 **Context Broadcasting** - Share data between applications
- 📻 **Context Listeners** - Receive updates from other apps
- 🎨 **User Channels** - Isolate communication by channel (Red, Blue, Green, Yellow)
- 🔒 **Channel Isolation** - Apps only communicate on same channel

### Application Management
- ▶️ **Launch Apps** - Start applications from the directory
- 🎯 **Focus Apps** - Bring apps to foreground
- ❌ **Close Apps** - Terminate running applications
- 📋 **Status Tracking** - See which apps are running

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Run the Platform

```bash
npm start
```

This launches:
- 📱 Platform launcher window
- 🎯 System tray icon
- 🔧 FDC3 message bus

### Launch Sample Apps

1. **In the launcher window**, click on any app:
   - 📡 **Broadcaster** - Send FDC3 contexts
   - 📻 **Listener** - Receive FDC3 contexts
   - 📊 **Chart Viewer** - Display instrument charts

2. **Join a channel** in each app (e.g., "Red Channel")

3. **Broadcast a context** from Broadcaster:
   - Enter ticker symbol (e.g., "AAPL")
   - Click "Broadcast Instrument"

4. **See the magic** - Listener and Chart Viewer receive the context!

## 📖 Documentation

- **[Platform Guide](PLATFORM-GUIDE.md)** - Complete platform features and usage
- **[What's New](WHATS-NEW.md)** - Comparison with basic test
- **[Architecture Explained](ARCHITECTURE-EXPLAINED.md)** - How it all works
- **[FDC3 Testing](TEST-FDC3.md)** - Testing guide for FDC3 features

## 🎯 Use Cases

### Financial Services
- **Trading Workflow**: Broadcast instrument from watchlist → Chart updates → News feed updates
- **Client Management**: Select client → All apps show client data
- **Risk Analysis**: Change portfolio → Risk dashboard updates

### Enterprise Applications
- **CRM Integration**: Select contact → Email, calendar, and notes sync
- **Data Analysis**: Filter dataset → All visualizations update
- **Workflow Automation**: Complete task → Next app in workflow activates

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│         DESKTOP INTEROP PLATFORM                │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Platform Launcher (Main UI)              │ │
│  │  - App Directory                          │ │
│  │  - Running Apps Management                │ │
│  │  - Channel Monitor                        │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  FDC3 Message Bus                       │   │
│  │  - Context Routing                      │   │
│  │  - Channel Management                   │   │
│  │  - App Registration                     │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  App 1   │  │  App 2   │  │  App 3   │     │
│  │ (Web App)│  │ (Web App)│  │ (Web App)│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  System Tray: 🚀 [Quick Access Menu]           │
└─────────────────────────────────────────────────┘
```

## 🎨 Screenshots

### Platform Launcher
The main hub for discovering and managing applications:
- App directory with icons and descriptions
- Real-time channel monitoring
- Running apps list with controls

### Sample Apps
Three demo applications showing FDC3 in action:
- **Broadcaster**: Send instrument contexts
- **Listener**: Receive and display contexts
- **Chart Viewer**: Visualize instrument data

## 🔧 Development

### Project Structure

```
desktop-interop-platform/
├── platform-launcher.js          # Main platform entry point
├── platform-ui/
│   └── launcher.html             # Platform launcher UI
├── apps/
│   ├── sample-app-1/             # Broadcaster app
│   ├── sample-app-2/             # Listener app
│   └── sample-app-3/             # Chart viewer app
├── packages/
│   ├── runtime/                  # Core runtime services
│   ├── sdk/                      # Platform SDK
│   ├── fdc3/                     # FDC3 implementation
│   ├── rvm/                      # Runtime version manager
│   └── provider/                 # Platform provider
└── docs/                         # Documentation
```

### Available Scripts

```bash
# Start the full platform
npm start

# Run basic FDC3 test (no UI)
npm run test:fdc3

# Build all packages
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

### Creating New Apps

1. **Create app directory**:
   ```
   apps/my-app/
   ├── index.html
   └── manifest.json
   ```

2. **Write your app** (HTML/CSS/JavaScript):
   ```html
   <!DOCTYPE html>
   <html>
   <body>
     <script>
       // Use FDC3 API
       window.fdc3.broadcast({ type: 'fdc3.instrument', ... });
     </script>
   </body>
   </html>
   ```

3. **Create manifest**:
   ```json
   {
     "startup_app": {
       "uuid": "my-app",
       "name": "My App",
       "url": "file:///apps/my-app/index.html"
     }
   }
   ```

4. **Add to launcher** (edit `platform-ui/launcher.html`):
   ```javascript
   const apps = [
     {
       id: 'my-app',
       name: 'My App',
       icon: '🎯',
       manifest: 'apps/my-app/manifest.json'
     }
   ];
   ```

## 🌟 Key Concepts

### FDC3 Context
A standardized data structure for sharing information:
```javascript
{
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL' },
  name: 'Apple Inc.'
}
```

### Channels
Virtual rooms for isolating communication:
- **Red Channel**: Trading workflow
- **Blue Channel**: Research workflow
- **Green Channel**: Risk analysis
- **Yellow Channel**: Client management

### Broadcasting
Send context to all apps on same channel:
```javascript
await window.fdc3.broadcast(context);
```

### Listening
Receive contexts from other apps:
```javascript
window.fdc3.addContextListener('fdc3.instrument', (context) => {
  console.log('Received:', context);
});
```

## 🎯 Comparison with OpenFin

| Feature | Our Platform | OpenFin |
|---------|-------------|---------|
| Visual Container | ✅ | ✅ |
| App Launcher | ✅ | ✅ |
| FDC3 Messaging | ✅ | ✅ |
| Channel Isolation | ✅ | ✅ |
| System Tray | ✅ | ✅ |
| App Management | ✅ | ✅ |
| Window Grouping | 🔜 | ✅ |
| Workspaces | 🔜 | ✅ |
| Intent Resolution | 🔜 | ✅ |
| Production Ready | 🔜 | ✅ |

## 📈 Roadmap

### Completed ✅
- [x] Project structure and TypeScript setup
- [x] Core data models and interfaces
- [x] Runtime Version Manager (RVM)
- [x] Runtime Core and Service Registry
- [x] Inter-Application Bus (IAB)
- [x] Application Lifecycle Manager
- [x] Window Manager
- [x] Platform Launcher UI
- [x] System Tray Integration
- [x] FDC3 Basic Implementation

### In Progress 🔄
- [ ] Full FDC3 Service with Intent Resolution
- [ ] Enhanced Security Manager
- [ ] Application Directory Service
- [ ] Platform Provider

### Planned 📋
- [ ] Window Grouping and Snapping
- [ ] Workspace Management
- [ ] Notifications Service
- [ ] Configuration Service
- [ ] Logging and Monitoring
- [ ] Sample Applications
- [ ] Documentation
- [ ] End-to-End Tests

## 🤝 Contributing

This is a learning/demonstration project showing how OpenFin-like platforms work. Feel free to:
- Add new sample applications
- Enhance the UI
- Implement additional FDC3 features
- Improve documentation

## 📄 License

MIT

## 🙏 Acknowledgments

- Inspired by [OpenFin](https://www.openfin.co/)
- Built with [Electron](https://www.electronjs.org/)
- Implements [FDC3](https://fdc3.finos.org/) standards

---

**Ready to experience desktop interoperability?**

```bash
npm start
```

🚀 **Launch the platform and see the magic!**
