# Getting Started - Web Platform

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/web-platform
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The platform will open at `http://localhost:3000`

### 3. Use the Platform

#### Launch Applications
1. Click **"📱 Launch Apps"** button in the header
2. Select an app from the grid (Ticker List, Ticker Details, or News Feed)
3. The app will open in a draggable window

#### Test FDC3 Communication
1. Launch **Ticker List** app
2. Launch **Ticker Details** app  
3. Launch **News Feed** app
4. Click any ticker in the Ticker List
5. Watch the other apps update automatically via FDC3!

#### Use Channels
1. Click a colored channel button in the header (Red, Blue, Green, etc.)
2. Apps on the same channel will share context
3. Apps on different channels are isolated

#### Manage Workspaces
1. Click **"💼 Workspaces"** button
2. Select **"💾 Save Current"** to save your layout
3. Select **"📂 Load..."** to restore a saved workspace

## 🎯 Features

### ✅ Fully Functional
- **Window Management**: Drag, resize, minimize, maximize windows
- **FDC3 Messaging**: Apps communicate via broadcast/intents
- **Channel Management**: Color-coded channels for context isolation
- **Workspace Persistence**: Save/load layouts (IndexedDB + localStorage fallback)
- **Application Launcher**: Visual app grid
- **Dock**: Running apps with quick access
- **Platform Detection**: Browser capability checking

### 📱 Demo Applications

**Ticker List** (`/apps/ticker-list`)
- Browse stock tickers
- Click to broadcast instrument context
- Other apps receive and display the selection

**Ticker Details** (`/apps/ticker-details`)
- Listens for instrument contexts
- Displays detailed stock information
- Updates automatically when ticker is selected

**News Feed** (`/apps/news-feed`)
- Shows financial news
- Filters news based on selected ticker
- Demonstrates context listening

## 🏗️ Architecture

```
Browser Tab
├── Platform Header (channels, workspace controls)
├── Window Container (draggable app windows)
├── App Launcher Overlay (app grid)
└── Dock (running apps)

Each App Window:
├── iframe (sandboxed)
├── FDC3 Bridge (auto-injected)
└── postMessage communication
```

## 🔧 Development

### Add New Applications

1. Create app directory: `public/apps/your-app/`
2. Add `index.html` with your app
3. Register in `public/apps/directory.json`:

```json
{
  "appId": "your-app",
  "name": "Your App",
  "title": "Your App Title",
  "description": "App description",
  "url": "/apps/your-app/index.html",
  "icon": "🎯",
  "window": {
    "defaultSize": { "width": 600, "height": 400 }
  }
}
```

### Use FDC3 in Your App

```javascript
// Wait for FDC3 to be injected
function checkFDC3() {
  if (window.fdc3) {
    // FDC3 is ready!
    
    // Broadcast context
    window.fdc3.broadcast({
      type: 'fdc3.instrument',
      id: { ticker: 'AAPL' }
    });
    
    // Listen for contexts
    window.fdc3.addContextListener(null, (context) => {
      console.log('Received:', context);
    });
    
    // Join a channel
    window.fdc3.joinUserChannel('red');
    
  } else {
    setTimeout(checkFDC3, 100);
  }
}

checkFDC3();
```

## 📦 Build for Production

```bash
npm run build
```

Output will be in `dist/` directory. Deploy to any static hosting:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## 🧪 Testing

### Manual Testing Checklist

- [ ] Launch multiple apps
- [ ] Drag windows around
- [ ] Resize windows
- [ ] Minimize/maximize windows
- [ ] Click ticker in Ticker List
- [ ] Verify Ticker Details updates
- [ ] Verify News Feed updates
- [ ] Switch channels
- [ ] Save workspace
- [ ] Reload page
- [ ] Load saved workspace
- [ ] Close apps from dock

### Browser Console

```javascript
// Access platform
window.platform

// Launch app programmatically
await window.platform.launchApplication('ticker-list')

// Get running apps
window.platform.getRunningApplications()

// Access services
window.platform.getWindowManager()
window.platform.getMessageRouter()
window.platform.getWorkspaceManager()
```

## 🐛 Troubleshooting

### Apps not communicating?
- Check browser console for errors
- Verify FDC3 bridge is injected (check `window.fdc3`)
- Ensure apps are on the same channel

### Windows not draggable?
- Check if title bar is visible
- Verify mouse events are not blocked

### Workspace not saving?
- Check IndexedDB is available
- Check browser storage quota
- Try localStorage fallback

### Apps not loading?
- Check app URL in directory.json
- Verify CORS settings
- Check browser console for errors

## 📚 Next Steps

- Add more demo apps
- Implement intent resolution UI
- Add window grouping
- Add keyboard shortcuts
- Implement Service Worker for offline support
- Add PWA install prompt
- Create mobile-responsive layout

## 🎉 You're Ready!

The platform is fully functional. Users can:
1. ✅ Launch apps from UI
2. ✅ Manage windows (drag, resize, minimize, maximize)
3. ✅ Apps communicate via FDC3
4. ✅ Use channels for context isolation
5. ✅ Save/load workspaces
6. ✅ Access running apps from dock

**Enjoy building with the Web Platform!** 🚀
