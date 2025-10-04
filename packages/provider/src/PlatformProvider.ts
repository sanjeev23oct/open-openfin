import { ProviderConfig } from '@desktop-interop/sdk';
import { WorkspaceManager } from './WorkspaceManager';
import { LayoutManager } from './LayoutManager';

/**
 * Override callback function
 */
export type OverrideCallback = (...args: any[]) => any;

/**
 * Platform Provider - extensible provider layer
 */
export class PlatformProvider {
  private config: ProviderConfig;
  private workspaceManager: WorkspaceManager;
  private layoutManager: LayoutManager;
  private overrides: Map<string, OverrideCallback> = new Map();
  
  constructor(config: ProviderConfig) {
    this.config = config;
    this.workspaceManager = new WorkspaceManager();
    this.layoutManager = new LayoutManager();
  }
  
  /**
   * Initialize the provider
   */
  async initialize(): Promise<void> {
    await this.workspaceManager.initialize();
    await this.layoutManager.initialize();
    
    console.log(`Platform Provider ${this.config.name} initialized`);
  }
  
  /**
   * Shutdown the provider
   */
  async shutdown(): Promise<void> {
    await this.workspaceManager.shutdown();
    await this.layoutManager.shutdown();
  }
  
  /**
   * Override a callback
   */
  overrideCallback(callback: string, handler: OverrideCallback): void {
    this.overrides.set(callback, handler);
  }
  
  /**
   * Execute callback with override support
   */
  async executeCallback(callback: string, ...args: any[]): Promise<any> {
    const override = this.overrides.get(callback);
    
    if (override) {
      return await override(...args);
    }
    
    // Default behavior
    return this.defaultCallback(callback, ...args);
  }
  
  /**
   * Get workspace manager
   */
  getWorkspaceManager(): WorkspaceManager {
    return this.workspaceManager;
  }
  
  /**
   * Get layout manager
   */
  getLayoutManager(): LayoutManager {
    return this.layoutManager;
  }
  
  /**
   * Get provider configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }
  
  /**
   * Default callback implementation
   */
  private async defaultCallback(callback: string, ...args: any[]): Promise<any> {
    console.log(`Default callback: ${callback}`, args);
    return null;
  }
}
