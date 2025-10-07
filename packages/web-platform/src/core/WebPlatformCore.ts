/**
 * Web Platform Core
 * Main orchestrator for the browser-based platform
 */

import { PlatformConfig, WindowConfig } from '../types';
import { BrowserWindowManager } from './BrowserWindowManager';
import { PostMessageRouter } from './PostMessageRouter';
import { WebWorkspaceManager } from './WebWorkspaceManager';
import { StorageManager } from '../storage/StorageManager';

// Define Context type locally to avoid import issues
type Context = {
  type: string;
  [key: string]: any;
};

export class WebPlatformCore {
  private config: PlatformConfig | null = null;
  private initialized: boolean = false;
  private windowManager: BrowserWindowManager | null = null;
  private messageRouter: PostMessageRouter | null = null;
  private workspaceManager: WebWorkspaceManager | null = null;
  private storage: StorageManager;
  private appDirectory: Map<string, any> = new Map();
  
  constructor(storage: StorageManager) {
    this.storage = storage;
  }
  
  async initialize(config: PlatformConfig): Promise<void> {
    console.log('[WebPlatformCore] Initializing with config:', config);
    
    this.config = config;
    
    // Initialize services
    this.windowManager = new BrowserWindowManager();
    this.messageRouter = new PostMessageRouter();
    this.workspaceManager = new WebWorkspaceManager(this.storage);
    
    // Load application directory
    await this.loadApplicationDirectory(config.appDirectory);
    
    // Load saved external apps
    await this.loadSavedApps();
    
    // Load default workspace if specified
    if (config.defaultWorkspace) {
      try {
        await this.workspaceManager.loadWorkspace(config.defaultWorkspace);
      } catch (error) {
        console.warn('[WebPlatformCore] Failed to load default workspace:', error);
      }
    }
    
    this.initialized = true;
    console.log('[WebPlatformCore] Initialized successfully');
  }
  
