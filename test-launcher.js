/**
 * Simple test launcher to run both sample apps
 * This demonstrates the platform launching two apps that can communicate via FDC3
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Simple FDC3 message bus for testing
class SimpleFDC3Bus {
  constructor() {
    this.channels = new Map(); // channelId -> context
    this.windows = new Map(); // windowId -> { window, channelId }
  }
  
  registerWindow(window, windowId) {
    this.windows.set(windowId, { window, channelId: null });
  }
  
  joinChannel(windowId, channelId) {
    const entry = this.windows.get(windowId);
    if (entry) {
      entry.channelId = channelId;
      
      // Send current context if exists
      const context = this.channels.get(channelId);
      if (context) {
        entry.window.webContents.send(`fdc3:context:${context.type}`, context);
        entry.window.webContents.send('fdc3:context:*', context);
      }
    }
  }
  
  broadcast(windowId, context) {
    const entry = this.windows.get(windowId);
    if (!entry || !entry.channelId) {
      throw new Error('Not joined to any channel');
    }
    
    // Store context for channel
    this.channels.set(entry.channelId, context);
    
    // Broadcast to all windows on same channel
    for (const [id, win] of this.windows.entries()) {
      if (win.channelId === entry.channelId && id !== windowId) {
        win.window.webContents.send(`fdc3:context:${context.type}`, context);
        win.window.webContents.send('fdc3:context:*', context);
      }
    }
  }
}

const fdc3Bus = new SimpleFDC3Bus();

function createWindow(manifestPath, windowId) {
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestContent);
  const startupApp = manifest.startup_app;
  
  const window = new BrowserWindow({
    width: startupApp.defaultWidth || 800,
    height: startupApp.defaultHeight || 600,
    x: startupApp.defaultLeft,
    y: startupApp.defaultTop,
    webPreferences: {
      preload: path.join(__dirname, 'test-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  // Register window with FDC3 bus
  fdc3Bus.registerWindow(window, windowId);
  
  // Set up IPC handlers for this window
  ipcMain.handle(`fdc3:broadcast:${windowId}`, async (event, context) => {
    fdc3Bus.broadcast(windowId, context);
  });
  
  ipcMain.handle(`fdc3:joinChannel:${windowId}`, async (event, channelId) => {
    fdc3Bus.joinChannel(windowId, channelId);
  });
  
  // Load the app
  const htmlPath = startupApp.url.replace('file:///', '');
  window.loadFile(htmlPath);
  
  return window;
}

app.whenReady().then(() => {
  // Set up global IPC handlers
  ipcMain.handle('fdc3:broadcast', async (event, context) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      fdc3Bus.broadcast(windowId, context);
    }
  });
  
  ipcMain.handle('fdc3:joinChannel', async (event, channelId) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      fdc3Bus.joinChannel(windowId, channelId);
    }
  });
  
  ipcMain.handle('fdc3:getCurrentChannel', async (event) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      const entry = fdc3Bus.windows.get(windowId);
      return entry?.channelId || null;
    }
    return null;
  });
  
  // Launch all three sample apps
  console.log('Launching Sample App 1...');
  const app1 = createWindow('apps/sample-app-1/manifest.json', 1);
  
  console.log('Launching Sample App 2...');
  const app2 = createWindow('apps/sample-app-2/manifest.json', 2);
  
  console.log('Launching Sample App 3...');
  const app3 = createWindow('apps/sample-app-3/manifest.json', 3);
  
  console.log('\n✅ All 3 apps launched in the same container!');
  console.log('📡 App 1 (Broadcaster) - Broadcasts FDC3 contexts');
  console.log('📻 App 2 (Listener) - Receives and lists contexts');
  console.log('📊 App 3 (Chart Viewer) - Displays chart for contexts');
  console.log('\nTest steps:');
  console.log('1. In ALL apps, click "Join Red Channel"');
  console.log('2. In App 1, enter a ticker symbol and click "Broadcast Instrument"');
  console.log('3. Both App 2 AND App 3 should receive and display the context!');
  console.log('4. Try different channels to see isolation in action');
});

app.on('window-all-closed', () => {
  app.quit();
});
