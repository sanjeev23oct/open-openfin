import { BrowserWindow } from 'electron';
import { WindowOptions, WindowState, Bounds, DockEdge, WindowGroup } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';

/**
 * Window instance with enhanced capabilities
 */
export interface WindowInstance {
  id: string;
  browserWindow: BrowserWindow;
  options: WindowOptions;
  state: WindowState;
  bounds: Bounds;
  monitor: number;
  group?: WindowGroup;
}

/**
 * Window Manager - manages windows with grouping and docking
 */
export class WindowManager implements IService {
  private windows: Map<string, WindowInstance> = new Map();
  private groups: Map<string, WindowGroup> = new Map();
  
  async initialize(): Promise<void> {
    console.log('WindowManager initialized');
  }
  
  async shutdown(): Promise<void> {
    // Close all windows
    for (const window of this.windows.values()) {
      if (!window.browserWindow.isDestroyed()) {
        window.browserWindow.close();
      }
    }
    this.windows.clear();
    this.groups.clear();
  }
  
  /**
   * Create a new window
   */
  async createWindow(options: WindowOptions): Promise<WindowInstance> {
    const windowId = this.generateWindowId();
    
    const browserWindow = new BrowserWindow({
      width: options.width || 800,
      height: options.height || 600,
      x: options.x,
      y: options.y,
      frame: options.frame !== false,
      resizable: options.resizable !== false,
      maximizable: options.maximizable !== false,
      minimizable: options.minimizable !== false,
      show: options.autoShow !== false,
      title: options.title,
      backgroundColor: options.backgroundColor,
      alwaysOnTop: options.alwaysOnTop,
      webPreferences: {
        contextIsolation: options.contextIsolation !== false,
        nodeIntegration: options.nodeIntegration || false,
        sandbox: true,
        preload: options.preload
      }
    });
    
    // Get bounds
    const bounds = browserWindow.getBounds();
    
    // Create window instance
    const instance: WindowInstance = {
      id: windowId,
      browserWindow,
      options,
      state: 'normal',
      bounds: {
        ...bounds,
        top: bounds.y,
        left: bounds.x,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height
      },
      monitor: 0 // TODO: Detect actual monitor
    };
    
    this.windows.set(windowId, instance);
    
    // Set up event handlers
    this.setupWindowEvents(instance);
    
    // Load URL
    if (options.url) {
      await browserWindow.loadURL(options.url);
    }
    
    return instance;
  }
  
  /**
   * Close a window
   */
  async closeWindow(windowId: string): Promise<void> {
    const instance = this.windows.get(windowId);
    
    if (!instance) {
      return;
    }
    
    if (!instance.browserWindow.isDestroyed()) {
      instance.browserWindow.close();
    }
    
    this.windows.delete(windowId);
  }
  
  /**
   * Get window by ID
   */
  getWindow(windowId: string): WindowInstance | null {
    return this.windows.get(windowId) || null;
  }
  
  /**
   * List all windows
   */
  listWindows(): WindowInstance[] {
    return Array.from(this.windows.values());
  }
  
  /**
   * Group windows together
   */
  groupWindows(windowIds: string[]): WindowGroup {
    const groupId = this.generateGroupId();
    
    const group: WindowGroup = {
      id: groupId,
      windows: windowIds,
      leader: windowIds[0]
    };
    
    this.groups.set(groupId, group);
    
    // Assign group to windows
    for (const windowId of windowIds) {
      const window = this.windows.get(windowId);
      if (window) {
        window.group = group;
      }
    }
    
    return group;
  }
  
  /**
   * Dock window to edge
   */
  dockWindow(windowId: string, edge: DockEdge): void {
    const window = this.windows.get(windowId);
    
    if (!window) {
      return;
    }
    
    const display = require('electron').screen.getPrimaryDisplay();
    const { width, height } = display.workAreaSize;
    
    let bounds: { x: number; y: number; width: number; height: number };
    
    switch (edge) {
      case 'left':
        bounds = { x: 0, y: 0, width: width / 2, height };
        break;
      case 'right':
        bounds = { x: width / 2, y: 0, width: width / 2, height };
        break;
      case 'top':
        bounds = { x: 0, y: 0, width, height: height / 2 };
        break;
      case 'bottom':
        bounds = { x: 0, y: height / 2, width, height: height / 2 };
        break;
    }
    
    window.browserWindow.setBounds(bounds);
    window.bounds = {
      ...bounds,
      top: bounds.y,
      left: bounds.x,
      right: bounds.x + bounds.width,
      bottom: bounds.y + bounds.height
    };
  }
  
  /**
   * Set up window event handlers
   */
  private setupWindowEvents(instance: WindowInstance): void {
    const { browserWindow } = instance;
    
    browserWindow.on('moved', () => {
      const bounds = browserWindow.getBounds();
      instance.bounds = {
        ...bounds,
        top: bounds.y,
        left: bounds.x,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height
      };
    });
    
    browserWindow.on('resized', () => {
      const bounds = browserWindow.getBounds();
      instance.bounds = {
        ...bounds,
        top: bounds.y,
        left: bounds.x,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height
      };
    });
    
    browserWindow.on('minimize', () => {
      instance.state = 'minimized';
    });
    
    browserWindow.on('maximize', () => {
      instance.state = 'maximized';
    });
    
    browserWindow.on('restore', () => {
      instance.state = 'normal';
    });
    
    browserWindow.on('closed', () => {
      this.windows.delete(instance.id);
    });
  }
  
  /**
   * Generate unique window ID
   */
  private generateWindowId(): string {
    return `window-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique group ID
   */
  private generateGroupId(): string {
    return `group-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
