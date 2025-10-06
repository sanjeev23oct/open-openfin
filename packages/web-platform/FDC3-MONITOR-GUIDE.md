# FDC3 Monitor Guide

## Overview

The FDC3 Monitor is a diagnostic tool that displays all FDC3 messages being passed between applications in real-time. It's invaluable for debugging interop issues and understanding message flow.

## Web Platform

### Opening the Monitor

1. Start the web platform: `npm run dev`
2. Open http://localhost:3000
3. Click the **🔍 FDC3 Monitor** button in the header

### Features

- **Real-time message display** - See messages as they happen
- **Direction indicators** - Blue (↑) for sent, Green (↓) for received
- **Message details** - Type, timestamp, from/to, channel, payload
- **Statistics** - Total, sent, and received message counts
- **Export** - Download messages as JSON for analysis
- **Clear** - Reset the message list
- **Draggable** - Move the monitor anywhere on screen

### Message Types

- **broadcast** - Context broadcast from an app
- **context** - Context delivered to an app
- **intent** - Intent raised by an app
- **channel** - Channel-related operations

## Desktop Platform

### Opening the Monitor

For the desktop (Electron) platform, you'll need to:

1. Add a menu item or button to open the monitor window
2. Open `platform-ui/fdc3-monitor.html` in a new BrowserWindow
3. Send FDC3 messages to the monitor via IPC

### Example Integration

```typescript
// In your main process
import { BrowserWindow } from 'electron';

let monitorWindow: BrowserWindow | null = null;

function openFDC3Monitor() {
  if (monitorWindow) {
    monitorWindow.focus();
    return;
  }

  monitorWindow = new BrowserWindow({
    width: 500,
    height: 600,
    title: 'FDC3 Monitor',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'monitor-preload.js')
    }
  });

  monitorWindow.loadFile('platform-ui/fdc3-monitor.html');

  monitorWindow.on('closed', () => {
    monitorWindow = null;
  });
}

// Send messages to monitor
function logFDC3Message(message: any) {
  if (monitorWindow && !monitorWindow.isDestroyed()) {
    monitorWindow.webContents.send('fdc3-message', message);
  }
}
```

### Monitor Preload Script

```typescript
// monitor-preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFDC3Message: (callback) => {
    ipcRenderer.on('fdc3-message', (event, message) => {
      callback(message);
    });
  }
});
```

## Message Format

All messages follow this structure:

```typescript
interface FDC3Message {
  id: string;              // Unique message ID
  timestamp: number;       // Unix timestamp
  direction: 'sent' | 'received';
  type: string;            // Message type (broadcast, context, intent, etc.)
  from?: string;           // Source app ID
  to?: string;             // Destination app ID
  channel?: string;        // Channel name (if applicable)
  payload: any;            // Message payload (context, intent, etc.)
}
```

## Tips

### Debugging Context Flow

1. Open the monitor
2. Launch two apps (e.g., Ticker List and Ticker Details)
3. Click a ticker in the list
4. Watch the monitor show:
   - **Received** broadcast from ticker-list
   - **Sent** context to ticker-details

### Finding Issues

- **No messages?** Check if apps are properly registered
- **Messages not reaching app?** Verify the app ID matches
- **Wrong payload?** Check the context structure in the monitor

### Performance

- Monitor keeps last 100 messages by default
- Use **Clear** button to reset if performance degrades
- Use **Pause** button to freeze the display while analyzing

## Keyboard Shortcuts

- **Ctrl/Cmd + K** - Clear messages (when focused)
- **Ctrl/Cmd + E** - Export messages (when focused)
- **Ctrl/Cmd + P** - Pause/Resume (when focused)

## Export Format

Exported JSON contains an array of messages:

```json
[
  {
    "id": "msg-1234567890-abc123",
    "timestamp": 1234567890000,
    "direction": "sent",
    "type": "context",
    "from": "ticker-list",
    "to": "ticker-details",
    "payload": {
      "type": "fdc3.instrument",
      "id": { "ticker": "AAPL" },
      "name": "Apple Inc."
    }
  }
]
```

## Troubleshooting

### Monitor not showing messages

1. Check if monitor is enabled: `fdc3Monitor.isEnabled()`
2. Verify PostMessageRouter is logging messages
3. Check browser console for errors

### Messages appearing twice

This is normal - one for "received" from sender, one for "sent" to receiver.

### Monitor window not opening (Desktop)

1. Check if BrowserWindow is created successfully
2. Verify the HTML file path is correct
3. Check preload script is loaded

## Advanced Usage

### Programmatic Access

```typescript
import { fdc3Monitor } from './diagnostics/FDC3Monitor';

// Enable monitoring
fdc3Monitor.enable();

// Get all messages
const messages = fdc3Monitor.getMessages();

// Get statistics
const stats = fdc3Monitor.getStats();
console.log(`Total: ${stats.total}, Sent: ${stats.sent}, Received: ${stats.received}`);

// Subscribe to updates
const unsubscribe = fdc3Monitor.subscribe((messages) => {
  console.log('New message:', messages[0]);
});

// Later: unsubscribe
unsubscribe();
```

### Custom Logging

```typescript
// Log custom messages
fdc3Monitor.logMessage({
  direction: 'sent',
  type: 'custom-event',
  from: 'my-app',
  to: 'other-app',
  payload: { data: 'custom data' }
});
```

## See Also

- [FDC3 Specification](https://fdc3.finos.org/)
- [Web Platform Demo Guide](./DEMO-GUIDE.md)
- [Production Ready Features](./PRODUCTION-READY.md)
