import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { 
  WindowOptions, 
  WindowState, 
  Bounds, 
  DockEdge, 
  WindowGroup,
  DockZone,
  SnapTarget,
  Point,
  Size,
  WindowManagementEvent
} from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { WindowGroupManager } from './WindowGroupManager';
import { DockingManager } from './DockingManager';
import { SnappingManager } from './SnappingManager';
import { OverlayManager } from './OverlayManager';
import { DragDetectionService } from './DragDetectionService';
import { WindowContextMenuService } from './WindowContextMenuService';
import { WindowManagementIPCHandler } from './WindowManagementIPCHandler';

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
 * Window Manager - manages windows with advanced grouping, docking, and snapping
 */
export class WindowManager extends EventEmitter implements IService {
  private windows: Map<string, WindowInstance> = new Map();
  private groups: Map<string, WindowGroup> = new Map();
  
  // Advanced window management managers
  private groupManager: WindowGroupManager;
  private dockingManager: DockingManager;
  private snappingManager: SnappingManager;
  private overlayManager: OverlayManager;
  private dragDetection: DragDetectionService;
  private contextMenuService: WindowContextMenuService;
  private ipcHandler: WindowManagementIPCHandler;
  
  constructor() {
    super();
    
    // Initialize managers
    this.overlayManager = new OverlayManager();
    this.groupManager = new WindowGroupManager();
    this.dockingManager = new DockingManager(this.overlayManager);
    this.snappingManager = new SnappingManager();
    this.dragDetection = new DragDetectionService();
    this.contextMenuService = new WindowContextMenuService(this);
    this.ipcHandler = new WindowManagementIPCHandler(this);
    
    // Set up event forwarding
    this.setupEventForwarding();
    this.setupDragDetection();
    this.setupContextMenuEvents();
  }
  
  async initialize(): Promise<void> {
    console.log('WindowManager initialized');
    
    // Initialize all managers
    await this.overlayManager.initialize();
    await this.groupManager.initialize();
    await this.dockingManager.initialize();
    await this.snappingManager.initialize();
    await this.dragDetection.initialize();
    await this.contextMenuService.initialize();
    await this.ipcHandler.initialize();
  }
  
