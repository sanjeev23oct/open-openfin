# Web Platform Demo Guide

## What's Working

The web platform now has a fully functional demo with FDC3 interop between apps!

### Features Implemented

1. **Platform UI**
   - Modern launcher with app grid
   - Dock showing running apps
   - Channel selector (visual only for now)
   - Workspace save/load controls

2. **Window Management**
   - Draggable windows
   - Resizable windows
   - Minimize/maximize/close
   - Window stacking (z-index management)

3. **FDC3 Communication**
   - Context broadcasting between apps
   - PostMessage-based bridge
   - Channel management (core logic ready)

4. **Demo Applications**
   - **Ticker List**: Browse 12 stock tickers with live price updates
   - **Ticker Details**: View detailed stock information with charts
   - **News Feed**: Placeholder for financial news

## How to Test

### 1. Start the Platform

```bash
cd packages/web-platform
npm run dev
```

Open http://localhost:3000 in your browser.

### 2. Launch Apps

1. Click "📱 Launch Apps" button in the header
2. Click on "Ticker List" to launch the market watch app
3. Click on "Ticker Details" to launch the details app

### 3. Test FDC3 Communication

1. In the **Ticker List** app, click any stock ticker (e.g., AAPL, MSFT, GOOGL)
2. The **Ticker Details** app should automatically update to show:
   - Stock symbol and company name
   - Current price and change
   - Animated price chart
   - Key statistics
   - Company information

### 4. Test Window Management

- **Drag**: Click and drag the window title bar
- **Resize**: Drag the edges or corners of the window
- **Minimize**: Click the minimize button (window goes to dock)
- **Maximize**: Click the maximize button (fills container)
- **Close**: Click the X button (removes from dock)

## Architecture

### Message Flow

```
Ticker List App (iframe)
  └─> postMessage({ type: 'fdc3.broadcast', context: {...} })
      └─> PostMessageRouter
          └─> Broadcasts to all other apps
              └─> Ticker Details App (iframe)
                  └─> Receives message event
                      └─> Updates UI
```

### Key Components

- **WebPlatformCore**: Main orchestrator
- **BrowserWindowManager**: Window lifecycle and positioning
- **PostMessageRouter**: FDC3 message routing
- **FDC3Bridge**: API implementation for apps
- **StorageManager**: Workspace persistence

## Next Steps

### To Complete FDC3 Implementation

1. **Channel Selector**: Wire up the channel buttons to actually switch channels
2. **Intent Resolution**: Implement intent handling (ViewChart, ViewNews, etc.)
3. **App Directory**: Add more demo apps
4. **Context Listeners**: Full listener lifecycle management

### To Improve UX

1. **Window Animations**: Smooth transitions for minimize/maximize
2. **Keyboard Shortcuts**: Cmd+W to close, etc.
3. **Window Snapping**: Snap to edges and corners
4. **Multi-monitor**: Support for multiple displays (if possible in browser)

### To Add Features

1. **Workspace Templates**: Pre-configured layouts
2. **App Search**: Quick launcher with search
3. **Notifications**: Toast notifications for FDC3 events
4. **Themes**: Light/dark mode toggle

## Known Limitations

1. **Browser Sandbox**: Limited compared to Electron (no file system, no native menus)
2. **Performance**: Many iframes can impact performance
3. **Security**: Need to implement proper origin validation
4. **Persistence**: IndexedDB has storage limits

## Comparison with Desktop Platform

| Feature | Desktop (Electron) | Web (Browser) |
|---------|-------------------|---------------|
| Window Management | Native OS windows | Simulated with divs |
| FDC3 API | Direct injection | postMessage bridge |
| File System | Full access | Limited (downloads only) |
| Performance | Native | Good (with limits) |
| Distribution | Installer required | Just a URL |
| Updates | Manual/auto-update | Instant (refresh) |

## Troubleshooting

### Apps not communicating?

Check the browser console for PostMessageRouter logs. You should see:
- `[PostMessageRouter] FDC3 broadcast from ticker-list`
- `[PostMessageRouter] Registering app: ticker-details`

### Windows not draggable?

Make sure you're clicking on the title bar, not the content area.

### Chart not showing?

The Chart.js library loads from CDN. Check your internet connection.

## Demo Script

For a quick demo:

1. "This is a browser-based desktop interop platform"
2. "Let me launch two financial apps" (click Launch Apps, open both)
3. "Watch what happens when I click a stock ticker" (click AAPL)
4. "The details app automatically updates via FDC3"
5. "I can drag windows around, resize them, minimize to the dock"
6. "All of this runs in a browser - no installation needed"
7. "The platform handles FDC3 communication between apps"
8. "Prices update in real-time" (wait 5 seconds)

Enjoy the demo! 🚀
