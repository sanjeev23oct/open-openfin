import { contextBridge, ipcRenderer } from 'electron';

/**
 * Preload script - exposes safe APIs to renderer process
 */

// Simple FDC3 API for testing
contextBridge.exposeInMainWorld('fdc3', {
  broadcast: async (context: any) => {
    return ipcRenderer.invoke('fdc3:broadcast', context);
  },
  
  addContextListener: (contextType: string | null, handler: (context: any) => void) => {
    const channel = `fdc3:context:${contextType || '*'}`;
    ipcRenderer.on(channel, (_event, context) => handler(context));
    
    return {
      unsubscribe: () => {
        ipcRenderer.removeAllListeners(channel);
      }
    };
  },
  
  raiseIntent: async (intent: string, context: any, target?: string) => {
    return ipcRenderer.invoke('fdc3:raiseIntent', intent, context, target);
  },
  
  addIntentListener: (intent: string, handler: (context: any) => any) => {
    const channel = `fdc3:intent:${intent}`;
    ipcRenderer.on(channel, async (_event, context) => {
      const result = await handler(context);
      ipcRenderer.send(`${channel}:response`, result);
    });
    
    return {
      unsubscribe: () => {
        ipcRenderer.removeAllListeners(channel);
      }
    };
  },
  
  joinUserChannel: async (channelId: string) => {
    return ipcRenderer.invoke('fdc3:joinChannel', channelId);
  },
  
  getCurrentChannel: async () => {
    return ipcRenderer.invoke('fdc3:getCurrentChannel');
  }
});

// Window Management API
contextBridge.exposeInMainWorld('windowManagement', {
  // Show context menu
  showContextMenu: async () => {
    return ipcRenderer.invoke('window:showContextMenu');
  },
  
  // Grouping
  createGroup: async (windowIds: string[]) => {
    return ipcRenderer.invoke('window:createGroup', windowIds);
  },
  
  addToGroup: async (windowId: string, groupId: string) => {
    return ipcRenderer.invoke('window:addToGroup', windowId, groupId);
  },
  
  removeFromGroup: async (windowId: string) => {
    return ipcRenderer.invoke('window:removeFromGroup', windowId);
  },
  
  getWindowGroup: async (windowId: string) => {
    return ipcRenderer.invoke('window:getWindowGroup', windowId);
  },
  
  listGroups: async () => {
    return ipcRenderer.invoke('window:listGroups');
  },
  
  // Docking
  dockWindow: async (windowId: string, zone: any) => {
    return ipcRenderer.invoke('window:dock', windowId, zone);
  },
  
  undockWindow: async (windowId: string) => {
    return ipcRenderer.invoke('window:undock', windowId);
  },
  
  getDockZones: async () => {
    return ipcRenderer.invoke('window:getDockZones');
  },
  
  // Snapping
  enableSnapping: async (enabled: boolean) => {
    return ipcRenderer.invoke('window:enableSnapping', enabled);
  },
  
  isSnappingEnabled: async () => {
    return ipcRenderer.invoke('window:isSnappingEnabled');
  },
  
  // List windows
  listWindows: async () => {
    return ipcRenderer.invoke('window:listWindows');
  },
  
  // Events
  on: (event: string, handler: (data: any) => void) => {
    ipcRenderer.on(`window:${event}`, (_event, data) => handler(data));
  },
  
  off: (event: string) => {
    ipcRenderer.removeAllListeners(`window:${event}`);
  }
});

// Simple fin API for identity
contextBridge.exposeInMainWorld('fin', {
  me: {
    uuid: 'app-uuid',
    name: 'app-name'
  }
});