  async shutdown(): Promise<void> {
    console.log('[WebPlatformCore] Shutting down...');
    
    // Close all windows
    if (this.windowManager) {
      const windows = this.windowManager.getAllWindows();
      for (const window of windows) {
        window.close();
      }
    }
    
    this.initialized = false;
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Load application directory
   */
  private async loadApplicationDirectory(url: string): Promise<void> {
    try {
      console.log('[WebPlatformCore] Loading app directory from:', url);
      
      const response = await fetch(url);
      const directory = await response.json();
      
      if (Array.isArray(directory.applications)) {
        for (const app of directory.applications) {
          this.appDirectory.set(app.appId, app);
        }
        console.log('[WebPlatformCore] Loaded', this.appDirectory.size, 'applications');
      }
    } catch (error) {
      console.error('[WebPlatformCore] Failed to load app directory:', error);
    }
  }
  
  /**
   * Launch an application
   */
  async launchApplication(appId: string, options?: { context?: Context; bounds?: { x: number; y: number; width: number; height: number } }): Promise<any> {
    if (!this.windowManager || !this.messageRouter) {
      throw new Error('Platform not initialized');
    }
    
    console.log('[WebPlatformCore] Launching application:', appId, options);
    
    const appManifest = this.appDirectory.get(appId);
    if (!appManifest) {
      throw new Error(`Application not found: ${appId}`);
    }
    
    // Prepare URL with platform parameters
    const url = new URL(appManifest.url, window.location.origin);
    url.searchParams.set('platformOrigin', window.location.origin);
    url.searchParams.set('appId', appId);
    
    // Create window config with bounds override if provided
    const windowConfig: WindowConfig = {
      appId,
      url: url.toString(),
      title: appManifest.title || appManifest.name,
      position: options?.bounds ? { x: options.bounds.x, y: options.bounds.y } : appManifest.window?.defaultPosition,
      size: options?.bounds ? { width: options.bounds.width, height: options.bounds.height } : (appManifest.window?.defaultSize || { width: 800, height: 600 }),
      minSize: appManifest.window?.minSize,
      maxSize: appManifest.window?.maxSize,
      resizable: appManifest.window?.resizable !== false,
      movable: appManifest.window?.movable !== false,
      frame: appManifest.window?.frame !== false,
      sandbox: appManifest.sandbox
    };
    
    // Create window
    const windowInstance = this.windowManager.createWindow(windowConfig);
    
    // Register with message router
    this.messageRouter.registerApplication(appId, windowInstance.iframe);
    
    // Send initial context if provided
    if (options?.context) {
      setTimeout(() => {
        this.messageRouter?.sendToApplication(appId, {
          type: 'broadcast',
          payload: { context: options.context },
          messageId: 'init',
          timestamp: Date.now()
        });
      }, 1000); // Wait for iframe to load
    }
    
    return {
      appId,
      instanceId: windowInstance.id
    };
  }
  
  /**
   * Close an application
   */
  async closeApplication(instanceId: string): Promise<void> {
    if (!this.windowManager || !this.messageRouter) {
      throw new Error('Platform not initialized');
    }
    
    console.log('[WebPlatformCore] Closing application:', instanceId);
    
    const window = this.windowManager.getWindow(instanceId);
    if (window) {
      this.messageRouter.unregisterApplication(window.appId);
      this.windowManager.destroyWindow(instanceId);
    }
  }
  
  /**
   * Get running applications
   */
  getRunningApplications(): any[] {
    if (!this.windowManager) {
      return [];
    }
    
    return this.windowManager.getAllWindows().map(w => ({
      appId: w.appId,
      instanceId: w.id,
      state: w.state
    }));
  }
  
  /**
   * Broadcast context
   */
  async broadcast(context: Context, channelId?: string): Promise<void> {
    if (!this.messageRouter) {
      throw new Error('Platform not initialized');
    }
    
    // This would be handled by the message router
    console.log('[WebPlatformCore] Broadcasting context:', context);
  }
  
  /**
   * Save current workspace
   */
  async saveWorkspace(name: string): Promise<any> {
    if (!this.workspaceManager) {
      throw new Error('Platform not initialized');
    }
    
    return await this.workspaceManager.saveWorkspace(name);
  }
  
  /**
   * Load workspace
   */
  async loadWorkspace(workspaceId: string): Promise<void> {
    if (!this.workspaceManager) {
      throw new Error('Platform not initialized');
    }
    
    await this.workspaceManager.loadWorkspace(workspaceId);
  }
  
  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<any[]> {
    if (!this.workspaceManager) {
      throw new Error('Platform not initialized');
    }
    
    return await this.workspaceManager.getWorkspaces();
  }
  
  /**
   * Get application directory
   */
  getApplicationDirectory(): any[] {
    return Array.from(this.appDirectory.values());
  }
  
  /**
   * Add external app to directory
   */
  addExternalApp(app: { name: string; url: string; icon?: string; description?: string }): void {
    const appId = `external-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const appManifest = {
      appId,
      name: app.name,
      title: app.name,
      description: app.description || 'External web application',
      url: app.url,
      icon: app.icon || '🌐',
      window: {
        defaultSize: { width: 1000, height: 700 },
        minSize: { width: 400, height: 300 }
      },
      external: true
    };
    
    this.appDirectory.set(appId, appManifest);
    
    // Save to storage for persistence
    this.saveAppDirectory();
    
    console.log('[WebPlatformCore] Added external app:', appId, app.name);
  }
  
  /**
   * Remove app from directory
   */
  removeApp(appId: string): void {
    this.appDirectory.delete(appId);
    this.saveAppDirectory();
    console.log('[WebPlatformCore] Removed app:', appId);
  }
  
  /**
   * Save app directory to storage
   */
  private async saveAppDirectory(): Promise<void> {
    try {
      const apps = Array.from(this.appDirectory.values());
      await this.storage.set('appDirectory', apps);
    } catch (error) {
      console.error('[WebPlatformCore] Failed to save app directory:', error);
    }
  }
  
  /**
   * Load saved apps from storage
   */
  private async loadSavedApps(): Promise<void> {
    try {
      const savedApps = await this.storage.get('appDirectory');
      if (Array.isArray(savedApps)) {
        savedApps.forEach(app => {
          if (app.external) {
            this.appDirectory.set(app.appId, app);
          }
        });
        console.log('[WebPlatformCore] Loaded', savedApps.length, 'saved apps');
      }
    } catch (error) {
      console.error('[WebPlatformCore] Failed to load saved apps:', error);
    }
  }
  
  /**
   * Get window manager
   */
  getWindowManager(): BrowserWindowManager | null {
    return this.windowManager;
  }
  
  /**
   * Get message router
   */
  getMessageRouter(): PostMessageRouter | null {
    return this.messageRouter;
  }
  
  /**
   * Get workspace manager
   */
  getWorkspaceManager(): WebWorkspaceManager | null {
    return this.workspaceManager;
  }
}
