import { BrowserWindow } from 'electron';
import { Bounds } from '@desktop-interop/sdk';
import * as path from 'path';

/**
 * Base Overlay Window - transparent window for visual feedback
 */
export class OverlayWindow {
  protected window: BrowserWindow | null = null;
  protected color: string;
  protected visible: boolean = false;
  
  constructor(color: string = 'rgba(0, 120, 215, 0.3)') {
    this.color = color;
  }
  
  /**
   * Create the overlay window
   */
  protected createWindow(bounds: Bounds): void {
    if (this.window && !this.window.isDestroyed()) {
      return;
    }
    
    this.window = new BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      closable: false,
      skipTaskbar: true,
      show: false,
      focusable: false,
      hasShadow: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.join(__dirname, 'overlay-preload.js')
      }
    });
    
    // Enable click-through
    this.window.setIgnoreMouseEvents(true);
    
    // Load overlay HTML
    this.window.loadFile(path.join(__dirname, '../ui/overlay.html'));
    
    // Set up ready handler
    this.window.webContents.once('did-finish-load', () => {
      this.updateColor(this.color);
    });
    
    // Clean up on close
    this.window.on('closed', () => {
      this.window = null;
      this.visible = false;
    });
  }
  
  /**
   * Show the overlay
   */
  show(): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    
    if (!this.visible) {
      this.window.showInactive();
      this.visible = true;
      
      // Fade in animation
      this.window.webContents.send('overlay:fade-in');
    }
  }
  
  /**
   * Hide the overlay
   */
  hide(): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    
    if (this.visible) {
      // Fade out animation
      this.window.webContents.send('overlay:fade-out');
      
      // Hide after animation
      setTimeout(() => {
        if (this.window && !this.window.isDestroyed()) {
          this.window.hide();
        }
        this.visible = false;
      }, 150);
    }
  }
  
  /**
   * Set overlay bounds
   */
  setBounds(bounds: Bounds): void {
    if (!this.window) {
      this.createWindow(bounds);
    } else if (!this.window.isDestroyed()) {
      this.window.setBounds({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      });
    }
  }
  
  /**
   * Set overlay color
   */
  setColor(color: string): void {
    this.color = color;
    this.updateColor(color);
  }
  
  /**
   * Update color in renderer
   */
  private updateColor(color: string): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('overlay:set-color', color);
    }
  }
  
  /**
   * Destroy the overlay
   */
  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.window = null;
    this.visible = false;
  }
  
  /**
   * Check if overlay is destroyed
   */
  isDestroyed(): boolean {
    return !this.window || this.window.isDestroyed();
  }
  
  /**
   * Check if overlay is visible
   */
  isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * Get overlay bounds
   */
  getBounds(): Bounds | null {
    if (this.window && !this.window.isDestroyed()) {
      const bounds = this.window.getBounds();
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        left: bounds.x,
        top: bounds.y,
        right: bounds.x + bounds.width,
        bottom: bounds.y + bounds.height
      };
    }
    return null;
  }
}
