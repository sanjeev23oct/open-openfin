import { BrowserWindow, Menu, MenuItem } from 'electron';
import { EventEmitter } from 'events';
import { WindowManager } from './WindowManager';
import { DockZone } from '@desktop-interop/sdk';

/**
 * Window Context Menu Service
 * Provides right-click context menu for window management operations
 */
export class WindowContextMenuService extends EventEmitter {
  private windowManager: WindowManager;
  
  constructor(windowManager: WindowManager) {
    super();
    this.windowManager = windowManager;
  }
  
  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    console.log('WindowContextMenuService initialized');
  }
  
  /**
   * Shutdown the service
   */
  async shutdown(): Promise<void> {
    // Cleanup if needed
  }
  
  /**
   * Register context menu for a window
   */
  registerWindow(windowId: string, browserWindow: BrowserWindow): void {
    // Listen for right-click on title bar
    browserWindow.webContents.on('context-menu', (event, params) => {
      // Only show menu if clicking on frame/title bar area
      // In Electron, we can't perfectly detect title bar clicks, so we show for all right-clicks
      this.showContextMenu(windowId, browserWindow);
    });
  }
  
  /**
   * Show context menu for a window
   */
  private showContextMenu(windowId: string, browserWindow: BrowserWindow): void {
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
          this.emit('window-ungrouped', { windowId });
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
          this.emit('window-undocked', { windowId });
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
        this.emit('snapping-toggled', { enabled: !isSnappingEnabled });
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
      return group === null; // Only show ungrouped windows
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
          // Create a new group with both windows
          const group = await this.windowManager.createWindowGroup([windowId, window.id]);
          this.emit('windows-grouped', { windowIds: [windowId, window.id], groupId: group.id });
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
            this.emit('window-docked', { windowId, zone });
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
            this.emit('window-docked', { windowId, zone });
          }
        }));
      }
    }
    
    return submenu;
  }
  
  /**
   * Get human-readable label for a dock zone
   */
  private getZoneLabel(zone: DockZone): string {
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
