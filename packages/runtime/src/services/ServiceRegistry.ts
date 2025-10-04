/**
 * Service interface
 */
export interface IService {
  /**
   * Initialize the service
   */
  initialize?(): Promise<void>;
  
  /**
   * Shutdown the service
   */
  shutdown?(): Promise<void>;
}

/**
 * Service metadata
 */
interface ServiceMetadata {
  name: string;
  instance: IService;
  initialized: boolean;
  dependencies?: string[];
}

/**
 * Service registry for dependency injection
 */
export class ServiceRegistry {
  private services: Map<string, ServiceMetadata> = new Map();
  private initializationOrder: string[] = [];
  
  /**
   * Initialize the registry
   */
  async initialize(): Promise<void> {
    // Registry initialization logic
  }
  
  /**
   * Register a service
   */
  registerService(name: string, instance: IService, dependencies?: string[]): void {
    if (this.services.has(name)) {
      throw new Error(`Service ${name} is already registered`);
    }
    
    this.services.set(name, {
      name,
      instance,
      initialized: false,
      dependencies
    });
  }
  
  /**
   * Get a service by name
   */
  getService<T>(name: string): T {
    const metadata = this.services.get(name);
    
    if (!metadata) {
      throw new Error(`Service ${name} is not registered`);
    }
    
    if (!metadata.initialized) {
      throw new Error(`Service ${name} is not initialized yet`);
    }
    
    return metadata.instance as T;
  }
  
  /**
   * Check if a service is registered
   */
  hasService(name: string): boolean {
    return this.services.has(name);
  }
  
  /**
   * Initialize all services in dependency order
   */
  async initializeAll(): Promise<void> {
    // Resolve initialization order based on dependencies
    this.initializationOrder = this.resolveInitializationOrder();
    
    // Initialize services in order
    for (const serviceName of this.initializationOrder) {
      await this.initializeService(serviceName);
    }
  }
  
  /**
   * Shutdown all services in reverse order
   */
  async shutdownAll(): Promise<void> {
    // Shutdown in reverse initialization order
    const shutdownOrder = [...this.initializationOrder].reverse();
    
    for (const serviceName of shutdownOrder) {
      await this.shutdownService(serviceName);
    }
  }
  
  /**
   * Initialize a single service
   */
  private async initializeService(name: string): Promise<void> {
    const metadata = this.services.get(name);
    
    if (!metadata) {
      throw new Error(`Service ${name} not found`);
    }
    
    if (metadata.initialized) {
      return;
    }
    
    // Initialize dependencies first
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        await this.initializeService(dep);
      }
    }
    
    // Initialize the service
    if (metadata.instance.initialize) {
      await metadata.instance.initialize();
    }
    
    metadata.initialized = true;
  }
  
  /**
   * Shutdown a single service
   */
  private async shutdownService(name: string): Promise<void> {
    const metadata = this.services.get(name);
    
    if (!metadata || !metadata.initialized) {
      return;
    }
    
    if (metadata.instance.shutdown) {
      await metadata.instance.shutdown();
    }
    
    metadata.initialized = false;
  }
  
  /**
   * Resolve service initialization order based on dependencies
   */
  private resolveInitializationOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    const visit = (name: string) => {
      if (visited.has(name)) {
        return;
      }
      
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving service ${name}`);
      }
      
      visiting.add(name);
      
      const metadata = this.services.get(name);
      if (metadata?.dependencies) {
        for (const dep of metadata.dependencies) {
          if (!this.services.has(dep)) {
            throw new Error(`Service ${name} depends on ${dep}, but ${dep} is not registered`);
          }
          visit(dep);
        }
      }
      
      visiting.delete(name);
      visited.add(name);
      order.push(name);
    };
    
    // Visit all services
    for (const name of this.services.keys()) {
      visit(name);
    }
    
    return order;
  }
}
