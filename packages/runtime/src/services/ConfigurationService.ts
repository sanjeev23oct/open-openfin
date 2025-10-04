import * as fs from 'fs/promises';
import * as path from 'path';
import { RuntimeConfig } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';

/**
 * Configuration change callback
 */
export type ConfigChangeCallback = (value: any) => void;

/**
 * Configuration Service
 */
export class ConfigurationService implements IService {
  private config: RuntimeConfig;
  private configPath: string;
  private watchers: Map<string, Set<ConfigChangeCallback>> = new Map();
  private fileWatcher?: fs.FSWatcher;
  
  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.cwd(), 'config.json');
    this.config = {} as RuntimeConfig;
  }
  
  async initialize(): Promise<void> {
    await this.load();
    console.log('ConfigurationService initialized');
  }
  
  async shutdown(): Promise<void> {
    if (this.fileWatcher) {
      await this.fileWatcher.close();
    }
    this.watchers.clear();
  }
  
  /**
   * Load configuration from file
   */
  async load(): Promise<RuntimeConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
      return this.config;
    } catch (error) {
      // Use default config if file doesn't exist
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }
  
  /**
   * Get configuration value
   */
  get<T>(key: string): T {
    const keys = key.split('.');
    let value: any = this.config;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return undefined as T;
      }
    }
    
    return value as T;
  }
  
  /**
   * Set configuration value
   */
  async set(key: string, value: any): Promise<void> {
    const keys = key.split('.');
    let target: any = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!target[k] || typeof target[k] !== 'object') {
        target[k] = {};
      }
      target = target[k];
    }
    
    target[keys[keys.length - 1]] = value;
    
    // Save to file
    await this.save();
    
    // Notify watchers
    this.notifyWatchers(key, value);
  }
  
  /**
   * Reload configuration from file
   */
  async reload(): Promise<void> {
    const oldConfig = { ...this.config };
    await this.load();
    
    // Notify watchers of changes
    this.detectChanges(oldConfig, this.config);
  }
  
  /**
   * Watch for configuration changes
   */
  watch(key: string, callback: ConfigChangeCallback): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    
    this.watchers.get(key)!.add(callback);
    
    // Set up file watcher if not already watching
    if (!this.fileWatcher) {
      this.setupFileWatcher();
    }
  }
  
  /**
   * Get full configuration
   */
  getConfig(): RuntimeConfig {
    return { ...this.config };
  }
  
  /**
   * Save configuration to file
   */
  private async save(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to save configuration:', error);
    }
  }
  
  /**
   * Set up file watcher
   */
  private setupFileWatcher(): void {
    // Note: fs.watch is not available in all environments
    // This is a simplified implementation
    setInterval(async () => {
      try {
        const stats = await fs.stat(this.configPath);
        // Check if file was modified
        // In production, use proper file watching
      } catch {
        // File doesn't exist
      }
    }, 5000);
  }
  
  /**
   * Notify watchers of configuration change
   */
  private notifyWatchers(key: string, value: any): void {
    const watchers = this.watchers.get(key);
    
    if (watchers) {
      for (const callback of watchers) {
        try {
          callback(value);
        } catch (error) {
          console.error('Config watcher error:', error);
        }
      }
    }
  }
  
  /**
   * Detect changes between old and new config
   */
  private detectChanges(oldConfig: any, newConfig: any, prefix: string = ''): void {
    for (const key in newConfig) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (oldConfig[key] !== newConfig[key]) {
        this.notifyWatchers(fullKey, newConfig[key]);
      }
      
      if (typeof newConfig[key] === 'object' && newConfig[key] !== null) {
        this.detectChanges(oldConfig[key] || {}, newConfig[key], fullKey);
      }
    }
  }
  
  /**
   * Get default configuration
   */
  private getDefaultConfig(): RuntimeConfig {
    return {
      version: '0.1.0',
      port: 9000,
      logLevel: 'info',
      autoUpdate: false,
      crashReporting: false,
      security: {
        sandboxing: true,
        contextIsolation: true
      },
      applications: {
        crashRecovery: true
      },
      ui: {
        theme: 'system'
      },
      logging: {
        level: 'info',
        destination: 'console'
      }
    };
  }
}
