import { ipcMain, BrowserWindow, Menu, MenuItem } from 'electron';
import { WindowManager } from './WindowManager';

/**
 * IPC Handler for Window Management
 * Handles IPC communication between renderer and main process for window management
 */
export class WindowManagementIPCHandler {
  private windowManager: WindowManager;
  
  constructor(windowManager: WindowManager) {
    this.windowManager = windowManager;
  }
  
  /**
   * Initialize IPC handlers
   */
  async initialize(): Promise<void> {
    this.registerHandlers();
    console.log('WindowManagementIPCHandler initialized');
  }
  
  /**
   * Shutdown IPC handlers
   */
  async shutdown(): Promise<void> {
    this.unregisterHandlers();
  }
  
  /**
   * Register all IPC handlers
   */
  private registerHandlers(): void {
    // Context menu
    ipcMain.handle('window:showContextMenu', async (event) => {
      const window = BrowserWindow.fromWebContents(event.sender);
      if (window) {
        this.showContextMenu(window);
      }
    });
    
    // Grouping
    ipcMain.handle('window:createGroup', async (_event, windowIds: string[]) => {
      return await this.windowManager.createWindowGroup(windowIds);
    });
    
    ipcMain.handle('window:addToGroup', async (_event, windowId: string, groupId: string) => {
      return await this.windowManager.addToGroup(windowId, groupId);
    });
    
    ipcMain.handle('window:removeFromGroup', async (_event, windowId: string) => {
      return await this.windowManager.removeFromGroup(windowId);
    });
    
    ipcMain.handle('window:getWindowGroup', async (_event, windowId: string) => {
      return this.windowManager.getWindowGroup(windowId);
    });
    
    ipcMain.handle('window:listGroups', async () => {
      return this.windowManager.listGroups();
    });
    
    // Docking
    ipcMain.handle('window:dock', async (_event, windowId: string, zone: any) => {
      return await this.windowManager.dockWindowToZone(windowId, zone);
    });
    
    ipcMain.handle('window:undock', async (_event, windowId: string) => {
      return await this.windowManager.undockWindow(windowId);
    });
    
    ipcMain.handle('window:getDockZones', async () => {
      return this.windowManager.getDockZones();
    });
    
    // Snapping
    ipcMain.handle('window:enableSnapping', async (_event, enabled: boolean) => {
      this.windowManager.enableSnapping(enabled);
    });
    
    ipcMain.handle('window:isSnappingEnabled', async () => {
      return this.windowManager.isSnappingEnabled();
    });
    
    // List windows
    ipcMain.handle('window:listWindows', async () => {
      const windows = this.windowManager.listWindows();
      return windows.map(w => ({
        id: w.id,
        title: w.browserWindow.getTitle(),
        bounds: w.bounds,
        state: w.state
      }));
    });
    
    // Forward window management events to renderer
    this.setupEventForwarding();
  }
  
  /**
   * Unregister all IPC handlers
   */
  private unregisterHandlers(): void {
    ipcMain.removeHandler('window:showContextMenu');
    ipcMain.removeHandler('window:createGroup');
    ipcMain.removeHandler('window:addToGroup');
    ipcMain.removeHandler('window:removeFromGroup');
    ipcMain.removeHandler('window:getWindowGroup');
    ipcMain.removeHandler('window:listGroups');
    ipcMain.removeHandler('window:dock');
    ipcMain.removeHandler('window:undock');
    ipcMain.removeHandler('window:getDockZones');
    ipcMain.removeHandler('window:enableSnapping');
    ipcMain.removeHandler('window:isSnappingEnabled');
    ipcMain.removeHandler('window:listWindows');
  }
  
  /**
   * Setup event forwarding from WindowManager to renderer processes
   */
  private setupEventForwarding(): void {
    const events = [
      'window-grouped',
      'window-ungrouped',
      'window-docked',
      'window-undocked',
      'window-snapped',
      'group-moved',
      'group-resized',
      'tab-switched',
      'drag-started',
      'drag-ended'
    ];
    
    for (const event of events) {
      this.windowManager.on(event, (data: any) => {
        // Send to all windows
        const windows = this.windowManager.listWindows();
        for (const window of windows) {
          if (!window.browserWindow.isDestroyed()) {
            window.browserWindow.webContents.send(`window:${event}`, data);
          }
        }
      });
    }
  }
  
  /**
   * Show context menu for a window
   */
  private showContextMenu(browserWindow: BrowserWindow): void {
    // Find window ID
    const windows = this.windowManager.listWindows();
    const windowInstance = windows.find(w => w.browserWindow === browserWindow);
    
    if (!windowInstance) {
      return;
    }
    
    const windowId = windowInstance.id;
    const menu = this.buildContextMenu(windowId);
    menu.popup({ window: browserWindow });
  }
  
