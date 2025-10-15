/**
 * Desktop Interop Platform Launcher - SIMPLE & MODULAR
 */

const { app, BrowserWindow, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import modules
const positioning = require('./platform-modules/window-positioning');
const linking = require('./platform-modules/window-linking');
const workspace = require('./platform-modules/workspace-manager');
const SimpleFDC3Bus = require('./platform-modules/fdc3-bus');

// Import production-ready services
const { MessageBroker } = require('./packages/runtime/dist/packages/runtime/src/services/MessageBroker');
const { MessagePersistence } = require('./packages/runtime/dist/packages/runtime/src/services/MessagePersistence');

// Setup paths
const userDataPath = path.join(os.homedir(), '.desktop-interop-platform');
app.setPath('userData', userDataPath);
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

const workspacesPath = path.join(userDataPath, 'workspaces.json');
const iabStoragePath = path.join(userDataPath, '.iab-storage');

// Platform state
const platform = {
  launcherWindow: null,
  appWindows: new Map(),
  fdc3Bus: new SimpleFDC3Bus(),
  messageBroker: null,
  messagePersistence: null
};

/**
 * Create launcher window
 */
function createLauncher() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

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
    title: 'Desktop Interop Platform'
  });

  platform.launcherWindow.loadFile('platform-ui/launcher-modern.html');

  platform.launcherWindow.on('close', (event) => {
    if (platform.appWindows.size > 0) {
      event.preventDefault();
      platform.launcherWindow.hide();
    }
  });
}

/**
 * Create context menu for window
 */
function createContextMenu(window, appId) {
  const otherApps = Array.from(platform.appWindows.entries())
    .filter(([id]) => id !== appId);

  const template = [
    {
      label: 'Snap Left',
      click: () => positioning.snapLeft(window)
    },
    {
      label: 'Snap Right',
      click: () => positioning.snapRight(window)
    }
  ];

  // Add link/unlink options
  if (linking.isLinked(appId)) {
    template.push({ type: 'separator' });
    template.push({
      label: 'Unlink Windows',
      click: () => linking.unlinkWindows(appId)
    });
  } else if (otherApps.length > 0) {
    template.push({ type: 'separator' });
    template.push({
      label: 'Link with...',
      submenu: otherApps.map(([id, win]) => ({
        label: win.getTitle() || id,
        click: () => {
          const otherWindow = platform.appWindows.get(id);
          linking.linkWindows(appId, id, window, otherWindow);
        }
      }))
    });
  }

  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window });
}

/**
 * Launch application
 */
