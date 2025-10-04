/**
 * Desktop Interop Platform Launcher
 * This is the main entry point that provides the full OpenFin-like experience
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// Simple FDC3 message bus
class SimpleFDC3Bus {
  constructor() {
    this.channels = new Map();
    this.windows = new Map();
  }
  
  registerWindow(window, windowId, appId) {
    this.windows.set(windowId, { window, channelId: null, appId });
  }
  
  joinChannel(windowId, channelId) {
    const entry = this.windows.get(windowId);
    if (entry) {
      entry.channelId = channelId;
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
    
    this.channels.set(entry.channelId, context);
    
    for (const [id, win] of this.windows.entries()) {
      if (win.channelId === entry.channelId && id !== windowId) {
        win.window.webContents.send(`fdc3:context:${context.type}`, context);
        win.window.webContents.send('fdc3:context:*', context);
      }
    }
  }
  
  getChannelApps(channelId) {
    const apps = [];
    for (const win of this.windows.values()) {
      if (win.channelId === channelId) {
        apps.push(win.appId);
      }
    }
    return apps;
  }
}

// Platform state
class PlatformState {
  constructor() {
    this.launcherWindow = null;
    this.appWindows = new Map();
    this.fdc3Bus = new SimpleFDC3Bus();
    this.tray = null;
  }
}

const platform = new PlatformState();

/**
 * Create the platform launcher window
 */
function createLauncherWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  platform.launcherWindow = new BrowserWindow({
    width: 900,
    height: 700,
    x: Math.floor((width - 900) / 2),
    y: Math.floor((height - 700) / 2),
    webPreferences: {
      preload: path.join(__dirname, 'platform-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Desktop Interop Platform',
    icon: path.join(__dirname, 'assets', 'icon.png')
  });
  
  platform.launcherWindow.loadFile('platform-ui/launcher.html');
  
  // Don't close app when launcher closes, just hide it
  platform.launcherWindow.on('close', (event) => {
    if (platform.appWindows.size > 0) {
      event.preventDefault();
      platform.launcherWindow.hide();
    }
  });
}

/**
 * Create system tray
 */
function createSystemTray() {
  // Create a simple icon (in production, use actual icon file)
  platform.tray = new Tray(path.join(__dirname, 'assets', 'tray-icon.png'));
  
  const updateTrayMenu = () => {
    const runningApps = Array.from(platform.appWindows.entries());
    
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Desktop Interop Platform',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Show Launcher',
        click: () => {
          platform.launcherWindow.show();
          platform.launcherWindow.focus();
        }
      },
      { type: 'separator' },
      {
        label: `Running Apps (${runningApps.length})`,
        enabled: false
      },
      ...runningApps.map(([appId, window]) => ({
        label: `  ${appId}`,
        click: () => {
          window.show();
          window.focus();
        }
      })),
      { type: 'separator' },
      {
        label: 'Quit Platform',
        click: () => {
          app.quit();
        }
      }
    ]);
    
    platform.tray.setContextMenu(contextMenu);
  };
  
  platform.tray.setToolTip('Desktop Interop Platform');
  updateTrayMenu();
  
  // Update menu when apps change
  setInterval(updateTrayMenu, 2000);
}

/**
 * Launch an application
 */
function launchApplication(manifestPath, appId) {
  // Check if already running
  if (platform.appWindows.has(appId)) {
    const window = platform.appWindows.get(appId);
    window.show();
    window.focus();
    return window;
  }
  
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
    },
    title: startupApp.name,
    show: startupApp.autoShow !== false
  });
  
  // Register with FDC3 bus
  platform.fdc3Bus.registerWindow(window, window.id, appId);
  
  // Track window
  platform.appWindows.set(appId, window);
  
  // Handle window close
  window.on('closed', () => {
    platform.appWindows.delete(appId);
    platform.fdc3Bus.windows.delete(window.id);
    
    // Update launcher
    if (platform.launcherWindow) {
      platform.launcherWindow.webContents.send('app-closed', appId);
    }
  });
  
  // Load app
  const htmlPath = startupApp.url.replace('file:///', '');
  window.loadFile(htmlPath);
  
  // Notify launcher
  if (platform.launcherWindow) {
    platform.launcherWindow.webContents.send('app-launched', {
      appId,
      name: startupApp.name
    });
  }
  
  return window;
}

/**
 * Set up IPC handlers
 */
function setupIPC() {
  // Launch app from launcher
  ipcMain.handle('platform:launch-app', async (event, manifestPath, appId) => {
    launchApplication(manifestPath, appId);
    return { success: true };
  });
  
  // Get running apps
  ipcMain.handle('platform:get-running-apps', async () => {
    return Array.from(platform.appWindows.keys());
  });
  
  // Close app
  ipcMain.handle('platform:close-app', async (event, appId) => {
    const window = platform.appWindows.get(appId);
    if (window) {
      window.close();
    }
    return { success: true };
  });
  
  // Focus app
  ipcMain.handle('platform:focus-app', async (event, appId) => {
    const window = platform.appWindows.get(appId);
    if (window) {
      window.show();
      window.focus();
    }
    return { success: true };
  });
  
  // FDC3 handlers
  ipcMain.handle('fdc3:broadcast', async (event, context) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      platform.fdc3Bus.broadcast(windowId, context);
    }
  });
  
  ipcMain.handle('fdc3:joinChannel', async (event, channelId) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      platform.fdc3Bus.joinChannel(windowId, channelId);
    }
  });
  
  ipcMain.handle('fdc3:getCurrentChannel', async (event) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      const entry = platform.fdc3Bus.windows.get(windowId);
      return entry?.channelId || null;
    }
    return null;
  });
  
  // Get channel info
  ipcMain.handle('platform:get-channel-info', async (event, channelId) => {
    const apps = platform.fdc3Bus.getChannelApps(channelId);
    return { apps: apps.length };
  });
}

/**
 * Initialize platform
 */
app.whenReady().then(() => {
  console.log('🚀 Desktop Interop Platform Starting...');
  
  // Set up IPC
  setupIPC();
  
  // Create launcher window
  createLauncherWindow();
  
  // Create system tray
  createSystemTray();
  
  console.log('✅ Platform Ready!');
  console.log('📱 Launcher window opened');
  console.log('🎯 System tray icon created');
  console.log('\nYou can now:');
  console.log('1. Click on apps in the launcher to start them');
  console.log('2. Use the system tray to manage running apps');
  console.log('3. Apps will communicate via FDC3 channels');
});

app.on('window-all-closed', () => {
  // Don't quit on macOS
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (platform.launcherWindow === null) {
    createLauncherWindow();
  } else {
    platform.launcherWindow.show();
  }
});
