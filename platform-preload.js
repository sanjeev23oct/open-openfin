const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script for platform launcher UI
 */

contextBridge.exposeInMainWorld('platform', {
  // Launch an application from manifest file
  launchApp: async (manifestPath, appId) => {
    return ipcRenderer.invoke('platform:launch-app', manifestPath, appId);
  },
  
  // Launch an application with inline manifest (for external apps)
  launchAppWithManifest: async (appId, manifest) => {
    return ipcRenderer.invoke('platform:launch-app-with-manifest', appId, manifest);
  },
  
  // Get running applications
  getRunningApps: async () => {
    return ipcRenderer.invoke('platform:get-running-apps');
  },
  
  // Close an application
  closeApp: async (appId) => {
    return ipcRenderer.invoke('platform:close-app', appId);
  },
  
  // Focus an application
  focusApp: async (appId) => {
    return ipcRenderer.invoke('platform:focus-app', appId);
  },
  
  // Set window bounds (position and size)
  setWindowBounds: async (appId, bounds) => {
    return ipcRenderer.invoke('platform:set-window-bounds', appId, bounds);
  },
  
  // Minimize launcher window
  minimizeLauncher: async () => {
    return ipcRenderer.invoke('platform:minimize-launcher');
  },
  
  // Get channel information
  getChannelInfo: async (channelId) => {
    return ipcRenderer.invoke('platform:get-channel-info', channelId);
  },
  
  // Listen for app events
  onAppLaunched: (callback) => {
    ipcRenderer.on('app-launched', (_event, data) => callback(data));
  },
  
  onAppClosed: (callback) => {
    ipcRenderer.on('app-closed', (_event, appId) => callback(appId));
  }
});
