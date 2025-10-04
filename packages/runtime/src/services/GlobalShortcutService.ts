import { globalShortcut } from 'electron';
import { IService } from './ServiceRegistry';

/**
 * Shortcut handler
 */
export type ShortcutHandler = () => void;

/**
 * Registered shortcut
 */
export interface RegisteredShortcut {
  id: string;
  accelerator: string;
  appId: string;
  description?: string;
  handler: ShortcutHandler;
}

/**
 * Global Keyboard Shortcut Service
 * Manages global keyboard shortcuts with conflict detection
 */
export class GlobalShortcutService implements IService {
  private shortcuts: Map<string, RegisteredShortcut> = new Map();
  private acceleratorMap: Map<string, string> = new Map(); // accelerator -> shortcutId
  
  async initialize(): Promise<void> {
    console.log('GlobalShortcutService initialized');
  }
  
  async shutdown(): Promise<void> {
    // Unregister all shortcuts
    globalShortcut.unregisterAll();
    this.shortcuts.clear();
    this.acceleratorMap.clear();
  }
  
  /**
   * Register a global shortcut
   */
  async registerShortcut(
    appId: string,
    accelerator: string,
    handler: ShortcutHandler,
    description?: string
  ): Promise<string> {
    // Check for conflicts
    if (this.acceleratorMap.has(accelerator)) {
      const existingId = this.acceleratorMap.get(accelerator)!;
      const existing = this.shortcuts.get(existingId);
      throw new Error(
        `Shortcut conflict: ${accelerator} is already registered by ${existing?.appId}`
      );
    }
    
    // Validate accelerator
    if (!this.isValidAccelerator(accelerator)) {
      throw new Error(`Invalid accelerator: ${accelerator}`);
    }
    
    // Generate shortcut ID
    const shortcutId = this.generateShortcutId();
    
    // Register with Electron
    const success = globalShortcut.register(accelerator, () => {
      try {
        handler();
      } catch (error) {
        console.error(`Error executing shortcut ${accelerator}:`, error);
      }
    });
    
    if (!success) {
      throw new Error(`Failed to register shortcut: ${accelerator}`);
    }
    
    // Store shortcut
    const shortcut: RegisteredShortcut = {
      id: shortcutId,
      accelerator,
      appId,
      description,
      handler
    };
    
    this.shortcuts.set(shortcutId, shortcut);
    this.acceleratorMap.set(accelerator, shortcutId);
    
    return shortcutId;
  }
  
  /**
   * Unregister a shortcut
   */
  async unregisterShortcut(shortcutId: string): Promise<void> {
    const shortcut = this.shortcuts.get(shortcutId);
    
    if (!shortcut) {
      throw new Error(`Shortcut not found: ${shortcutId}`);
    }
    
    // Unregister from Electron
    globalShortcut.unregister(shortcut.accelerator);
    
    // Remove from maps
    this.shortcuts.delete(shortcutId);
    this.acceleratorMap.delete(shortcut.accelerator);
  }
  
  /**
   * Unregister all shortcuts for an application
   */
  async unregisterApplicationShortcuts(appId: string): Promise<void> {
    const appShortcuts = Array.from(this.shortcuts.values())
      .filter(s => s.appId === appId);
    
    for (const shortcut of appShortcuts) {
      await this.unregisterShortcut(shortcut.id);
    }
  }
  
  /**
   * Check if a shortcut is registered
   */
  isShortcutRegistered(accelerator: string): boolean {
    return this.acceleratorMap.has(accelerator);
  }
  
  /**
   * Get all registered shortcuts
   */
  getRegisteredShortcuts(): RegisteredShortcut[] {
    return Array.from(this.shortcuts.values());
  }
  
  /**
   * Get shortcuts for an application
   */
  getApplicationShortcuts(appId: string): RegisteredShortcut[] {
    return Array.from(this.shortcuts.values())
      .filter(s => s.appId === appId);
  }
  
  /**
   * Get shortcut by ID
   */
  getShortcut(shortcutId: string): RegisteredShortcut | undefined {
    return this.shortcuts.get(shortcutId);
  }
  
  /**
   * Check for shortcut conflicts
   */
  checkConflict(accelerator: string): RegisteredShortcut | null {
    const shortcutId = this.acceleratorMap.get(accelerator);
    if (shortcutId) {
      return this.shortcuts.get(shortcutId) || null;
    }
    return null;
  }
  
  /**
   * Validate accelerator format
   */
  private isValidAccelerator(accelerator: string): boolean {
    // Basic validation - Electron will do more thorough validation
    const validModifiers = ['Command', 'Cmd', 'Control', 'Ctrl', 'CommandOrControl', 'CmdOrCtrl', 'Alt', 'Option', 'AltGr', 'Shift', 'Super', 'Meta'];
    const parts = accelerator.split('+');
    
    if (parts.length === 0) {
      return false;
    }
    
    // Last part should be a key
    const key = parts[parts.length - 1];
    if (!key || key.length === 0) {
      return false;
    }
    
    // Check modifiers
    for (let i = 0; i < parts.length - 1; i++) {
      if (!validModifiers.includes(parts[i])) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate unique shortcut ID
   */
  private generateShortcutId(): string {
    return `shortcut-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Get common shortcuts for reference
   */
  static getCommonShortcuts(): { [key: string]: string } {
    return {
      'Show/Hide': 'CommandOrControl+Shift+Space',
      'New Window': 'CommandOrControl+N',
      'Close Window': 'CommandOrControl+W',
      'Quit': 'CommandOrControl+Q',
      'Reload': 'CommandOrControl+R',
      'DevTools': 'CommandOrControl+Shift+I',
      'Zoom In': 'CommandOrControl+Plus',
      'Zoom Out': 'CommandOrControl+-',
      'Reset Zoom': 'CommandOrControl+0'
    };
  }
}