  async shutdown(): Promise<void> {
    // Shutdown all managers
    await this.ipcHandler.shutdown();
    await this.contextMenuService.shutdown();
    await this.dragDetection.shutdown();
    await this.snappingManager.shutdown();
    await this.dockingManager.shutdown();
    await this.groupManager.shutdown();
    await this.overlayManager.shutdown();
    
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
   * Set up event forwarding from managers
   */
  private setupEventForwarding(): void {
    // Forward group manager events
    this.groupManager.on('group-created', (data) => this.emit('window-grouped', data));
    this.groupManager.on('window-grouped', (data) => this.emit('window-grouped', data));
    this.groupManager.on('window-ungrouped', (data) => this.emit('window-ungrouped', data));
    this.groupManager.on('tab-switched', (data) => this.emit('tab-switched', data));
    this.groupManager.on('group-moved', (data) => this.emit('group-moved', data));
    this.groupManager.on('group-resized', (data) => this.emit('group-resized', data));
    
    // Forward docking manager events
    this.dockingManager.on('window-docked', (data) => this.emit('window-docked', data));
    this.dockingManager.on('window-undocked', (data) => this.emit('window-undocked', data));
    this.dockingManager.on('drag-started', (data) => this.emit('drag-started', data));
    this.dockingManager.on('drag-cancelled', (data) => this.emit('drag-ended', data));
    
    // Forward snapping manager events
    this.snappingManager.on('window-snapped', (data) => this.emit('window-snapped', data));
    this.snappingManager.on('drag-started', (data) => this.emit('drag-started', data));
    this.snappingManager.on('snap-cancelled', (data) => this.emit('drag-ended', data));
  }
  
  /**
   * Set up automatic drag detection
   */
  private setupDragDetection(): void {
    // Handle drag start
    this.dragDetection.on('drag-start', (data: any) => {
      const { windowId } = data;
      
      // Start drag operations on all managers
      this.dockingManager.startDragOperation(windowId);
      this.snappingManager.startDragOperation(windowId);
      
      // Show dock zone overlays
      this.overlayManager.showDockZones();
      
      this.emit('drag-started', { windowId });
    });
    
    // Handle drag update
    this.dragDetection.on('drag-update', (data: any) => {
      const { windowId, position, size, bounds } = data;
      
      // Get window instance for size if not provided
      const windowInstance = this.windows.get(windowId);
      const windowSize = size || (windowInstance ? {
        width: windowInstance.bounds.width,
        height: windowInstance.bounds.height
      } : { width: 800, height: 600 });
      
      // Update docking manager
      this.dockingManager.updateDragPosition(windowId, position);
      
      // Update snapping manager
      this.snappingManager.updateDragPosition(windowId, position, windowSize);
      
      // Update overlays
      const dockZone = this.dockingManager.getActiveZone();
      if (dockZone) {
        this.overlayManager.highlightDockZone(dockZone.id);
      }
      
      const snapTarget = this.snappingManager.getActiveSnapTarget();
      if (snapTarget) {
        this.overlayManager.showSnapPreview(snapTarget.targetBounds);
      } else {
        this.overlayManager.hideSnapPreview();
      }
    });
    
    // Handle drag end
    this.dragDetection.on('drag-end', async (data: any) => {
      const { windowId } = data;
      
      // Complete drag operation
      await this.completeDragOperation(windowId, true);
      
      // Hide overlays
      this.overlayManager.hideDockZones();
      this.overlayManager.hideSnapPreview();
    });
  }
  
  /**
   * Set up context menu event forwarding
   */
  private setupContextMenuEvents(): void {
    // Forward context menu events
    this.contextMenuService.on('windows-grouped', (data) => this.emit('window-grouped', data));
    this.contextMenuService.on('window-ungrouped', (data) => this.emit('window-ungrouped', data));
    this.contextMenuService.on('window-docked', (data) => this.emit('window-docked', data));
    this.contextMenuService.on('window-undocked', (data) => this.emit('window-undocked', data));
    this.contextMenuService.on('snapping-toggled', (data) => {
      console.log(`Snapping ${data.enabled ? 'enabled' : 'disabled'}`);
    });
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
    
    // Register with drag detection
    this.dragDetection.registerWindow(windowId, browserWindow);
    
    // Register with context menu service
    this.contextMenuService.registerWindow(windowId, browserWindow);
    
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
      activeWindow: windowIds[0],
      bounds: { x: 0, y: 0, width: 0, height: 0, left: 0, top: 0, right: 0, bottom: 0 },
      state: 'normal',
      monitor: 0,
      createdAt: new Date()
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
    
    // Mark as programmatic move
    this.dragDetection.markProgrammaticMove(windowId);
    
    window.browserWindow.setBounds(bounds);
    window.bounds = {
      ...bounds,
      top: bounds.y,
      left: bounds.x,
      right: bounds.x + bounds.width,
      bottom: bounds.y + bounds.height
    };
  }
  
  // ==================== Window Grouping Methods ====================
  
  /**
   * Create a window group
   */
  async createWindowGroup(windowIds: string[]): Promise<WindowGroup> {
    return await this.groupManager.createGroup(windowIds, this.windows);
  }
  
  /**
   * Add window to group
   */
  async addToGroup(windowId: string, groupId: string): Promise<void> {
    await this.groupManager.addWindowToGroup(windowId, groupId, this.windows);
  }
  
  /**
   * Remove window from group
   */
  async removeFromGroup(windowId: string): Promise<void> {
    await this.groupManager.removeWindowFromGroup(windowId);
  }
  
  /**
   * Get window's group
   */
  getWindowGroup(windowId: string): WindowGroup | null {
    return this.groupManager.getWindowGroup(windowId);
  }
  
  /**
   * Set active tab in group
   */
  async setActiveTabInGroup(groupId: string, windowId: string): Promise<void> {
    await this.groupManager.setActiveWindow(groupId, windowId);
  }
  
  /**
   * List all groups
   */
  listGroups(): WindowGroup[] {
    return this.groupManager.listGroups();
  }
  
  // ==================== Window Docking Methods ====================
  
  /**
   * Dock window to zone
   */
  async dockWindowToZone(windowId: string, zone: DockZone): Promise<void> {
    // Start drag operation
    this.dockingManager.startDragOperation(windowId);
    
    // Update position to zone
    this.dockingManager.updateDragPosition(windowId, {
      x: zone.bounds.x + zone.bounds.width / 2,
      y: zone.bounds.y + zone.bounds.height / 2
    });
    
    // Complete docking
    await this.dockingManager.completeDock(windowId, this.windows);
  }
  
  /**
   * Undock window
   */
  async undockWindow(windowId: string): Promise<void> {
    await this.dockingManager.undockWindow(windowId, this.windows);
  }
  
  /**
   * Get dock zones
   */
  getDockZones(monitor?: number): DockZone[] {
    return this.dockingManager.getDockZones(monitor);
  }
  
  /**
   * Check if window is docked
   */
  isWindowDocked(windowId: string): boolean {
    return this.dockingManager.isWindowDocked(windowId);
  }
  
  // ==================== Window Snapping Methods ====================
  
  /**
   * Snap window to target
   */
  async snapWindow(windowId: string, target: SnapTarget): Promise<void> {
    const windowInstance = this.windows.get(windowId);
    if (!windowInstance) {
      return;
    }
    
    // Mark as programmatic move
    this.dragDetection.markProgrammaticMove(windowId);
    
    // Apply snap position
    windowInstance.browserWindow.setBounds({
      x: target.targetBounds.x,
      y: target.targetBounds.y,
      width: target.targetBounds.width,
      height: target.targetBounds.height
    });
    
    // Update bounds
    windowInstance.bounds = { ...target.targetBounds };
    
    // Update spatial index
    this.snappingManager.updateWindowInIndex(windowId, target.targetBounds);
    
    this.emit('window-snapped', { windowId, target });
  }
  
  /**
   * Enable/disable snapping
   */
  enableSnapping(enabled: boolean): void {
    this.snappingManager.enableSnapping(enabled);
  }
  
  /**
   * Get snap targets for window
   */
  getSnapTargets(windowId: string): SnapTarget[] {
    const windowInstance = this.windows.get(windowId);
    if (!windowInstance) {
      return [];
    }
    
    return this.snappingManager.detectSnapTargets(windowInstance.bounds, windowId);
  }
  
  /**
   * Check if snapping is enabled
   */
  isSnappingEnabled(): boolean {
    return this.snappingManager.isSnappingEnabled();
  }
  
  // ==================== Drag Operation Coordination ====================
  
  /**
   * Start drag operation (coordinates all managers)
   */
  startDragOperation(windowId: string): void {
    this.dockingManager.startDragOperation(windowId);
    this.snappingManager.startDragOperation(windowId);
    this.emit('drag-started', { windowId });
  }
  
  /**
   * Update drag position (coordinates all managers)
   */
  updateDragPosition(windowId: string, position: Point, size: Size): void {
    // Update docking manager
    this.dockingManager.updateDragPosition(windowId, position);
    
    // Update snapping manager
    this.snappingManager.updateDragPosition(windowId, position, size);
    
    // Update snap preview overlay
    const snapTarget = this.snappingManager.getActiveSnapTarget();
    if (snapTarget && this.overlayManager) {
      this.overlayManager.showSnapPreview(snapTarget.targetBounds);
    } else if (this.overlayManager) {
      this.overlayManager.hideSnapPreview();
    }
  }
  
  /**
   * Complete drag operation (coordinates all managers)
   */
  async completeDragOperation(windowId: string, preferDocking: boolean = false): Promise<void> {
    const dockZone = this.dockingManager.getActiveZone();
    const snapTarget = this.snappingManager.getActiveSnapTarget();
    
    if (preferDocking && dockZone) {
      // Complete docking
      await this.dockingManager.completeDock(windowId, this.windows);
      this.snappingManager.cancelSnap(windowId);
    } else if (snapTarget) {
      // Complete snapping
      await this.snappingManager.completeSnap(windowId, this.windows);
      this.dockingManager.cancelDock(windowId);
    } else {
      // Cancel both
      this.dockingManager.cancelDock(windowId);
      this.snappingManager.cancelSnap(windowId);
    }
    
    this.emit('drag-ended', { windowId });
  }
  
  /**
   * Cancel drag operation
   */
  cancelDragOperation(windowId: string): void {
    this.dockingManager.cancelDock(windowId);
    this.snappingManager.cancelSnap(windowId);
    this.emit('drag-ended', { windowId });
  }
  
  // ==================== Window Lifecycle Integration ====================
  
  /**
   * Update spatial index when window moves
   */
  private updateWindowPosition(windowId: string, bounds: Bounds): void {
    this.snappingManager.updateWindowInIndex(windowId, bounds);
  }
  
  /**
   * Remove window from all managers
   */
  private removeWindowFromManagers(windowId: string): void {
    this.snappingManager.removeWindowFromIndex(windowId);
    this.groupManager.removeWindowFromGroup(windowId);
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
      
      // Update spatial index
      this.updateWindowPosition(instance.id, instance.bounds);
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
      
      // Update spatial index
      this.updateWindowPosition(instance.id, instance.bounds);
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
      this.removeWindowFromManagers(instance.id);
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
