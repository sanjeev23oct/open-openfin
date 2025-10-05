import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { WindowGroup } from '@desktop-interop/sdk';

/**
 * Serializable group data for persistence
 */
export interface GroupStateData {
  id: string;
  windows: string[];
  activeWindow: string;
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
  tabBarBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  state: 'normal' | 'minimized' | 'maximized';
  monitor: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Group state storage
 */
export interface GroupStateStorage {
  version: string;
  groups: GroupStateData[];
  savedAt: string;
}

/**
 * Group State Store - persists window group configurations
 */
export class GroupStateStore {
  private stateFilePath: string;
  private readonly VERSION = '1.0.0';
  
  constructor() {
    const userDataPath = app.getPath('userData');
    this.stateFilePath = path.join(userDataPath, 'window-groups.json');
  }
  
  /**
   * Save group state to disk
   */
  async save(groups: WindowGroup[]): Promise<void> {
    try {
      const groupData: GroupStateData[] = groups.map(group => ({
        id: group.id,
        windows: group.windows,
        activeWindow: group.activeWindow,
        bounds: group.bounds,
        tabBarBounds: group.tabBarBounds,
        state: group.state,
        monitor: group.monitor,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt?.toISOString()
      }));
      
      const storage: GroupStateStorage = {
        version: this.VERSION,
        groups: groupData,
        savedAt: new Date().toISOString()
      };
      
      await fs.writeFile(
        this.stateFilePath,
        JSON.stringify(storage, null, 2),
        'utf-8'
      );
      
      console.log(`Saved ${groups.length} window groups to ${this.stateFilePath}`);
    } catch (error) {
      console.error('Failed to save group state:', error);
      throw error;
    }
  }
  
  /**
   * Load group state from disk
   */
  async load(): Promise<WindowGroup[]> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const storage: GroupStateStorage = JSON.parse(data);
      
      // Validate version
      if (storage.version !== this.VERSION) {
        console.warn(`Group state version mismatch: ${storage.version} vs ${this.VERSION}`);
      }
      
      const groups: WindowGroup[] = storage.groups.map(groupData => ({
        id: groupData.id,
        windows: groupData.windows,
        activeWindow: groupData.activeWindow,
        bounds: groupData.bounds,
        tabBarBounds: groupData.tabBarBounds,
        state: groupData.state,
        monitor: groupData.monitor,
        createdAt: new Date(groupData.createdAt),
        updatedAt: groupData.updatedAt ? new Date(groupData.updatedAt) : undefined
      }));
      
      console.log(`Loaded ${groups.length} window groups from ${this.stateFilePath}`);
      
      return groups;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty array
        console.log('No saved group state found');
        return [];
      }
      
      console.error('Failed to load group state:', error);
      throw error;
    }
  }
  
  /**
   * Clear all saved group state
   */
  async clear(): Promise<void> {
    try {
      await fs.unlink(this.stateFilePath);
      console.log('Cleared group state');
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to clear group state:', error);
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
