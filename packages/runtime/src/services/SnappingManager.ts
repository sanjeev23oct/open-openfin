import { EventEmitter } from 'events';
import { screen } from 'electron';
import {
  SnapConfig,
  SnapTarget,
  SnapRelationship,
  Bounds,
  Point,
  Size,
  WindowManagementError,
  WindowManagementErrorCode
} from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { WindowInstance } from './WindowManager';
import { SpatialIndex } from './SpatialIndex';

/**
 * Snapping Manager - manages window snapping to edges, windows, and grid
 */
export class SnappingManager extends EventEmitter implements IService {
  private config: SnapConfig;
  private spatialIndex: SpatialIndex;
  private snapRelationships: Map<string, SnapRelationship> = new Map();
  private activeDragWindow: string | null = null;
  private activeSnapTarget: SnapTarget | null = null;
  private enabled: boolean = true;
  
  constructor() {
    super();
    
    // Default configuration
    this.config = {
      enabled: true,
      snapDistance: 10,
      snapToEdges: true,
      snapToWindows: true,
      snapToGrid: false,
      gridSize: 50,
      showPreview: true,
      animationDuration: 150,
      maintainSnapOnResize: true
    };
    
    this.spatialIndex = new SpatialIndex(100);
  }
  
  async initialize(): Promise<void> {
    console.log('SnappingManager initialized');
  }
  
  async shutdown(): Promise<void> {
    this.spatialIndex.clear();
    this.snapRelationships.clear();
  }
  
  /**
   * Set snap configuration
   */
  setSnapConfig(config: Partial<SnapConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update spatial index cell size if grid size changed
    if (config.gridSize) {
      this.spatialIndex = new SpatialIndex(config.gridSize);
    }
    
    console.log('Updated snap configuration');
  }
  
  /**
   * Get current snap configuration
   */
  getSnapConfig(): SnapConfig {
    return { ...this.config };
  }
  
