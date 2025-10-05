const { contextBridge, ipcRenderer } = require('electron');

/**
 * Test preload script - exposes FDC3 API to sample apps
 */

contextBridge.exposeInMainWorld('fdc3', {
  broadcast: async (context) => {
    return ipcRenderer.invoke('fdc3:broadcast', context);
  },
  
  addContextListener: (contextType, handler) => {
    const channel = `fdc3:context:${contextType || '*'}`;
    ipcRenderer.on(channel, (_event, context) => handler(context));
    
    return {
      unsubscribe: () => {
        ipcRenderer.removeAllListeners(channel);
      }
    };
  },
  
  raiseIntent: async (intent, context, target) => {
    return ipcRenderer.invoke('fdc3:raiseIntent', intent, context, target);
  },
  
  addIntentListener: (intent, handler) => {
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
  
  joinUserChannel: async (channelId) => {
    return ipcRenderer.invoke('fdc3:joinChannel', channelId);
  },
  
  getCurrentChannel: async () => {
    return ipcRenderer.invoke('fdc3:getCurrentChannel');
  }
});

contextBridge.exposeInMainWorld('fin', {
  me: {
    uuid: 'test-app',
    name: 'Test Application'
  }
});
