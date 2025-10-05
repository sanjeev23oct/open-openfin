import { EventEmitter } from 'events';
import { screen } from 'electron';
import { 
  OverlayConfig,
  Bounds,
  WindowManagementError,
  WindowManagementErrorCode
} from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { DockZoneOverlay } from './DockZoneOverlay';
import { OverlayWindow } from './OverlayWindow';

/**
 * Overlay Manager - manages visual feedback overlays
 */
export class OverlayManager extends EventEmitter implements IService {
  private dockZoneOverlays: Map<string, DockZoneOverlay> = new Map();
  private snapPreviewOverlay: OverlayWindow | null = null;
  private groupDropZoneOverlays: Map<string, OverlayWindow> = new Map();
  private config: OverlayConfig;
  private initialized: boolean = false;
  
  constructor() {
    super();
    
    // Default configuration
    this.config = {
      dockZoneColor: 'rgba(0, 120, 215, 0.3)',
      dockZoneActiveColor: 'rgba(0, 120, 215, 0.6)',
      snapPreviewColor: 'rgba(0, 120, 215, 0.4)',
      groupDropZoneColor: 'rgba(0, 180, 120, 0.4)',
      borderWidth: 2,
      borderRadius: 4,
      animationDuration: 150
    };
  }
  
  async initialize(): Promise<void> {
    console.log('OverlayManager initialized');
    this.initialized = true;
  }
  
  async shutdown(): Promise<void> {
    // Destroy all overlays
    this.hideAllOverlays();
    
    this.dockZoneOverlays.forEach(overlay => overlay.destroy());
    this.dockZoneOverlays.clear();
    
    if (this.snapPreviewOverlay) {
      this.snapPreviewOverlay.destroy();
      this.snapPreviewOverlay = null;
    }
    
    this.groupDropZoneOverlays.forEach(overlay => overlay.destroy());
    this.groupDropZoneOverlays.clear();
    
    this.initialized = false;
  }
  
  /**
   * Set overlay configuration
   */
  setOverlayConfig(config: Partial<OverlayConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update existing overlays with new colors
    this.dockZoneOverlays.forEach(overlay => {
      overlay.setColor(this.config.dockZoneColor);
    });
    
    if (this.snapPreviewOverlay) {
      this.snapPreviewOverlay.setColor(this.config.snapPreviewColor);
    }
    
    console.log('Updated overlay configuration');
  }
  
  /**
   * Get current overlay configuration
   */
  getOverlayConfig(): OverlayConfig {
    return { ...this.config };
  }
  
  /**
   * Show dock zones for a specific monitor
   */
  showDockZones(monitor?: number): void {
    if (!this.initialized) {
      console.warn('OverlayManager not initialized');
      return;
    }
    
    // Show all dock zone overlays
    this.dockZoneOverlays.forEach((overlay, zoneId) => {
      const zone = overlay.getZone();
      
      // Filter by monitor if specified
      if (monitor === undefined || zone.monitor === monitor) {
        overlay.show();
      }
    });
    
    this.emit('dock-zones-shown', { monitor });
    console.log(`Showed dock zones${monitor !== undefined ? ` for monitor ${monitor}` : ''}`);
  }
  
  /**
   * Hide all dock zones
   */
  hideDockZones(): void {
    this.dockZoneOverlays.forEach(overlay => {
      overlay.unhighlight();
      overlay.hide();
    });
    
    this.emit('dock-zones-hidden');
    console.log('Hid dock zones');
  }
  
  /**
   * Highlight a specific dock zone
   */
  highlightDockZone(zoneId: string): void {
    // Unhighlight all zones first
    this.dockZoneOverlays.forEach(overlay => overlay.unhighlight());
    
    // Highlight the specified zone
    const overlay = this.dockZoneOverlays.get(zoneId);
    
    if (overlay) {
      overlay.highlight();
      this.emit('dock-zone-highlighted', { zoneId });
    }
  }
  
  /**
   * Unhighlight all dock zones
   */
  unhighlightAllDockZones(): void {
    this.dockZoneOverlays.forEach(overlay => overlay.unhighlight());
    this.emit('dock-zones-unhighlighted');
  }
  
