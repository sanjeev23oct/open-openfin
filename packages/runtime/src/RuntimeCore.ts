import { app, BrowserWindow } from 'electron';
import { RuntimeConfig } from '@desktop-interop/sdk';
import { ServiceRegistry } from './services/ServiceRegistry';

/**
 * Main runtime core - entry point for the runtime process
 */
export class RuntimeCore {
  private serviceRegistry: ServiceRegistry;
  private config: RuntimeConfig;
  private initialized: boolean = false;
  
  constructor() {
    this.serviceRegistry = new ServiceRegistry();
    this.config = {} as RuntimeConfig;
  }
  
  /**
   * Initialize the runtime
   */
  async initialize(config: RuntimeConfig): Promise<void> {
    if (this.initialized) {
      throw new Error('Runtime already initialized');
    }
    
    this.config = config;
    
    // Wait for Electron app to be ready
    await app.whenReady();
    
    // Initialize service registry
    await this.serviceRegistry.initialize();
    
    // Register core services
    await this.registerCoreServices();
    
    // Initialize all services
    await this.serviceRegistry.initializeAll();
    
    this.initialized = true;
    
    console.log(`Runtime ${config.version} initialized on port ${config.port}`);
  }
  
  /**
   * Shutdown the runtime
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    console.log('Shutting down runtime...');
    
    // Shutdown all services
    await this.serviceRegistry.shutdownAll();
    
    // Quit Electron app
    app.quit();
    
    this.initialized = false;
  }
  
  /**
   * Get a service from the registry
   */
  getService<T>(serviceName: string): T {
    return this.serviceRegistry.getService<T>(serviceName);
  }
  
  /**
   * Get runtime version
   */
  getVersion(): string {
    return this.config.version;
  }
  
  /**
   * Get runtime port
   */
  getPort(): number {
    return this.config.port || 0;
  }
  
  /**
   * Get runtime configuration
   */
  getConfig(): RuntimeConfig {
    return this.config;
  }
  
  /**
   * Register core services
   */
  private async registerCoreServices(): Promise<void> {
    // Services will be registered here as we implement them
    // For now, this is a placeholder
    
    // Example:
    // const processManager = new ProcessManager(this);
    // this.serviceRegistry.registerService('ProcessManager', processManager);
  }
}
