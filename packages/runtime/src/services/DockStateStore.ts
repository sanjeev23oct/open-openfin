import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { DockedWindow } from '@desktop-interop/sdk';

/**
 * Serializable docked window data for persistence
 */
export interface DockedWindowData {
  windowId: string;
  zone: {
    id: string;
    type: 'edge' | 'corner' | 'custom';
    edge?: 'left' | 'right' | 'top' | 'bottom';
    corner?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
      top: number;
      left: number;
      right: number;
      bottom: number;
    };
    targetBounds: {
      x: number;
      y: number;
      width: number;
      height: number;
      top: number;
      left: number;
      right: number;
      bottom: number;
    };
    monitor: number;
    priority: number;
  };
  originalBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  dockedAt: string;
}

/**
 * Dock state storage
 */
export interface DockStateStorage {
  version: string;
  dockedWindows: DockedWindowData[];
  savedAt: string;
}

/**
 * Dock State Store - persists window docking configurations
 */
export class DockStateStore {
  private stateFilePath: string;
  private readonly VERSION = '1.0.0';
  
  constructor() {
    const userDataPath = app.getPath('userData');
    this.stateFilePath = path.join(userDataPath, 'window-docking.json');
  }
  
  /**
   * Save docking state to disk
   */
  async save(dockedWindows: DockedWindow[]): Promise<void> {
    try {
      const dockedData: DockedWindowData[] = dockedWindows.map(docked => ({
        windowId: docked.windowId,
        zone: docked.zone,
        originalBounds: docked.originalBounds,
        dockedAt: docked.dockedAt.toISOString()
      }));
      
      const storage: DockStateStorage = {
        version: this.VERSION,
        dockedWindows: dockedData,
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        this.stateFilePath,
        JSON.stringify(storage, null, 2),
        'utf-8'
      );
      
      console.log(`Saved ${dockedWindows.length} docked windows to ${this.stateFilePath}`);
    } catch (error) {
      console.error('Failed to save docking state:', error);
      throw error;
    }
  }
  
  /**
   * Load docking state from disk
   */
  async load(): Promise<DockedWindow[]> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const storage: DockStateStorage = JSON.parse(data);
      
      // Validate version
      if (storage.version !== this.VERSION) {
        console.warn(`Docking state version mismatch: ${storage.version} vs ${this.VERSION}`);
      }
      
      const dockedWindows: DockedWindow[] = storage.dockedWindows.map(dockedData => ({
        windowId: dockedData.windowId,
        zone: dockedData.zone,
        originalBounds: dockedData.originalBounds,
        dockedAt: new Date(dockedData.dockedAt)
      }));
      
      console.log(`Loaded ${dockedWindows.length} docked windows from ${this.stateFilePath}`);
      
      return dockedWindows;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        console.log('No saved docking state found');
        return [];
      }
      
      console.error('Failed to load docking state:', error);
      throw error;
    }
  }
  
  /**
   * Clear all saved docking state
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
      console.log('Cleared docking state');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to clear docking state:', error);
        throw error;
      }
    }
  }
  
  /**
   * Check if saved state exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.stateFilePath);
      return true;
    } catch {
      return false;
    }
  }
}
