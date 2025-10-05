import { OverlayWindow } from './OverlayWindow';
import { DockZone, Bounds } from '@desktop-interop/sdk';

/**
 * Dock Zone Overlay - visual overlay for dock zones
 */
export class DockZoneOverlay extends OverlayWindow {
  private zone: DockZone;
  private isHighlighted: boolean = false;
  private normalColor: string;
  private highlightColor: string;
  
  constructor(
    zone: DockZone,
    normalColor: string = 'rgba(0, 120, 215, 0.3)',
    highlightColor: string = 'rgba(0, 120, 215, 0.6)'
  ) {
    super(normalColor);
    this.zone = zone;
    this.normalColor = normalColor;
    this.highlightColor = highlightColor;
    
    // Create window with zone bounds
    this.createWindow(zone.bounds);
  }
  
  /**
   * Get the dock zone
   */
  getZone(): DockZone {
    return this.zone;
  }
  
  /**
   * Highlight the overlay
   */
  highlight(): void {
    if (!this.isHighlighted) {
      this.isHighlighted = true;
      this.setColor(this.highlightColor);
      
      // Send highlight event to renderer
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('overlay:highlight');
      }
    }
  }
  
  /**
   * Remove highlight
   */
  unhighlight(): void {
    if (this.isHighlighted) {
      this.isHighlighted = false;
      this.setColor(this.normalColor);
      
      // Send unhighlight event to renderer
      if (this.window && !this.window.isDestroyed()) {
        this.window.webContents.send('overlay:unhighlight');
      }
    }
  }
  
  /**
   * Check if highlighted
   */
  isHighlightActive(): boolean {
    return this.isHighlighted;
  }
  
  /**
   * Update zone bounds
   */
  updateZone(zone: DockZone): void {
    this.zone = zone;
    this.setBounds(zone.bounds);
  }
}