function launchApp(manifestPath, appId) {
  // If already running, focus it
  if (platform.appWindows.has(appId)) {
    const window = platform.appWindows.get(appId);
    window.show();
    window.focus();
    return window;
  }

  let app, appUrl;
  
  // Check if manifestPath is a URL (external app)
  if (manifestPath.startsWith('http://') || manifestPath.startsWith('https://') || manifestPath.startsWith('www.')) {
    // External URL - create a simple app config
    let url = manifestPath;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    app = {
      name: appId,
      defaultWidth: 1024,
      defaultHeight: 768,
      autoShow: true
    };
    appUrl = url;
  } else {
    // Read manifest file
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    app = manifest.startup_app;
    appUrl = app.url;
  }

  // Get position - ALWAYS use auto-positioning
  const width = app.defaultWidth || 800;
  const height = app.defaultHeight || 600;
  const isFirstWindow = platform.appWindows.size === 0;
  const position = positioning.getNextPosition(width, height, isFirstWindow);
  console.log(`[Launch] ${appId} at (${position.x}, ${position.y}), isFirst=${isFirstWindow}`);

  // Create window
  const window = new BrowserWindow({
    width,
    height,
    x: position.x,
    y: position.y,
    webPreferences: {
      preload: path.join(__dirname, 'tests', 'test-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: app.name,
    show: app.autoShow !== false
  });

  // Add context menu
  window.webContents.on('context-menu', () => {
    createContextMenu(window, appId);
  });

  // Register with FDC3
  platform.fdc3Bus.registerWindow(window, window.id, appId);

  // Track window
  platform.appWindows.set(appId, window);

  // Handle close
  window.on('closed', () => {
    platform.appWindows.delete(appId);
    platform.fdc3Bus.windows.delete(window.id);
    linking.unlinkWindows(appId);
    if (platform.launcherWindow) {
      platform.launcherWindow.webContents.send('app-closed', appId);
    }
  });

  // Load app - check if URL or file
  if (appUrl.startsWith('http://') || appUrl.startsWith('https://')) {
    window.loadURL(appUrl);
  } else {
    window.loadFile(appUrl);
  }

  // Notify launcher
  if (platform.launcherWindow) {
    platform.launcherWindow.webContents.send('app-launched', { appId, name: app.name });
  }

  return window;
}

/**
 * Setup IPC handlers
 */
function setupIPC() {
  // App management
  ipcMain.handle('platform:launch-app', async (event, manifestPath, appId) => {
    launchApp(manifestPath, appId);
    return { success: true };
  });

  ipcMain.handle('platform:get-running-apps', async () => {
    return Array.from(platform.appWindows.keys());
  });

  ipcMain.handle('platform:focus-app', async (event, appId) => {
    const window = platform.appWindows.get(appId);
    if (window) {
      window.show();
      window.focus();
    }
    return { success: true };
  });

  ipcMain.handle('platform:minimize-launcher', async () => {
    if (platform.launcherWindow) {
      platform.launcherWindow.minimize();
    }
    return { success: true };
  });

  // FDC3
  ipcMain.handle('fdc3:broadcast', async (event, context) => {
    const windowId = BrowserWindow.fromWebContents(event.sender)?.id;
    if (windowId) {
      platform.fdc3Bus.broadcast(windowId, context);
      
      // Persist the message
      if (platform.messagePersistence) {
        await platform.messagePersistence.persist({
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          sender: { uuid: `window-${windowId}`, name: 'FDC3App' },
          topic: `fdc3.broadcast.${context.type || 'unknown'}`,
          payload: context
        });
      }
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

  // Workspaces
  ipcMain.handle('workspace:save', async (event, name) => {
    try {
      const ws = workspace.saveWorkspace(name, platform.appWindows, workspacesPath);
      return { success: true, workspace: ws };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:load', async (event, name) => {
    try {
      const ws = workspace.loadWorkspace(name, workspacesPath);

      // Close all windows
      for (const window of platform.appWindows.values()) {
        window.close();
      }

      // Launch apps after delay
      setTimeout(() => {
        for (const app of ws.apps) {
          const manifestPath = `apps/${app.appId}/manifest.json`;
          if (fs.existsSync(manifestPath)) {
            const window = launchApp(manifestPath, app.appId);
            if (window) {
              window.setBounds(app.bounds);
            }
          }
        }
      }, 500);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('workspace:list', async () => {
    return workspace.listWorkspaces(workspacesPath);
  });

  ipcMain.handle('workspace:delete', async (event, name) => {
    try {
      workspace.deleteWorkspace(name, workspacesPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

/**
 * Initialize production-ready services
 */
function initializeProductionServices() {
  console.log('[Production] Initializing MessageBroker...');
  platform.messageBroker = new MessageBroker();
  
  console.log('[Production] Initializing MessagePersistence...');
  platform.messagePersistence = new MessagePersistence({
    enabled: true,
    storageDir: iabStoragePath,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 100,
    flushInterval: 5000 // 5 seconds
  });
  
  // Log statistics every 30 seconds
  setInterval(() => {
    const brokerStats = platform.messageBroker.getStats();
    const persistStats = platform.messagePersistence.getStats();
    
    console.log('[Production] Stats:', {
      broker: {
        exactRoutes: brokerStats.exactRoutes,
        wildcardRoutes: brokerStats.wildcardRoutes,
        queuedMessages: brokerStats.queuedMessages,
        deadLetterMessages: brokerStats.deadLetterMessages
      },
      persistence: {
        enabled: persistStats.enabled,
        fileCount: persistStats.fileCount,
        totalSize: `${(persistStats.totalSize / 1024).toFixed(2)} KB`,
        bufferedMessages: persistStats.bufferedMessages
      }
    });
  }, 30000);
  
  console.log('✅ Production services initialized');
  console.log(`📁 IAB Storage: ${iabStoragePath}`);
}

/**
 * Initialize
 */
app.whenReady().then(() => {
  console.log('🚀 Platform Starting...');
  
  // Initialize production services
  initializeProductionServices();
  
  setupIPC();
  createLauncher();
  console.log('✅ Platform Ready!');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (event) => {
  // Flush messages before quitting
  if (platform.messagePersistence) {
    console.log('[Production] Flushing messages before quit...');
    event.preventDefault();
    await platform.messagePersistence.shutdown();
    console.log('[Production] Shutdown complete');
    app.exit(0);
  }
});

app.on('activate', () => {
  if (platform.launcherWindow === null) {
    createLauncher();
  } else {
    platform.launcherWindow.show();
  }
});
