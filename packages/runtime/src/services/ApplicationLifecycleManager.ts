import { ApplicationManifest, ApplicationState } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { ProcessManager } from './ProcessManager';
import { ManifestParser } from '../parsers/ManifestParser';

/**
 * Application instance
 */
export interface ApplicationInstance {
  id: string;
  appId: string;
  manifest: ApplicationManifest;
  processId: string;
  state: ApplicationState;
  createdAt: Date;
}

/**
 * Manages application lifecycle
 */
export class ApplicationLifecycleManager implements IService {
  private applications: Map<string, ApplicationInstance> = new Map();
  private manifestParser: ManifestParser;
  
  constructor(private processManager: ProcessManager) {
    this.manifestParser = new ManifestParser();
  }
  
  async initialize(): Promise<void> {
    console.log('ApplicationLifecycleManager initialized');
  }
  
  async shutdown(): Promise<void> {
    // Close all applications
    const closePromises = Array.from(this.applications.keys())
      .map(id => this.closeApplication(id));
    
    await Promise.all(closePromises);
  }
  
  /**
   * Launch an application from manifest
   */
  async launchApplication(manifestJson: string): Promise<ApplicationInstance> {
    // Parse and validate manifest
    const manifest = this.manifestParser.parse(manifestJson);
    
    const appId = manifest.startup_app.uuid;
    const instanceId = this.generateInstanceId();
    
    // Create application process
    const process = await this.processManager.createApplicationProcess(manifest);
    
    // Create application instance
    const instance: ApplicationInstance = {
      id: instanceId,
      appId,
      manifest,
      processId: process.id,
      state: 'running',
      createdAt: new Date()
    };
    
    this.applications.set(instanceId, instance);
    
    return instance;
  }
  
  /**
   * Close an application
   */
  async closeApplication(instanceId: string): Promise<void> {
    const instance = this.applications.get(instanceId);
    
    if (!instance) {
      return;
    }
    
    instance.state = 'closing';
    
    // Terminate process
    await this.processManager.terminateProcess(instance.processId);
    
    instance.state = 'closed';
    this.applications.delete(instanceId);
  }
  
  /**
   * Get application instance
   */
  getApplication(instanceId: string): ApplicationInstance | null {
    return this.applications.get(instanceId) || null;
  }
  
  /**
   * List all applications
   */
  listApplications(): ApplicationInstance[] {
    return Array.from(this.applications.values());
  }
  
  /**
   * Generate unique instance ID
   */
  private generateInstanceId(): string {
    return `app-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