  /**
   * Create or update dock zone overlays
   */
  updateDockZoneOverlays(zones: Map<number, any[]>): void {
    // Clear existing overlays
    this.dockZoneOverlays.forEach(overlay => overlay.destroy());
    this.dockZoneOverlays.clear();
    
    // Create new overlays for each zone
    zones.forEach((monitorZones) => {
      monitorZones.forEach(zone => {
        try {
          const overlay = new DockZoneOverlay(
            zone,
            this.config.dockZoneColor,
            this.config.dockZoneActiveColor
          );
          
          this.dockZoneOverlays.set(zone.id, overlay);
        } catch (error) {
          console.error(`Failed to create dock zone overlay for ${zone.id}:`, error);
        }
      });
    });
    
    console.log(`Created ${this.dockZoneOverlays.size} dock zone overlays`);
  }
  
  /**
   * Show snap preview at specified bounds
   */
  showSnapPreview(bounds: Bounds): void {
    if (!this.initialized) {
      console.warn('OverlayManager not initialized');
      return;
    }
    
    if (!this.snapPreviewOverlay) {
      this.snapPreviewOverlay = new OverlayWindow(this.config.snapPreviewColor);
    }
    
    this.snapPreviewOverlay.setBounds(bounds);
    this.snapPreviewOverlay.show();
    
    this.emit('snap-preview-shown', { bounds });
  }
  
  /**
   * Hide snap preview
   */
  hideSnapPreview(): void {
    if (this.snapPreviewOverlay) {
      this.snapPreviewOverlay.hide();
      this.emit('snap-preview-hidden');
    }
  }
  
  /**
   * Update snap preview bounds
   */
  updateSnapPreview(bounds: Bounds): void {
    if (this.snapPreviewOverlay) {
      this.snapPreviewOverlay.setBounds(bounds);
    } else {
      this.showSnapPreview(bounds);
    }
  }
  
  /**
   * Show group drop zone for a specific group
   */
  showGroupDropZone(groupId: string, bounds: Bounds): void {
    if (!this.initialized) {
      console.warn('OverlayManager not initialized');
      return;
    }
    
    let overlay = this.groupDropZoneOverlays.get(groupId);
    
    if (!overlay) {
      overlay = new OverlayWindow(this.config.groupDropZoneColor);
      this.groupDropZoneOverlays.set(groupId, overlay);
    }
    
    overlay.setBounds(bounds);
    overlay.show();
    
    this.emit('group-drop-zone-shown', { groupId, bounds });
  }
  
  /**
   * Hide group drop zone
   */
  hideGroupDropZone(groupId: string): void {
    const overlay = this.groupDropZoneOverlays.get(groupId);
    
    if (overlay) {
      overlay.hide();
      this.emit('group-drop-zone-hidden', { groupId });
    }
  }
  
  /**
   * Hide all group drop zones
   */
  hideAllGroupDropZones(): void {
    this.groupDropZoneOverlays.forEach((overlay, groupId) => {
      overlay.hide();
    });
    
    this.emit('all-group-drop-zones-hidden');
  }
  
  /**
   * Hide all overlays
   */
  hideAllOverlays(): void {
    this.hideDockZones();
    this.hideSnapPreview();
    this.hideAllGroupDropZones();
    
    this.emit('all-overlays-hidden');
    console.log('Hid all overlays');
  }
  
  /**
   * Get dock zone overlay by zone ID
   */
  getDockZoneOverlay(zoneId: string): DockZoneOverlay | undefined {
    return this.dockZoneOverlays.get(zoneId);
  }
  
  /**
   * Check if any overlays are visible
   */
  hasVisibleOverlays(): boolean {
    // Check dock zones
    for (const overlay of this.dockZoneOverlays.values()) {
      if (overlay.isVisible()) {
        return true;
      }
    }
    
    // Check snap preview
    if (this.snapPreviewOverlay && this.snapPreviewOverlay.isVisible()) {
      return true;
    }
    
    // Check group drop zones
    for (const overlay of this.groupDropZoneOverlays.values()) {
      if (overlay.isVisible()) {
        return true;
      }
    }
    
    return false;
  }
}
