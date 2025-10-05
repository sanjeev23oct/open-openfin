import { EventEmitter } from 'events';
import { screen } from 'electron';
import { 
  DockZone, 
  DockZoneConfig, 
  DockedWindow,
  CustomDockZone,
  WindowManagementError,
  WindowManagementErrorCode,
  Bounds,
  Point
} from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { WindowInstance } from './WindowManager';

// Import DockStateStore
import { DockStateStore } from './DockStateStore';
import { OverlayManager } from './OverlayManager';

/**
 * Docking Manager - manages window docking to screen edges and corners
 */
export class DockingManager extends EventEmitter implements IService {
  private dockedWindows: Map<string, DockedWindow> = new Map();
  private dockZones: Map<number, DockZone[]> = new Map(); // Monitor -> zones
  private activeDragWindow: string | null = null;
  private activeZone: DockZone | null = null;
  private stateStore: DockStateStore;
  private config: DockZoneConfig;
  private overlayManager: OverlayManager | null = null;
  
  constructor(overlayManager?: OverlayManager) {
    super();
    this.overlayManager = overlayManager || null;
    super();
    this.stateStore = new DockStateStore();
    
    // Default configuration
    this.config = {
      edgeThreshold: 20,
      cornerSize: 100,
      showOverlays: true,
      animationDuration: 200,
      customZones: []
    };
  }
  
  async initialize(): Promise<void> {
    console.log('DockingManager initialized');
    
    // Initialize dock zones for all monitors
    this.updateDockZones();
    
    // Update overlay manager with dock zones
    if (this.overlayManager && this.config.showOverlays) {
      this.overlayManager.updateDockZoneOverlays(this.dockZones);
    }
    
    // Listen for display changes
    screen.on('display-added', () => this.updateDockZones());
    screen.on('display-removed', () => this.updateDockZones());
    screen.on('display-metrics-changed', () => this.updateDockZones());
    
    // Load saved docking state
    try {
      const savedDocked = await this.stateStore.load();
      
      for (const docked of savedDocked) {
        this.dockedWindows.set(docked.windowId, docked);
      }
      
      console.log(`Restored ${savedDocked.length} docked windows from saved state`);
    } catch (error) {
      console.error('Failed to load saved docking state:', error);
    }
  }
  
  async shutdown(): Promise<void> {
    // Save docking state before shutdown
    try {
      await this.saveState();
    } catch (error) {
      console.error('Failed to save docking state on shutdown:', error);
    }
    
    // Clean up
    this.dockedWindows.clear();
    this.dockZones.clear();
  }
  
  /**
   * Update dock zones for all monitors
   */
  private updateDockZones(): void {
    this.dockZones.clear();
    
    const displays = screen.getAllDisplays();
    
    displays.forEach((display, index) => {
      const zones = this.createDockZonesForDisplay(display, index);
      this.dockZones.set(index, zones);
    });
    
    // Update overlay manager with new zones
    if (this.overlayManager && this.config.showOverlays) {
      this.overlayManager.updateDockZoneOverlays(this.dockZones);
    }
    
    console.log(`Updated dock zones for ${displays.length} monitors`);
  }
  
