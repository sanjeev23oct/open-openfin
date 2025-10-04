import { ApplicationManifest, IntentMetadata } from '@desktop-interop/sdk';
import { IService } from '@desktop-interop/runtime';

/**
 * Application directory entry
 */
export interface DirectoryEntry {
  appId: string;
  manifest: ApplicationManifest;
  registeredAt: Date;
  tags?: string[];
}

/**
 * Application Directory Service
 */
export class ApplicationDirectory implements IService {
  private applications: Map<string, DirectoryEntry> = new Map();
  private intentIndex: Map<string, Set<string>> = new Map(); // intent -> Set<appId>
  
  async initialize(): Promise<void> {
    console.log('ApplicationDirectory initialized');
  }
  
  async shutdown(): Promise<void> {
    this.applications.clear();
    this.intentIndex.clear();
  }
  
  /**
   * Register an application
   */
  async registerApplication(manifest: ApplicationManifest, tags?: string[]): Promise<void> {
    const appId = manifest.startup_app.uuid;
    
    const entry: DirectoryEntry = {
      appId,
      manifest,
      registeredAt: new Date(),
      tags
    };
    
    this.applications.set(appId, entry);
    
    // Index intents
    if (manifest.fdc3?.intents) {
      for (const intent of manifest.fdc3.intents) {
        if (!this.intentIndex.has(intent.name)) {
          this.intentIndex.set(intent.name, new Set());
        }
        this.intentIndex.get(intent.name)!.add(appId);
      }
    }
  }
  
  /**
   * Unregister an application
   */
  async unregisterApplication(appId: string): Promise<void> {
    const entry = this.applications.get(appId);
    
    if (!entry) {
      return;
    }
    
    // Remove from intent index
    if (entry.manifest.fdc3?.intents) {
      for (const intent of entry.manifest.fdc3.intents) {
        this.intentIndex.get(intent.name)?.delete(appId);
      }
    }
    
    this.applications.delete(appId);
  }
  
  /**
   * Get application by ID
   */
  async getApplication(appId: string): Promise<ApplicationManifest | null> {
    const entry = this.applications.get(appId);
    return entry ? entry.manifest : null;
  }
  
  /**
   * Search applications
   */
  async searchApplications(query: string): Promise<ApplicationManifest[]> {
    const lowerQuery = query.toLowerCase();
    const results: ApplicationManifest[] = [];
    
    for (const entry of this.applications.values()) {
      const manifest = entry.manifest;
      const name = manifest.startup_app.name.toLowerCase();
      const description = manifest.startup_app.description?.toLowerCase() || '';
      const tags = entry.tags?.join(' ').toLowerCase() || '';
      
      if (
        name.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        tags.includes(lowerQuery)
      ) {
        results.push(manifest);
      }
    }
    
    return results;
  }
  
  /**
   * Find intent handlers
   */
  async findIntentHandlers(intent: string, context?: any): Promise<ApplicationManifest[]> {
    const appIds = this.intentIndex.get(intent);
    
    if (!appIds || appIds.size === 0) {
      return [];
    }
    
    const results: ApplicationManifest[] = [];
    
    for (const appId of appIds) {
      const entry = this.applications.get(appId);
      if (entry) {
        // Filter by context type if provided
        if (context && context.type) {
          const intentMeta = entry.manifest.fdc3?.intents?.find(i => i.name === intent);
          if (intentMeta && intentMeta.contexts.includes(context.type)) {
            results.push(entry.manifest);
          }
        } else {
          results.push(entry.manifest);
        }
      }
    }
    
    return results;
  }
  
  /**
   * List all applications
   */
  async listApplications(): Promise<ApplicationManifest[]> {
    return Array.from(this.applications.values()).map(entry => entry.manifest);
  }
  
  /**
   * Get applications by tag
   */
  async getApplicationsByTag(tag: string): Promise<ApplicationManifest[]> {
    const results: ApplicationManifest[] = [];
    
    for (const entry of this.applications.values()) {
      if (entry.tags?.includes(tag)) {
        results.push(entry.manifest);
      }
    }
    
    return results;
  }
}
