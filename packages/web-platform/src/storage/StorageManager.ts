/**
 * Storage Manager
 * Unified storage API with IndexedDB primary and localStorage fallback
 */

export interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
}

export class StorageManager {
  private db: IDBDatabase | null = null;
  private dbName: string = 'openfin-web-platform';
  private dbVersion: number = 1;
  private useLocalStorage: boolean = false;
  
  async initialize(): Promise<void> {
    try {
      this.db = await this.openIndexedDB();
      console.log('[StorageManager] Using IndexedDB');
    } catch (error) {
      console.warn('[StorageManager] IndexedDB unavailable, falling back to localStorage:', error);
      this.useLocalStorage = true;
    }
  }
  
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('workspaces')) {
          db.createObjectStore('workspaces', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      };
    });
  }
  
  async set(key: string, value: any, store: string = 'settings'): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.setItem(`${store}:${key}`, JSON.stringify(value));
      return;
    }
    
    if (!this.db) throw new Error('Storage not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([store], 'readwrite');
      const objectStore = tx.objectStore(store);
      const request = objectStore.put(value, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async get(key: string, store: string = 'settings'): Promise<any> {
    if (this.useLocalStorage) {
      const item = localStorage.getItem(`${store}:${key}`);
      return item ? JSON.parse(item) : null;
    }
    
    if (!this.db) throw new Error('Storage not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([store], 'readonly');
      const objectStore = tx.objectStore(store);
      const request = objectStore.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async delete(key: string, store: string = 'settings'): Promise<void> {
    if (this.useLocalStorage) {
      localStorage.removeItem(`${store}:${key}`);
      return;
    }
    
    if (!this.db) throw new Error('Storage not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([store], 'readwrite');
      const objectStore = tx.objectStore(store);
      const request = objectStore.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async keys(store: string = 'settings'): Promise<string[]> {
    if (this.useLocalStorage) {
      const prefix = `${store}:`;
      return Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .map(k => k.substring(prefix.length));
    }
    
    if (!this.db) throw new Error('Storage not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([store], 'readonly');
      const objectStore = tx.objectStore(store);
      const request = objectStore.getAllKeys();
      
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  }
  
  async clear(store: string = 'settings'): Promise<void> {
    if (this.useLocalStorage) {
      const prefix = `${store}:`;
      const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith(prefix));
      keysToRemove.forEach(k => localStorage.removeItem(k));
      return;
    }
    
    if (!this.db) throw new Error('Storage not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([store], 'readwrite');
      const objectStore = tx.objectStore(store);
      const request = objectStore.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
  
  async getUsage(): Promise<StorageUsage> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
      };
    }
    
    // Fallback for browsers without storage API
    return {
      used: 0,
      quota: 5 * 1024 * 1024, // Assume 5MB
      percentage: 0
    };
  }
  
  async exportAll(): Promise<string> {
    const data: any = {
      workspaces: {},
      settings: {}
    };
    
    // Export workspaces
    const workspaceKeys = await this.keys('workspaces');
    for (const key of workspaceKeys) {
      data.workspaces[key] = await this.get(key, 'workspaces');
    }
    
    // Export settings
    const settingKeys = await this.keys('settings');
    for (const key of settingKeys) {
      data.settings[key] = await this.get(key, 'settings');
    }
    
    return JSON.stringify(data, null, 2);
  }
  
  async importAll(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);
    
    // Import workspaces
    if (data.workspaces) {
      for (const [key, value] of Object.entries(data.workspaces)) {
        await this.set(key, value, 'workspaces');
      }
    }
    
    // Import settings
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await this.set(key, value, 'settings');
      }
    }
  }
}
