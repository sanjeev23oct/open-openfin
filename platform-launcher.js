/**
 * Desktop Interop Platform Launcher
 * This is the main entry point that provides the full OpenFin-like experience
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure app paths to avoid cache permission errors
const userDataPath = path.join(os.homedir(), '.desktop-interop-platform');
app.setPath('userData', userDataPath);
app.setPath('cache', path.join(userDataPath, 'cache'));
app.setPath('sessionData', path.join(userDataPath, 'session'));

// Ensure directories exist
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Disable GPU cache errors in development
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

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
    this.windowGroups = new Map(); // groupId -> { windows: [appId], activeWindow: appId, tabBar: BrowserWindow }
  }
}

const platform = new PlatformState();

/**
 * Create the platform launcher window
 */
function createLauncherWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  const windowOptions = {
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
  };
  
  // Add icon if it exists
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  if (fs.existsSync(iconPath)) {
    windowOptions.icon = iconPath;
  }
  
  platform.launcherWindow = new BrowserWindow(windowOptions);
  
  // Use modern launcher with beautiful UI
  platform.launcherWindow.loadFile('platform-ui/launcher-modern.html');
  
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
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  // Check if icon exists, if not, use nativeImage to create a simple one
  let trayIcon;
  if (fs.existsSync(iconPath)) {
    trayIcon = iconPath;
  } else {
    // Create a simple colored square as fallback
    const { nativeImage } = require('electron');
    trayIcon = nativeImage.createEmpty();
  }
  
  try {
    platform.tray = new Tray(trayIcon);
  } catch (error) {
    console.warn('Could not create system tray icon:', error.message);
    // Continue without tray icon
    return;
  }
  
  if (!platform.tray) {
    console.log('⚠️  System tray not available (icon missing)');
    return;
  }
  
  const updateTrayMenu = () => {
    if (!platform.tray) return;
    
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
 * Create tab bar for a group
 */
function createTabBar(groupId, windows) {
  const firstWindow = platform.appWindows.get(windows[0]);
  if (!firstWindow) return null;
  
  const bounds = firstWindow.getBounds();
  const tabBarHeight = 35;
  
  const tabBar = new BrowserWindow({
    width: bounds.width,
    height: tabBarHeight,
    x: bounds.x,
    y: bounds.y - tabBarHeight,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  // Create HTML for tab bar
  const tabs = windows.map((appId, index) => {
    const win = platform.appWindows.get(appId);
    const title = win ? win.getTitle() : appId;
    const isActive = index === 0;
    return `
      <div class="tab ${isActive ? 'active' : ''}" data-app-id="${appId}" onclick="switchTab('${groupId}', '${appId}')">
        <span class="tab-title">${title}</span>
        <span class="tab-close" onclick="event.stopPropagation(); ungroupWindow('${groupId}', '${appId}')">×</span>
      </div>
    `;
  }).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #2d2d2d;
          display: flex;
          height: 100%;
          overflow: hidden;
          -webkit-app-region: drag;
        }
        .tab {
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: 100%;
          background: #3d3d3d;
          border-right: 1px solid #1d1d1d;
          cursor: pointer;
          min-width: 120px;
          max-width: 200px;
          -webkit-app-region: no-drag;
        }
        .tab:hover {
          background: #4d4d4d;
        }
        .tab.active {
          background: #0078d4;
        }
        .tab-title {
          flex: 1;
          color: #fff;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .tab-close {
          margin-left: 8px;
          color: #fff;
          font-size: 18px;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
        }
        .tab-close:hover {
          background: rgba(255,255,255,0.2);
        }
      </style>
    </head>
    <body>
      ${tabs}
      <script>
        const { ipcRenderer } = require('electron');
        
        function switchTab(groupId, appId) {
          ipcRenderer.send('group:switch-tab', groupId, appId);
        }
        
        function ungroupWindow(groupId, appId) {
          ipcRenderer.send('group:ungroup-window', groupId, appId);
        }
        
        // Listen for tab updates
        ipcRenderer.on('group:update-tabs', (event, windows, activeWindow) => {
          const tabs = windows.map(appId => {
            const isActive = appId === activeWindow;
            return \`
              <div class="tab \${isActive ? 'active' : ''}" data-app-id="\${appId}" onclick="switchTab('${groupId}', '\${appId}')">
                <span class="tab-title">\${appId}</span>
                <span class="tab-close" onclick="event.stopPropagation(); ungroupWindow('${groupId}', '\${appId}')">×</span>
              </div>
            \`;
          }).join('');
          document.body.innerHTML = tabs;
        });
      </script>
    </body>
    </html>
  `;
  
  tabBar.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  
  return tabBar;
}

/**
 * Create a window group
 */
function createWindowGroup(appId1, appId2) {
  const groupId = `group-${Date.now()}`;
  const windows = [appId1, appId2];
  
  // Create tab bar
  const tabBar = createTabBar(groupId, windows);
  if (!tabBar) return;
  
  // Store group
  platform.windowGroups.set(groupId, {
    windows,
    activeWindow: appId1,
    tabBar
  });
  
  // Hide second window
  const window2 = platform.appWindows.get(appId2);
  if (window2) {
    window2.hide();
  }
  
  // Position windows together
  const window1 = platform.appWindows.get(appId1);
  if (window1 && window2) {
    const bounds1 = window1.getBounds();
    window2.setBounds(bounds1);
  }
  
  console.log(`✅ Created group ${groupId} with windows:`, windows);
}

/**
 * Switch active tab in group
 */
function switchTab(groupId, appId) {
  const group = platform.windowGroups.get(groupId);
  if (!group) return;
  
  // Hide current active window
  const currentWindow = platform.appWindows.get(group.activeWindow);
  if (currentWindow) {
    currentWindow.hide();
  }
  
  // Show new active window
  const newWindow = platform.appWindows.get(appId);
  if (newWindow) {
    newWindow.show();
    newWindow.focus();
  }
  
  // Update group
  group.activeWindow = appId;
  
  // Update tab bar
  if (group.tabBar && !group.tabBar.isDestroyed()) {
    group.tabBar.webContents.send('group:update-tabs', group.windows, appId);
  }
}

/**
 * Ungroup a window from its group
 */
function ungroupWindow(groupId, appId) {
  const group = platform.windowGroups.get(groupId);
  if (!group) return;
  
  // Remove window from group
  group.windows = group.windows.filter(id => id !== appId);
  
  // Show the window
  const window = platform.appWindows.get(appId);
  if (window) {
    window.show();
  }
  
  // If only one window left, destroy group
  if (group.windows.length === 1) {
    if (group.tabBar && !group.tabBar.isDestroyed()) {
      group.tabBar.close();
    }
    platform.windowGroups.delete(groupId);
    console.log(`✅ Destroyed group ${groupId}`);
  } else {
    // Update tab bar
    if (group.tabBar && !group.tabBar.isDestroyed()) {
      group.tabBar.webContents.send('group:update-tabs', group.windows, group.activeWindow);
    }
  }
}

/**
 * Show window management context menu
 */
function showWindowContextMenu(window, appId) {
  const allWindows = Array.from(platform.appWindows.entries());
  const otherWindows = allWindows.filter(([id]) => id !== appId);
  
  const template = [
    {
      label: 'Window Management',
      enabled: false
    },
    { type: 'separator' }
  ];
  
  // Group with... submenu
  if (otherWindows.length > 0) {
    template.push({
      label: 'Group with...',
      submenu: otherWindows.map(([id, win]) => ({
        label: win.getTitle() || id,
        click: () => {
          createWindowGroup(appId, id);
        }
      }))
    });
  } else {
    template.push({
      label: 'Group with...',
      enabled: false,
      submenu: [{ label: 'No other windows', enabled: false }]
    });
  }
  
  template.push({ type: 'separator' });
  
  // Dock to... submenu
  template.push({
    label: 'Dock to...',
    submenu: [
      {
        label: 'Left Half',
        click: () => dockWindow(window, 'left')
      },
      {
        label: 'Right Half',
        click: () => dockWindow(window, 'right')
      },
      {
        label: 'Top Half',
        click: () => dockWindow(window, 'top')
      },
      {
        label: 'Bottom Half',
        click: () => dockWindow(window, 'bottom')
      },
      { type: 'separator' },
      {
        label: 'Top Left Quarter',
        click: () => dockWindow(window, 'top-left')
      },
      {
        label: 'Top Right Quarter',
        click: () => dockWindow(window, 'top-right')
      },
      {
        label: 'Bottom Left Quarter',
        click: () => dockWindow(window, 'bottom-left')
      },
      {
        label: 'Bottom Right Quarter',
        click: () => dockWindow(window, 'bottom-right')
      }
    ]
  });
  
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window });
}

/**
 * Dock window to position
 */
function dockWindow(window, position) {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  
  let bounds;
  switch (position) {
    case 'left':
      bounds = { x: 0, y: 0, width: Math.floor(width / 2), height };
      break;
    case 'right':
      bounds = { x: Math.floor(width / 2), y: 0, width: Math.floor(width / 2), height };
      break;
    case 'top':
      bounds = { x: 0, y: 0, width, height: Math.floor(height / 2) };
      break;
    case 'bottom':
      bounds = { x: 0, y: Math.floor(height / 2), width, height: Math.floor(height / 2) };
      break;
    case 'top-left':
      bounds = { x: 0, y: 0, width: Math.floor(width / 2), height: Math.floor(height / 2) };
      break;
    case 'top-right':
      bounds = { x: Math.floor(width / 2), y: 0, width: Math.floor(width / 2), height: Math.floor(height / 2) };
      break;
    case 'bottom-left':
      bounds = { x: 0, y: Math.floor(height / 2), width: Math.floor(width / 2), height: Math.floor(height / 2) };
      break;
    case 'bottom-right':
      bounds = { x: Math.floor(width / 2), y: Math.floor(height / 2), width: Math.floor(width / 2), height: Math.floor(height / 2) };
      break;
  }
  
  if (bounds) {
    window.setBounds(bounds, true);
  }
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
      preload: path.join(__dirname, 'tests', 'test-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: startupApp.name,
    show: startupApp.autoShow !== false
  });
  
  // Add context menu on right-click
  window.webContents.on('context-menu', () => {
    showWindowContextMenu(window, appId);
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
  
  // Load app - check if it's a URL or file path
  if (startupApp.url.startsWith('http://') || startupApp.url.startsWith('https://')) {
    // External URL - use loadURL
    window.loadURL(startupApp.url);
  } else {
    // Local file - use loadFile
    const htmlPath = startupApp.url.replace('file:///', '');
    window.loadFile(htmlPath);
  }
  
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
 * Launch application with inline manifest
 */
function launchApplicationWithManifest(manifest, appId) {
  // Check if already running
  if (platform.appWindows.has(appId)) {
    const window = platform.appWindows.get(appId);
    window.show();
    window.focus();
    return window;
  }
  
  const startupApp = manifest.startup_app;
  
  const window = new BrowserWindow({
    width: startupApp.defaultWidth || 800,
    height: startupApp.defaultHeight || 600,
    x: startupApp.defaultLeft,
    y: startupApp.defaultTop,
    webPreferences: {
      preload: path.join(__dirname, 'tests', 'test-preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: startupApp.name,
    show: startupApp.autoShow !== false
  });
  
  // Add context menu on right-click
  window.webContents.on('context-menu', () => {
    showWindowContextMenu(window, appId);
  });
  
  // Register with FDC3 bus
  platform.fdc3Bus.registerWindow(window, window.id, appId);
  
  // Track window
  platform.appWindows.set(appId, window);
  
  // Handle window close
  window.on('closed', () => {
    platform.appWindows.delete(appId);
    platform.fdc3Bus.windows.delete(window.id);
    
    if (platform.launcherWindow) {
      platform.launcherWindow.webContents.send('app-closed', appId);
    }
  });
  
  // Load URL directly
  window.loadURL(startupApp.url);
  
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
  // Launch app from launcher (file-based manifest)
  ipcMain.handle('platform:launch-app', async (event, manifestPath, appId) => {
    launchApplication(manifestPath, appId);
    return { success: true };
  });
  
  // Launch app with inline manifest
  ipcMain.handle('platform:launch-app-with-manifest', async (event, appId, manifest) => {
    launchApplicationWithManifest(manifest, appId);
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
  
  // Set window bounds (position and size)
  ipcMain.handle('platform:set-window-bounds', async (event, appId, bounds) => {
    const window = platform.appWindows.get(appId);
    if (window) {
      try {
        // Set bounds with animation
        window.setBounds({
          x: Math.floor(bounds.x),
          y: Math.floor(bounds.y),
          width: Math.floor(bounds.width),
          height: Math.floor(bounds.height)
        }, true); // true = animate
        
        return { success: true };
      } catch (error) {
        console.error('Failed to set window bounds:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Window not found' };
  });
  
  // Minimize launcher window
  ipcMain.handle('platform:minimize-launcher', async () => {
    if (platform.launcherWindow) {
      platform.launcherWindow.minimize();
      return { success: true };
    }
    return { success: false };
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
  
  // Window grouping handlers
  ipcMain.on('group:switch-tab', (event, groupId, appId) => {
    switchTab(groupId, appId);
  });
  
  ipcMain.on('group:ungroup-window', (event, groupId, appId) => {
    ungroupWindow(groupId, appId);
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
