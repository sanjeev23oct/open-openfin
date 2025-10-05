# Getting Started Guide

## Overview

This guide will help you get started with the Desktop Interoperability Platform, from installation to building your first FDC3-enabled application.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Your First Application](#your-first-application)
- [FDC3 Integration](#fdc3-integration)
- [Multi-Application Workflows](#multi-application-workflows)
- [Workspaces](#workspaces)
- [Next Steps](#next-steps)

---

## Installation

### Prerequisites

- **Operating System:** Windows 10+, macOS 10.14+, or Linux
- **Node.js:** 20 LTS or higher (for development)
- **npm or yarn:** Latest version

### Install the Platform

#### Option 1: Installer (Recommended)

**Windows:**
```bash
# Download and run the installer
DesktopInterop-Setup.exe
```

**macOS:**
```bash
# Download and open the DMG
open DesktopInterop.dmg
```

**Linux:**
```bash
# Debian/Ubuntu
sudo dpkg -i desktop-interop.deb

# Red Hat/Fedora
sudo rpm -i desktop-interop.rpm
```

#### Option 2: Build from Source

```bash
# Clone the repository
git clone https://github.com/sanjeev23oct/open-openfin.git
cd open-openfin

# Install dependencies
npm install

# Build all packages
npm run build

# Run the platform
npm run start
```

### Verify Installation

```bash
# Check platform version
DesktopInterop --version

# Check RVM (Runtime Version Manager)
DesktopInterop-RVM --version
```

---

## Quick Start

### Launch the Platform

```bash
# Start the platform
DesktopInterop
```

The platform will start with the system tray icon visible.

### Launch a Sample Application

```bash
# Launch sample app 1
DesktopInterop --manifest=file:///apps/sample-app-1/manifest.json

# Or use the RVM
DesktopInterop-RVM launch --manifest=file:///apps/sample-app-1/manifest.json
```

---

## Your First Application

Let's create a simple "Hello World" application.

### Step 1: Create Application Files

Create a directory for your application:

```bash
mkdir my-first-app
cd my-first-app
```

### Step 2: Create index.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>My First App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      padding: 30px;
      border-radius: 10px;
    }
    button {
      padding: 10px 20px;
      margin: 10px 0;
      border: none;
      border-radius: 5px;
      background: #4CAF50;
      color: white;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background: #45a049;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 My First App</h1>
    <p>Welcome to the Desktop Interoperability Platform!</p>
    
    <button onclick="showInfo()">Show Platform Info</button>
    <button onclick="createWindow()">Create New Window</button>
    
    <div id="output"></div>
  </div>

  <script>
    async function showInfo() {
      const version = await fin.System.getVersion();
      const app = fin.Application.getCurrent();
      
      document.getElementById('output').innerHTML = `
        <h3>Platform Info:</h3>
        <p>Version: ${version}</p>
        <p>App UUID: ${app.identity.uuid}</p>
        <p>App Name: ${app.identity.name}</p>
      `;
    }
    
    async function createWindow() {
      const window = await fin.Window.create({
        url: 'https://example.com',
        width: 800,
        height: 600,
        frame: true
      });
      
      await window.show();
    }
  </script>
</body>
</html>
```

### Step 3: Create manifest.json

```json
{
  "startup_app": {
    "uuid": "my-first-app",
    "name": "My First App",
    "url": "file:///path/to/my-first-app/index.html",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 700,
    "defaultHeight": 500
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

### Step 4: Launch Your Application

```bash
DesktopInterop --manifest=file:///path/to/my-first-app/manifest.json
```

Or programmatically:

```javascript
const app = await fin.Application.create({
  manifestUrl: 'file:///path/to/my-first-app/manifest.json'
});

await app.run();
```

---

## FDC3 Integration

Let's add FDC3 capabilities to your application.

### Step 1: Add FDC3 to Your HTML

```html
<div class="container">
  <h1>📡 FDC3 App</h1>
  
  <div>
    <label>Ticker Symbol:</label>
    <input type="text" id="ticker" value="AAPL">
  </div>
  
  <button onclick="broadcastInstrument()">Broadcast Instrument</button>
  <button onclick="joinChannel('red')">Join Red Channel</button>
  
  <div id="status"></div>
</div>

<script>
  let currentChannel = null;
  
  async function broadcastInstrument() {
    const ticker = document.getElementById('ticker').value;
    
    if (!currentChannel) {
      alert('Please join a channel first!');
      return;
    }
    
    await window.fdc3.broadcast({
      type: 'fdc3.instrument',
      id: { ticker: ticker },
      name: ticker
    });
    
    document.getElementById('status').innerHTML = 
      `✅ Broadcasted ${ticker} on ${currentChannel} channel`;
  }
  
  async function joinChannel(channelId) {
    await window.fdc3.joinUserChannel(channelId);
    currentChannel = channelId;
    
    document.getElementById('status').innerHTML = 
      `✅ Joined ${channelId} channel`;
  }
  
  // Listen for context
  window.fdc3.addContextListener('fdc3.instrument', (context) => {
    document.getElementById('ticker').value = context.id.ticker;
    document.getElementById('status').innerHTML = 
      `🎯 Received: ${context.id.ticker}`;
  });
</script>
```

### Step 2: Update manifest.json

Add FDC3 intent handlers:

```json
{
  "startup_app": {
    "uuid": "my-fdc3-app",
    "name": "My FDC3 App",
    "url": "file:///path/to/my-fdc3-app/index.html"
  },
  "runtime": {
    "version": "0.1.0"
  },
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "displayName": "View Chart",
        "contexts": ["fdc3.instrument"]
      }
    ]
  }
}
```

### Step 3: Handle Intents

```javascript
// Register intent handler
window.fdc3.addIntentListener('ViewChart', (context) => {
  console.log('ViewChart intent received:', context);
  
  // Display chart for instrument
  displayChart(context.id.ticker);
  
  return { type: 'fdc3.nothing' };
});
```

---

## Multi-Application Workflows

### Scenario: Trading Workflow

Create two applications that communicate via FDC3:

**App 1: Market Data**
- Broadcasts instrument context
- Joins user channels

**App 2: Chart Viewer**
- Listens for instrument context
- Displays charts
- Handles ViewChart intent

### Market Data App

```javascript
// Broadcast instrument when user selects
async function selectInstrument(ticker) {
  await window.fdc3.broadcast({
    type: 'fdc3.instrument',
    id: { ticker: ticker },
    name: getInstrumentName(ticker)
  });
}

// Join channel
await window.fdc3.joinUserChannel('red');
```

### Chart Viewer App

```javascript
// Listen for instruments
window.fdc3.addContextListener('fdc3.instrument', (context) => {
  displayChart(context.id.ticker);
});

// Handle ViewChart intent
window.fdc3.addIntentListener('ViewChart', (context) => {
  displayChart(context.id.ticker);
  return { type: 'fdc3.nothing' };
});

// Join same channel
await window.fdc3.joinUserChannel('red');
```

### Launch Both Apps

```javascript
// Launch market data app
const marketDataApp = await fin.Application.create({
  manifestUrl: 'https://example.com/market-data-manifest.json'
});
await marketDataApp.run();

// Launch chart viewer app
const chartApp = await fin.Application.create({
  manifestUrl: 'https://example.com/chart-viewer-manifest.json'
});
await chartApp.run();
```

---

## Workspaces

Workspaces allow you to save and restore collections of applications and their layouts.

### Create a Workspace

```javascript
const platform = fin.Platform.getCurrentSync();

const workspace = await platform.createWorkspace({
  id: 'trading-workspace',
  name: 'Trading Workspace',
  applications: [
    {
      appId: 'market-data',
      manifestUrl: 'https://example.com/market-data-manifest.json',
      autoLaunch: true
    },
    {
      appId: 'chart-viewer',
      manifestUrl: 'https://example.com/chart-viewer-manifest.json',
      autoLaunch: true
    }
  ],
  layout: {
    type: 'side-by-side',
    windows: [
      {
        appId: 'market-data',
        bounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      {
        appId: 'chart-viewer',
        bounds: { x: 800, y: 0, width: 800, height: 600 }
      }
    ]
  }
});
```

### Launch a Workspace

```javascript
const workspace = await platform
  .getWorkspaceManager()
  .getWorkspace('trading-workspace');

await workspace.launch();
```

### Save Current State

```javascript
await workspace.save();
```

---

## Next Steps

### Learn More

- **[API Documentation](API.md)** - Complete API reference
- **[Application Manifest Guide](MANIFEST.md)** - Manifest configuration
- **[Platform Configuration](CONFIGURATION.md)** - Platform settings
- **[FDC3 Standard](https://fdc3.finos.org/)** - FDC3 specification

### Sample Applications

Explore the sample applications in the `apps/` directory:

- **sample-app-1** - Broadcaster with intent handlers
- **sample-app-2** - Listener with intent raising
- **sample-app-3** - Advanced FDC3 features

### Development Workflow

1. **Create Application**
   - Write HTML/CSS/JavaScript
   - Create manifest.json
   - Test locally

2. **Add FDC3**
   - Implement context broadcasting
   - Add intent handlers
   - Test with other apps

3. **Deploy**
   - Host manifest on web server
   - Configure permissions
   - Deploy to users

### Common Patterns

#### Pattern 1: Context Broadcasting

```javascript
// Broadcaster
await window.fdc3.broadcast({
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL' }
});

// Listener
window.fdc3.addContextListener('fdc3.instrument', (context) => {
  console.log('Received:', context.id.ticker);
});
```

#### Pattern 2: Intent Resolution

```javascript
// Raise intent
await window.fdc3.raiseIntent('ViewChart', {
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL' }
});

// Handle intent
window.fdc3.addIntentListener('ViewChart', (context) => {
  displayChart(context.id.ticker);
  return { type: 'fdc3.nothing' };
});
```

#### Pattern 3: Channel Isolation

```javascript
// App 1 - Red channel
await window.fdc3.joinUserChannel('red');
await window.fdc3.broadcast(context);

// App 2 - Red channel (receives)
await window.fdc3.joinUserChannel('red');

// App 3 - Blue channel (does NOT receive)
await window.fdc3.joinUserChannel('blue');
```

### Debugging

#### Enable Debug Logging

```json
{
  "runtime": {
    "logLevel": "debug"
  }
}
```

#### Open Developer Tools

```javascript
await fin.System.showDeveloperTools();
```

#### Check FDC3 Availability

```javascript
if (window.fdc3) {
  console.log('FDC3 is available');
} else {
  console.error('FDC3 is not available');
}
```

### Troubleshooting

#### Application Won't Launch

1. Check manifest URL is correct
2. Verify manifest JSON is valid
3. Check runtime version compatibility
4. Review logs for errors

#### FDC3 Not Working

1. Verify `window.fdc3` is available
2. Check both apps are on same channel
3. Verify context types match
4. Check intent is registered in manifest

#### Permission Denied

1. Add permission to manifest
2. Check security configuration
3. Verify URL is whitelisted

---

## Community and Support

### Get Help

- **GitHub Issues:** [https://github.com/sanjeev23oct/open-openfin/issues](https://github.com/sanjeev23oct/open-openfin/issues)
- **Discussions:** [https://github.com/sanjeev23oct/open-openfin/discussions](https://github.com/sanjeev23oct/open-openfin/discussions)
- **Documentation:** [https://github.com/sanjeev23oct/open-openfin/tree/main/docs](https://github.com/sanjeev23oct/open-openfin/tree/main/docs)

### Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### License

This project is licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

## Quick Reference

### Essential Commands

```bash
# Launch platform
DesktopInterop

# Launch with manifest
DesktopInterop --manifest=path/to/manifest.json

# Check version
DesktopInterop --version

# Enable debug mode
DesktopInterop --log-level=debug
```

### Essential APIs

```javascript
// Get current application
const app = fin.Application.getCurrent();

// Get current window
const window = fin.Window.getCurrent();

// Broadcast context
await window.fdc3.broadcast(context);

// Join channel
await window.fdc3.joinUserChannel('red');

// Raise intent
await window.fdc3.raiseIntent('ViewChart', context);
```

### Essential Manifest

```json
{
  "startup_app": {
    "uuid": "my-app",
    "name": "My App",
    "url": "https://example.com/app"
  },
  "runtime": {
    "version": "0.1.0"
  },
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true
    }
  },
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "contexts": ["fdc3.instrument"]
      }
    ]
  }
}
```

---

Happy building! 🚀