  /**
   * Build context menu for a window
   */
  private buildContextMenu(windowId: string): Menu {
    const menu = new Menu();
    
    // Check if window is in a group
    const group = this.windowManager.getWindowGroup(windowId);
    const isGrouped = group !== null;
    
    // Check if window is docked
    const isDocked = this.windowManager.isWindowDocked(windowId);
    
    // Group with... submenu
    if (!isGrouped) {
      const groupSubmenu = this.buildGroupWithSubmenu(windowId);
      menu.append(new MenuItem({
        label: 'Group with...',
        submenu: groupSubmenu,
        enabled: groupSubmenu.items.length > 0
      }));
    }
    
    // Ungroup option (only if grouped)
    if (isGrouped) {
      menu.append(new MenuItem({
        label: 'Ungroup',
        click: async () => {
          await this.windowManager.removeFromGroup(windowId);
        }
      }));
    }
    
    menu.append(new MenuItem({ type: 'separator' }));
    
    // Dock to... submenu
    const dockSubmenu = this.buildDockToSubmenu(windowId);
    menu.append(new MenuItem({
      label: 'Dock to...',
      submenu: dockSubmenu
    }));
    
    // Undock option (only if docked)
    if (isDocked) {
      menu.append(new MenuItem({
        label: 'Undock',
        click: async () => {
          await this.windowManager.undockWindow(windowId);
        }
      }));
    }
    
    menu.append(new MenuItem({ type: 'separator' }));
    
    // Snapping toggle
    const isSnappingEnabled = this.windowManager.isSnappingEnabled();
    menu.append(new MenuItem({
      label: 'Enable Snapping',
      type: 'checkbox',
      checked: isSnappingEnabled,
      click: () => {
        this.windowManager.enableSnapping(!isSnappingEnabled);
      }
    }));
    
    return menu;
  }
  
  /**
   * Build "Group with..." submenu
   */
  private buildGroupWithSubmenu(windowId: string): Menu {
    const submenu = new Menu();
    const allWindows = this.windowManager.listWindows();
    
    // Filter out current window and already grouped windows
    const availableWindows = allWindows.filter(w => {
      if (w.id === windowId) return false;
      const group = this.windowManager.getWindowGroup(w.id);
      return group === null;
    });
    
    if (availableWindows.length === 0) {
      submenu.append(new MenuItem({
        label: 'No available windows',
        enabled: false
      }));
      return submenu;
    }
    
    // Add menu item for each available window
    for (const window of availableWindows) {
      const title = window.browserWindow.getTitle() || `Window ${window.id}`;
      submenu.append(new MenuItem({
        label: title,
        click: async () => {
          await this.windowManager.createWindowGroup([windowId, window.id]);
        }
      }));
    }
    
    return submenu;
  }
  
  /**
   * Build "Dock to..." submenu
   */
  private buildDockToSubmenu(windowId: string): Menu {
    const submenu = new Menu();
    const dockZones = this.windowManager.getDockZones();
    
    // Group zones by type
    const edgeZones = dockZones.filter(z => z.type === 'edge');
    const cornerZones = dockZones.filter(z => z.type === 'corner');
    
    // Add edge zones
    if (edgeZones.length > 0) {
      for (const zone of edgeZones) {
        const label = this.getZoneLabel(zone);
        submenu.append(new MenuItem({
          label,
          click: async () => {
            await this.windowManager.dockWindowToZone(windowId, zone);
          }
        }));
      }
    }
    
    // Add separator
    if (edgeZones.length > 0 && cornerZones.length > 0) {
      submenu.append(new MenuItem({ type: 'separator' }));
    }
    
    // Add corner zones
    if (cornerZones.length > 0) {
      for (const zone of cornerZones) {
        const label = this.getZoneLabel(zone);
        submenu.append(new MenuItem({
          label,
          click: async () => {
            await this.windowManager.dockWindowToZone(windowId, zone);
          }
        }));
      }
    }
    
    return submenu;
  }
  
  /**
   * Get human-readable label for a dock zone
   */
  private getZoneLabel(zone: any): string {
    if (zone.edge) {
      const edgeLabels: Record<string, string> = {
        'left': 'Left Half',
        'right': 'Right Half',
        'top': 'Top Half',
        'bottom': 'Bottom Half'
      };
      return edgeLabels[zone.edge] || zone.edge;
    }
    
    if (zone.corner) {
      const cornerLabels: Record<string, string> = {
        'top-left': 'Top Left Quarter',
        'top-right': 'Top Right Quarter',
        'bottom-left': 'Bottom Left Quarter',
        'bottom-right': 'Bottom Right Quarter'
      };
      return cornerLabels[zone.corner] || zone.corner;
    }
    
    return zone.id;
  }
}
