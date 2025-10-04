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

// Simple fin API for identity
contextBridge.exposeInMainWorld('fin', {
  me: {
    uuid: 'app-uuid',
    name: 'app-name'
  }
});
