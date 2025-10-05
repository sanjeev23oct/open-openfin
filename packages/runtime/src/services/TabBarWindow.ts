import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';

/**
 * Tab information for rendering
 */
export interface TabInfo {
  windowId: string;
  title: string;
  icon?: string;
  isActive: boolean;
}

/**
 * Tab Bar Window - displays tabs for grouped windows
 */
export class TabBarWindow extends EventEmitter {
  private window: BrowserWindow | null = null;
  private groupId: string;
  private tabs: TabInfo[] = [];
  private readonly TAB_BAR_HEIGHT = 32;
  
  constructor(groupId: string, x: number, y: number, width: number) {
    super();
    this.groupId = groupId;
    this.createWindow(x, y, width);
  }
  
  /**
   * Create the tab bar window
   */
  private createWindow(x: number, y: number, width: number): void {
    this.window = new BrowserWindow({
      x,
      y,
      width,
      height: this.TAB_BAR_HEIGHT,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      skipTaskbar: true,
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'tab-bar-preload.js')
      }
    });
    
    // Load tab bar HTML
    this.window.loadFile(path.join(__dirname, '../ui/tab-bar.html'));
    
    // Set up IPC handlers for tab interactions
    this.setupIpcHandlers();
    
    // Show window once ready
    this.window.once('ready-to-show', () => {
      this.window?.show();
    });
    
    // Clean up on close
    this.window.on('closed', () => {
      this.window = null;
      this.emit('closed');
    });
  }
  
  /**
   * Set up IPC handlers for tab interactions
   */
  private setupIpcHandlers(): void {
    if (!this.window) return;
    
    const { ipcMain } = require('electron');
    
    // Handle tab click
    ipcMain.on('tab-bar:tab-click', (event: any, windowId: string) => {
      if (event.sender === this.window?.webContents) {
        this.emit('tab-click', windowId);
      }
    });
    
    // Handle tab close
    ipcMain.on('tab-bar:tab-close', (event: any, windowId: string) => {
      if (event.sender === this.window?.webContents) {
        this.emit('tab-close', windowId);
      }
    });
    
    // Handle tab drag start
    ipcMain.on('tab-bar:tab-drag-start', (event: any, windowId: string) => {
      if (event.sender === this.window?.webContents) {
        this.emit('tab-drag-start', windowId);
      }
    });
    
    // Handle tab drag end
    ipcMain.on('tab-bar:tab-drag-end', (event: any, data: { windowId: string; x: number; y: number }) => {
      if (event.sender === this.window?.webContents) {
        this.emit('tab-drag-end', data);
      }
    });
    
    // Handle tab reorder
    ipcMain.on('tab-bar:tab-reorder', (event: any, windowIds: string[]) => {
      if (event.sender === this.window?.webContents) {
        this.emit('tab-reorder', windowIds);
      }
    });
  }
  
  /**
   * Update tabs
   */
  updateTabs(tabs: TabInfo[]): void {
    this.tabs = tabs;
    this.render();
  }
  
  /**
   * Add a tab
   */
  addTab(tab: TabInfo): void {
    this.tabs.push(tab);
    this.render();
  }
  
  /**
   * Remove a tab
   */
  removeTab(windowId: string): void {
    this.tabs = this.tabs.filter(tab => tab.windowId !== windowId);
    this.render();
  }
  
  /**
   * Set active tab
   */
  setActiveTab(windowId: string): void {
    this.tabs.forEach(tab => {
      tab.isActive = tab.windowId === windowId;
    });
    this.render();
  }
  
  /**
   * Render tabs
   */
  private render(): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    
    // Send tab data to renderer
    this.window.webContents.send('tab-bar:update', {
      groupId: this.groupId,
      tabs: this.tabs
    });
  }
  
  /**
   * Move tab bar
   */
  move(x: number, y: number): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.setBounds({ x, y, width: this.window.getBounds().width, height: this.TAB_BAR_HEIGHT });
    }
  }
  
  /**
   * Resize tab bar
   */
  resize(width: number): void {
    if (this.window && !this.window.isDestroyed()) {
      const bounds = this.window.getBounds();
      this.window.setBounds({ x: bounds.x, y: bounds.y, width, height: this.TAB_BAR_HEIGHT });
    }
  }
  
  /**
   * Show tab bar
   */
  show(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.show();
    }
  }
  
  /**
   * Hide tab bar
   */
  hide(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.hide();
    }
  }
  
  /**
   * Minimize tab bar
   */
  minimize(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.minimize();
    }
  }
  
  /**
   * Restore tab bar
   */
  restore(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.restore();
    }
  }
  
  /**
   * Close tab bar
   */
  close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }
  
  /**
   * Get tab bar bounds
   */
  getBounds(): { x: number; y: number; width: number; height: number } | null {
    if (this.window && !this.window.isDestroyed()) {
      return this.window.getBounds();
    }
    return null;
  }
  
  /**
   * Check if tab bar is destroyed
   */
  isDestroyed(): boolean {
    return !this.window || this.window.isDestroyed();
  }
}