  /**
   * Create dock zones for a specific display
   */
  private createDockZonesForDisplay(display: Electron.Display, monitorIndex: number): DockZone[] {
    const zones: DockZone[] = [];
    const { x, y, width, height } = display.workArea;
    const { cornerSize } = this.config;
    
    // Left edge
    zones.push({
      id: `monitor-${monitorIndex}-left`,
      type: 'edge',
      edge: 'left',
      bounds: {
        x,
        y: y + cornerSize,
        width: this.config.edgeThreshold,
        height: height - (cornerSize * 2),
        left: x,
        top: y + cornerSize,
        right: x + this.config.edgeThreshold,
        bottom: y + height - cornerSize
      },
      targetBounds: {
        x,
        y,
        width: width / 2,
        height,
        left: x,
        top: y,
        right: x + width / 2,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 1
    });
    
    // Right edge
    zones.push({
      id: `monitor-${monitorIndex}-right`,
      type: 'edge',
      edge: 'right',
      bounds: {
        x: x + width - this.config.edgeThreshold,
        y: y + cornerSize,
        width: this.config.edgeThreshold,
        height: height - (cornerSize * 2),
        left: x + width - this.config.edgeThreshold,
        top: y + cornerSize,
        right: x + width,
        bottom: y + height - cornerSize
      },
      targetBounds: {
        x: x + width / 2,
        y,
        width: width / 2,
        height,
        left: x + width / 2,
        top: y,
        right: x + width,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 1
    });
    
    // Top edge (maximize)
    zones.push({
      id: `monitor-${monitorIndex}-top`,
      type: 'edge',
      edge: 'top',
      bounds: {
        x: x + cornerSize,
        y,
        width: width - (cornerSize * 2),
        height: this.config.edgeThreshold,
        left: x + cornerSize,
        top: y,
        right: x + width - cornerSize,
        bottom: y + this.config.edgeThreshold
      },
      targetBounds: {
        x,
        y,
        width,
        height,
        left: x,
        top: y,
        right: x + width,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 1
    });
    
    // Bottom edge
    zones.push({
      id: `monitor-${monitorIndex}-bottom`,
      type: 'edge',
      edge: 'bottom',
      bounds: {
        x: x + cornerSize,
        y: y + height - this.config.edgeThreshold,
        width: width - (cornerSize * 2),
        height: this.config.edgeThreshold,
        left: x + cornerSize,
        top: y + height - this.config.edgeThreshold,
        right: x + width - cornerSize,
        bottom: y + height
      },
      targetBounds: {
        x,
        y: y + height / 2,
        width,
        height: height / 2,
        left: x,
        top: y + height / 2,
        right: x + width,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 1
    });
    
    // Top-left corner
    zones.push({
      id: `monitor-${monitorIndex}-top-left`,
      type: 'corner',
      corner: 'top-left',
      bounds: {
        x,
        y,
        width: cornerSize,
        height: cornerSize,
        left: x,
        top: y,
        right: x + cornerSize,
        bottom: y + cornerSize
      },
      targetBounds: {
        x,
        y,
        width: width / 2,
        height: height / 2,
        left: x,
        top: y,
        right: x + width / 2,
        bottom: y + height / 2
      },
      monitor: monitorIndex,
      priority: 2
    });
    
    // Top-right corner
    zones.push({
      id: `monitor-${monitorIndex}-top-right`,
      type: 'corner',
      corner: 'top-right',
      bounds: {
        x: x + width - cornerSize,
        y,
        width: cornerSize,
        height: cornerSize,
        left: x + width - cornerSize,
        top: y,
        right: x + width,
        bottom: y + cornerSize
      },
      targetBounds: {
        x: x + width / 2,
        y,
        width: width / 2,
        height: height / 2,
        left: x + width / 2,
        top: y,
        right: x + width,
        bottom: y + height / 2
      },
      monitor: monitorIndex,
      priority: 2
    });
    
    // Bottom-left corner
    zones.push({
      id: `monitor-${monitorIndex}-bottom-left`,
      type: 'corner',
      corner: 'bottom-left',
      bounds: {
        x,
        y: y + height - cornerSize,
        width: cornerSize,
        height: cornerSize,
        left: x,
        top: y + height - cornerSize,
        right: x + cornerSize,
        bottom: y + height
      },
      targetBounds: {
        x,
        y: y + height / 2,
        width: width / 2,
        height: height / 2,
        left: x,
        top: y + height / 2,
        right: x + width / 2,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 2
    });
    
    // Bottom-right corner
    zones.push({
      id: `monitor-${monitorIndex}-bottom-right`,
      type: 'corner',
      corner: 'bottom-right',
      bounds: {
        x: x + width - cornerSize,
        y: y + height - cornerSize,
        width: cornerSize,
        height: cornerSize,
        left: x + width - cornerSize,
        top: y + height - cornerSize,
        right: x + width,
        bottom: y + height
      },
      targetBounds: {
        x: x + width / 2,
        y: y + height / 2,
        width: width / 2,
        height: height / 2,
        left: x + width / 2,
        top: y + height / 2,
        right: x + width,
        bottom: y + height
      },
      monitor: monitorIndex,
      priority: 2
    });
    
    // Add custom zones if configured
    if (this.config.customZones) {
      this.config.customZones
        .filter(zone => zone.monitor === monitorIndex)
        .forEach(customZone => {
          zones.push({
            id: customZone.id,
            type: 'custom',
            bounds: customZone.bounds,
            targetBounds: customZone.targetBounds,
            monitor: monitorIndex,
            priority: 3
          });
        });
    }
    
    return zones;
  }
  
  /**
   * Get dock zones for a specific monitor
   */
  getDockZones(monitor?: number): DockZone[] {
    if (monitor !== undefined) {
      return this.dockZones.get(monitor) || [];
    }
    
    // Return all zones from all monitors
    const allZones: DockZone[] = [];
    this.dockZones.forEach(zones => allZones.push(...zones));
    return allZones;
  }
  
  /**
   * Get dock zones for all monitors
   */
  getAllDockZones(): Map<number, DockZone[]> {
    return new Map(this.dockZones);
  }
  
  /**
   * Set dock zone configuration
   */
  setDockZoneConfig(config: Partial<DockZoneConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateDockZones();
    
    console.log('Updated dock zone configuration');
  }
  
  /**
   * Get current dock zone configuration
   */
  getDockZoneConfig(): DockZoneConfig {
    return { ...this.config };
  }
  
  /**
   * Start drag operation for a window
   */
  startDragOperation(windowId: string): void {
    this.activeDragWindow = windowId;
    this.activeZone = null;
    
    // Show dock zone overlays
    if (this.overlayManager && this.config.showOverlays) {
      this.overlayManager.showDockZones();
    }
    
    // Emit event
    this.emit('drag-started', { windowId });
    
    console.log(`Started drag operation for window ${windowId}`);
  }
  
  /**
   * Update drag position and detect active zone
   */
  updateDragPosition(windowId: string, position: Point): void {
    if (this.activeDragWindow !== windowId) {
      return;
    }
    
    // Find the closest dock zone
    const zone = this.detectDockZone(position);
    
    if (zone !== this.activeZone) {
      const previousZone = this.activeZone;
      this.activeZone = zone;
      
      // Update overlay highlighting
      if (this.overlayManager && this.config.showOverlays) {
        if (zone) {
          this.overlayManager.highlightDockZone(zone.id);
        } else {
          this.overlayManager.unhighlightAllDockZones();
        }
      }
      
      // Emit zone change event
      this.emit('zone-changed', { 
        windowId, 
        zone, 
        previousZone 
      });
    }
  }
  
  /**
   * Detect dock zone at given position
   */
  private detectDockZone(position: Point): DockZone | null {
    let closestZone: DockZone | null = null;
    let closestDistance = Infinity;
    
    // Check all zones from all monitors
    this.dockZones.forEach(zones => {
      zones.forEach(zone => {
        if (this.isPointInBounds(position, zone.bounds)) {
          // Point is inside zone bounds
          const distance = this.calculateDistanceToZoneCenter(position, zone.bounds);
          
          // Prioritize by zone priority, then by distance
          const effectiveDistance = distance / zone.priority;
          
          if (effectiveDistance < closestDistance) {
            closestDistance = effectiveDistance;
            closestZone = zone;
          }
        }
      });
    });
    
    return closestZone;
  }
  
  /**
   * Check if point is within bounds
   */
  private isPointInBounds(point: Point, bounds: Bounds): boolean {
    return point.x >= bounds.left &&
           point.x <= bounds.right &&
           point.y >= bounds.top &&
           point.y <= bounds.bottom;
  }
  
  /**
   * Calculate distance from point to center of bounds
   */
  private calculateDistanceToZoneCenter(point: Point, bounds: Bounds): number {
    const centerX = (bounds.left + bounds.right) / 2;
    const centerY = (bounds.top + bounds.bottom) / 2;
    
    const dx = point.x - centerX;
    const dy = point.y - centerY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Complete docking operation
   */
  async completeDock(windowId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    if (this.activeDragWindow !== windowId || !this.activeZone) {
      // No active zone, cancel docking
      this.cancelDock(windowId);
      return;
    }
    
    const windowInstance = windowInstances.get(windowId);
    
    if (!windowInstance) {
      throw new WindowManagementError(
        `Window ${windowId} not found`,
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'docking',
        true
      );
    }
    
    const zone = this.activeZone;
    
    // Save original bounds for undocking
    const originalBounds = windowInstance.browserWindow.getBounds();
    
    // Apply docking with animation
    await this.applyDocking(windowInstance, zone, originalBounds);
    
    // Store docked state
    const dockedWindow: DockedWindow = {
      windowId,
      zone,
      originalBounds: {
        ...originalBounds,
        left: originalBounds.x,
        top: originalBounds.y,
        right: originalBounds.x + originalBounds.width,
        bottom: originalBounds.y + originalBounds.height
      },
      dockedAt: new Date()
    };
    
    this.dockedWindows.set(windowId, dockedWindow);
    
    // Clear drag state
    this.activeDragWindow = null;
    this.activeZone = null;
    
    // Hide dock zone overlays
    if (this.overlayManager && this.config.showOverlays) {
      this.overlayManager.hideDockZones();
    }
    
    // Emit event
    this.emit('window-docked', { windowId, zone });
    
    console.log(`Docked window ${windowId} to ${zone.edge || zone.corner}`);
  }
  
  /**
   * Apply docking to window with animation
   */
  private async applyDocking(
    windowInstance: WindowInstance,
    zone: DockZone,
    originalBounds: { x: number; y: number; width: number; height: number }
  ): Promise<void> {
    const { browserWindow } = windowInstance;
    const targetBounds = zone.targetBounds;
    
    if (this.config.animationDuration > 0) {
      // Animate to target bounds
      await this.animateWindowBounds(
        browserWindow,
        originalBounds,
        {
          x: targetBounds.x,
          y: targetBounds.y,
          width: targetBounds.width,
          height: targetBounds.height
        },
        this.config.animationDuration
      );
    } else {
      // Instant docking
      browserWindow.setBounds({
        x: targetBounds.x,
        y: targetBounds.y,
        width: targetBounds.width,
        height: targetBounds.height
      });
    }
    
    // Update window instance bounds
    windowInstance.bounds = { ...targetBounds };
  }
  
  /**
   * Animate window bounds
   */
  private async animateWindowBounds(
    browserWindow: Electron.BrowserWindow,
    from: { x: number; y: number; width: number; height: number },
    to: { x: number; y: number; width: number; height: number },
    duration: number
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const steps = Math.ceil(duration / 16); // 60 FPS
      let currentStep = 0;
      
      const animate = () => {
        currentStep++;
        const progress = Math.min(currentStep / steps, 1);
        
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const currentBounds = {
          x: Math.round(from.x + (to.x - from.x) * eased),
          y: Math.round(from.y + (to.y - from.y) * eased),
          width: Math.round(from.width + (to.width - from.width) * eased),
          height: Math.round(from.height + (to.height - from.height) * eased)
        };
        
        if (!browserWindow.isDestroyed()) {
          browserWindow.setBounds(currentBounds);
        }
        
        if (progress < 1 && !browserWindow.isDestroyed()) {
          setTimeout(animate, 16);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }
  
  /**
   * Cancel docking operation
   */
  cancelDock(windowId: string): void {
    if (this.activeDragWindow === windowId) {
      this.activeDragWindow = null;
      this.activeZone = null;
      
      // Hide dock zone overlays
      if (this.overlayManager && this.config.showOverlays) {
        this.overlayManager.hideDockZones();
      }
      
      // Emit event
      this.emit('drag-cancelled', { windowId });
      
      console.log(`Cancelled dock operation for window ${windowId}`);
    }
  }
  
  /**
   * Undock a window
   */
  async undockWindow(windowId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    const dockedWindow = this.dockedWindows.get(windowId);
    
    if (!dockedWindow) {
      // Window is not docked
      return;
    }
    
    const windowInstance = windowInstances.get(windowId);
    
    if (!windowInstance) {
      // Window doesn't exist, clean up state
      this.dockedWindows.delete(windowId);
      return;
    }
    
    // Restore original bounds with animation
    const currentBounds = windowInstance.browserWindow.getBounds();
    const targetBounds = dockedWindow.originalBounds;
    
    if (this.config.animationDuration > 0) {
      await this.animateWindowBounds(
        windowInstance.browserWindow,
        currentBounds,
        {
          x: targetBounds.x,
          y: targetBounds.y,
          width: targetBounds.width,
          height: targetBounds.height
        },
        this.config.animationDuration
      );
    } else {
      windowInstance.browserWindow.setBounds({
        x: targetBounds.x,
        y: targetBounds.y,
        width: targetBounds.width,
        height: targetBounds.height
      });
    }
    
    // Update window instance bounds
    windowInstance.bounds = { ...targetBounds };
    
    // Remove from docked windows
    this.dockedWindows.delete(windowId);
    
    // Emit event
    this.emit('window-undocked', { windowId });
    
    console.log(`Undocked window ${windowId}`);
  }
  
  /**
   * Get docked window state
   */
  getDockedWindow(windowId: string): DockedWindow | null {
    return this.dockedWindows.get(windowId) || null;
  }
  
  /**
   * Get all docked windows
   */
  getDockedWindows(): DockedWindow[] {
    return Array.from(this.dockedWindows.values());
  }
  
  /**
   * Check if window is docked
   */
  isWindowDocked(windowId: string): boolean {
    return this.dockedWindows.has(windowId);
  }
  
  /**
   * Get active dock zone during drag
   */
  getActiveZone(): DockZone | null {
    return this.activeZone;
  }
  
  /**
   * Save current docking state to disk
   */
  async saveState(): Promise<void> {
    const docked = Array.from(this.dockedWindows.values());
    await this.stateStore.save(docked);
  }
  
  /**
   * Load docking state from disk
   */
  async loadState(): Promise<DockedWindow[]> {
    return await this.stateStore.load();
  }
  
  /**
   * Clear saved docking state
   */
  async clearState(): Promise<void> {
    await this.stateStore.clear();
  }
}
