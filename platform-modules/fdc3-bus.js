/**
 * Simple FDC3 Message Bus
 */

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

module.exports = SimpleFDC3Bus;