  /**
   * Enable or disable snapping
   */
  enableSnapping(enabled: boolean): void {
    this.enabled = enabled;
    this.config.enabled = enabled;
    
    if (!enabled) {
      this.activeSnapTarget = null;
    }
    
    this.emit('snapping-toggled', { enabled });
    console.log(`Snapping ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Check if snapping is enabled
   */
  isSnappingEnabled(): boolean {
    return this.enabled && this.config.enabled;
  }
  
  /**
   * Update spatial index with window
   */
  updateWindowInIndex(windowId: string, bounds: Bounds): void {
    this.spatialIndex.update(windowId, bounds);
  }
  
  /**
   * Remove window from spatial index
   */
  removeWindowFromIndex(windowId: string): void {
    this.spatialIndex.remove(windowId);
    this.snapRelationships.delete(windowId);
  }
  
  /**
   * Start drag operation
   */
  startDragOperation(windowId: string): void {
    this.activeDragWindow = windowId;
    this.activeSnapTarget = null;
    
    this.emit('drag-started', { windowId });
    console.log(`Started snap drag operation for window ${windowId}`);
  }
  
  /**
   * Update drag position and detect snap targets
   */
  updateDragPosition(windowId: string, position: Point, size: Size): void {
    if (!this.isSnappingEnabled() || this.activeDragWindow !== windowId) {
      return;
    }
    
    const bounds: Bounds = {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      left: position.x,
      top: position.y,
      right: position.x + size.width,
      bottom: position.y + size.height
    };
    
    // Detect snap targets
    const targets = this.detectSnapTargets(bounds, windowId);
    
    // Find closest target
    const closestTarget = this.findClosestTarget(targets);
    
    if (closestTarget !== this.activeSnapTarget) {
      const previousTarget = this.activeSnapTarget;
      this.activeSnapTarget = closestTarget;
      
      this.emit('snap-target-changed', {
        windowId,
        target: closestTarget,
        previousTarget
      });
    }
  }
  
  /**
   * Detect snap targets for given bounds
   */
  detectSnapTargets(bounds: Bounds, excludeWindowId?: string): SnapTarget[] {
    const targets: SnapTarget[] = [];
    
    // Screen edge targets
    if (this.config.snapToEdges) {
      targets.push(...this.detectScreenEdgeTargets(bounds));
    }
    
    // Window edge targets
    if (this.config.snapToWindows) {
      targets.push(...this.detectWindowEdgeTargets(bounds, excludeWindowId));
    }
    
    // Grid targets
    if (this.config.snapToGrid) {
      targets.push(...this.detectGridTargets(bounds));
    }
    
    return targets;
  }
  
  /**
   * Detect screen edge snap targets
   */
  private detectScreenEdgeTargets(bounds: Bounds): SnapTarget[] {
    const targets: SnapTarget[] = [];
    const displays = screen.getAllDisplays();
    
    displays.forEach(display => {
      const { x, y, width, height } = display.workArea;
      
      // Left edge
      const leftDistance = Math.abs(bounds.left - x);
      if (leftDistance <= this.config.snapDistance) {
        targets.push({
          id: `screen-left-${display.id}`,
          type: 'edge',
          position: { x, y: bounds.top },
          alignment: 'left',
          distance: leftDistance,
          targetBounds: {
            x,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            left: x,
            top: bounds.top,
            right: x + bounds.width,
            bottom: bounds.top + bounds.height
          },
          priority: 1
        });
      }
      
      // Right edge
      const rightDistance = Math.abs(bounds.right - (x + width));
      if (rightDistance <= this.config.snapDistance) {
        targets.push({
          id: `screen-right-${display.id}`,
          type: 'edge',
          position: { x: x + width - bounds.width, y: bounds.top },
          alignment: 'right',
          distance: rightDistance,
          targetBounds: {
            x: x + width - bounds.width,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            left: x + width - bounds.width,
            top: bounds.top,
            right: x + width,
            bottom: bounds.top + bounds.height
          },
          priority: 1
        });
      }
      
      // Top edge
      const topDistance = Math.abs(bounds.top - y);
      if (topDistance <= this.config.snapDistance) {
        targets.push({
          id: `screen-top-${display.id}`,
          type: 'edge',
          position: { x: bounds.left, y },
          alignment: 'top',
          distance: topDistance,
          targetBounds: {
            x: bounds.left,
            y,
            width: bounds.width,
            height: bounds.height,
            left: bounds.left,
            top: y,
            right: bounds.left + bounds.width,
            bottom: y + bounds.height
          },
          priority: 1
        });
      }
      
      // Bottom edge
      const bottomDistance = Math.abs(bounds.bottom - (y + height));
      if (bottomDistance <= this.config.snapDistance) {
        targets.push({
          id: `screen-bottom-${display.id}`,
          type: 'edge',
          position: { x: bounds.left, y: y + height - bounds.height },
          alignment: 'bottom',
          distance: bottomDistance,
          targetBounds: {
            x: bounds.left,
            y: y + height - bounds.height,
            width: bounds.width,
            height: bounds.height,
            left: bounds.left,
            top: y + height - bounds.height,
            right: bounds.left + bounds.width,
            bottom: y + height
          },
          priority: 1
        });
      }
    });
    
    return targets;
  }
  
  /**
   * Detect window edge snap targets
   */
  private detectWindowEdgeTargets(bounds: Bounds, excludeWindowId?: string): SnapTarget[] {
    const targets: SnapTarget[] = [];
    
    // Query nearby windows from spatial index
    const nearbyWindowIds = this.spatialIndex.query(bounds, this.config.snapDistance * 2);
    
    nearbyWindowIds.forEach(windowId => {
      if (windowId === excludeWindowId) {
        return;
      }
      
      const windowBounds = this.spatialIndex.getBounds(windowId);
      if (!windowBounds) {
        return;
      }
      
      // Left edge of other window to right edge of dragging window
      const leftDistance = Math.abs(bounds.right - windowBounds.left);
      if (leftDistance <= this.config.snapDistance) {
        targets.push({
          id: `window-${windowId}-left`,
          type: 'window',
          position: { x: windowBounds.left - bounds.width, y: bounds.top },
          alignment: 'left',
          distance: leftDistance,
          targetBounds: {
            x: windowBounds.left - bounds.width,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            left: windowBounds.left - bounds.width,
            top: bounds.top,
            right: windowBounds.left,
            bottom: bounds.top + bounds.height
          },
          priority: 2
        });
      }
      
      // Right edge of other window to left edge of dragging window
      const rightDistance = Math.abs(bounds.left - windowBounds.right);
      if (rightDistance <= this.config.snapDistance) {
        targets.push({
          id: `window-${windowId}-right`,
          type: 'window',
          position: { x: windowBounds.right, y: bounds.top },
          alignment: 'right',
          distance: rightDistance,
          targetBounds: {
            x: windowBounds.right,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
            left: windowBounds.right,
            top: bounds.top,
            right: windowBounds.right + bounds.width,
            bottom: bounds.top + bounds.height
          },
          priority: 2
        });
      }
      
      // Top edge of other window to bottom edge of dragging window
      const topDistance = Math.abs(bounds.bottom - windowBounds.top);
      if (topDistance <= this.config.snapDistance) {
        targets.push({
          id: `window-${windowId}-top`,
          type: 'window',
          position: { x: bounds.left, y: windowBounds.top - bounds.height },
          alignment: 'top',
          distance: topDistance,
          targetBounds: {
            x: bounds.left,
            y: windowBounds.top - bounds.height,
            width: bounds.width,
            height: bounds.height,
            left: bounds.left,
            top: windowBounds.top - bounds.height,
            right: bounds.left + bounds.width,
            bottom: windowBounds.top
          },
          priority: 2
        });
      }
      
      // Bottom edge of other window to top edge of dragging window
      const bottomDistance = Math.abs(bounds.top - windowBounds.bottom);
      if (bottomDistance <= this.config.snapDistance) {
        targets.push({
          id: `window-${windowId}-bottom`,
          type: 'window',
          position: { x: bounds.left, y: windowBounds.bottom },
          alignment: 'bottom',
          distance: bottomDistance,
          targetBounds: {
            x: bounds.left,
            y: windowBounds.bottom,
            width: bounds.width,
            height: bounds.height,
            left: bounds.left,
            top: windowBounds.bottom,
            right: bounds.left + bounds.width,
            bottom: windowBounds.bottom + bounds.height
          },
          priority: 2
        });
      }
    });
    
    return targets;
  }
  
  /**
   * Detect grid snap targets
   */
  private detectGridTargets(bounds: Bounds): SnapTarget[] {
    const targets: SnapTarget[] = [];
    const gridSize = this.config.gridSize;
    
    // Snap to nearest grid position
    const snappedX = Math.round(bounds.left / gridSize) * gridSize;
    const snappedY = Math.round(bounds.top / gridSize) * gridSize;
    
    const distance = Math.sqrt(
      Math.pow(bounds.left - snappedX, 2) +
      Math.pow(bounds.top - snappedY, 2)
    );
    
    if (distance <= this.config.snapDistance) {
      targets.push({
        id: `grid-${snappedX}-${snappedY}`,
        type: 'grid',
        position: { x: snappedX, y: snappedY },
        alignment: 'center',
        distance,
        targetBounds: {
          x: snappedX,
          y: snappedY,
          width: bounds.width,
          height: bounds.height,
          left: snappedX,
          top: snappedY,
          right: snappedX + bounds.width,
          bottom: snappedY + bounds.height
        },
        priority: 3
      });
    }
    
    return targets;
  }
  
  /**
   * Find closest snap target
   */
  private findClosestTarget(targets: SnapTarget[]): SnapTarget | null {
    if (targets.length === 0) {
      return null;
    }
    
    // Sort by priority (lower is better) then by distance
    targets.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.distance - b.distance;
    });
    
    return targets[0];
  }
  
  /**
   * Complete snap operation
   */
  async completeSnap(windowId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    if (!this.activeSnapTarget || this.activeDragWindow !== windowId) {
      this.cancelSnap(windowId);
      return;
    }
    
    const windowInstance = windowInstances.get(windowId);
    if (!windowInstance) {
      throw new WindowManagementError(
        `Window ${windowId} not found`,
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'snapping',
        true
      );
    }
    
    const target = this.activeSnapTarget;
    
    // Apply snap position
    windowInstance.browserWindow.setBounds({
      x: target.targetBounds.x,
      y: target.targetBounds.y,
      width: target.targetBounds.width,
      height: target.targetBounds.height
    });
    
    // Update window instance bounds
    windowInstance.bounds = { ...target.targetBounds };
    
    // Update spatial index
    this.spatialIndex.update(windowId, target.targetBounds);
    
    // Create snap relationship if snapping to window
    if (target.type === 'window' && this.config.maintainSnapOnResize) {
      this.createSnapRelationship(windowId, target);
    }
    
    // Clear drag state
    this.activeDragWindow = null;
    this.activeSnapTarget = null;
    
    // Emit event
    this.emit('window-snapped', { windowId, target });
    
    console.log(`Snapped window ${windowId} to ${target.type}`);
  }
  
  /**
   * Cancel snap operation
   */
  cancelSnap(windowId: string): void {
    if (this.activeDragWindow === windowId) {
      this.activeDragWindow = null;
      this.activeSnapTarget = null;
      
      this.emit('snap-cancelled', { windowId });
      console.log(`Cancelled snap operation for window ${windowId}`);
    }
  }
  
  /**
   * Create snap relationship between windows
   */
  private createSnapRelationship(windowId: string, target: SnapTarget): void {
    // Extract target window ID from target ID
    const match = target.id.match(/^window-([^-]+)-/);
    if (!match) {
      return;
    }
    
    const targetWindowId = match[1];
    
    // Get or create relationship
    let relationship = this.snapRelationships.get(windowId);
    if (!relationship) {
      relationship = {
        windowId,
        snappedTo: [],
        edges: {},
        createdAt: new Date()
      };
      this.snapRelationships.set(windowId, relationship);
    }
    
    // Add to snapped windows
    if (!relationship.snappedTo.includes(targetWindowId)) {
      relationship.snappedTo.push(targetWindowId);
    }
    
    // Set edge relationship (only for valid edge alignments)
    if (target.alignment !== 'center') {
      relationship.edges[target.alignment] = targetWindowId;
    }
    
    console.log(`Created snap relationship: ${windowId} -> ${targetWindowId} (${target.alignment})`);
  }
  
  /**
   * Get snap relationship for a window
   */
  getSnapRelationship(windowId: string): SnapRelationship | null {
    return this.snapRelationships.get(windowId) || null;
  }
  
  /**
   * Remove snap relationship
   */
  removeSnapRelationship(windowId: string): void {
    this.snapRelationships.delete(windowId);
  }
  
  /**
   * Get active snap target
   */
  getActiveSnapTarget(): SnapTarget | null {
    return this.activeSnapTarget;
  }
}
