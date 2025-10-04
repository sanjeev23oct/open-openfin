import * as fs from 'fs/promises';
import * as path from 'path';
import { RuntimeProcess } from './types';

/**
 * Runtime version metadata
 */
export interface RuntimeVersion {
  version: string;
  path: string;
  installedAt: Date;
}

/**
 * Manages multiple runtime versions
 */
export class RuntimeVersionManager {
  private versionsPath: string;
  private versions: Map<string, RuntimeVersion> = new Map();
  
  constructor(basePath?: string) {
    this.versionsPath = basePath || path.join(process.env.LOCALAPPDATA || '', 'DesktopInterop', 'Runtimes');
  }
  
  /**
   * Initialize the version manager
   */
  async initialize(): Promise<void> {
    await this.ensureVersionsDirectory();
    await this.loadInstalledVersions();
  }
  
  /**
   * Get all installed runtime versions
   */
  async getInstalledVersions(): Promise<string[]> {
    return Array.from(this.versions.keys()).sort();
  }
  
  /**
   * Get the latest installed version
   */
  async getLatestVersion(): Promise<string> {
    const versions = await this.getInstalledVersions();
    
    if (versions.length === 0) {
      throw new Error('No runtime versions installed');
    }
    
    // Simple version sorting (assumes semantic versioning)
    return versions.sort((a, b) => this.compareVersions(b, a))[0];
  }
  
  /**
   * Get runtime version metadata
   */
  getVersion(version: string): RuntimeVersion | undefined {
    return this.versions.get(version);
  }
  
  /**
   * Check if a version is installed
   */
  isVersionInstalled(version: string): boolean {
    return this.versions.has(version);
  }
  
  /**
   * Register a new runtime version
   */
  async registerVersion(version: string, runtimePath: string): Promise<void> {
    const versionData: RuntimeVersion = {
      version,
      path: runtimePath,
      installedAt: new Date()
    };
    
    this.versions.set(version, versionData);
    await this.saveVersionMetadata(versionData);
  }
  
  /**
   * Uninstall a runtime version
   */
  async uninstallVersion(version: string): Promise<void> {
    const versionData = this.versions.get(version);
    
    if (!versionData) {
      throw new Error(`Version ${version} is not installed`);
    }
    
    // Remove version directory
    await fs.rm(versionData.path, { recursive: true, force: true });
    
    // Remove metadata
    const metadataPath = path.join(this.versionsPath, version, 'metadata.json');
    await fs.rm(metadataPath, { force: true });
    
    this.versions.delete(version);
  }
  
  /**
   * Ensure versions directory exists
   */
  private async ensureVersionsDirectory(): Promise<void> {
    try {
      await fs.access(this.versionsPath);
    } catch {
      await fs.mkdir(this.versionsPath, { recursive: true });
    }
  }
  
  /**
   * Load installed versions from disk
   */
  private async loadInstalledVersions(): Promise<void> {
    try {
      const entries = await fs.readdir(this.versionsPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const metadataPath = path.join(this.versionsPath, entry.name, 'metadata.json');
          
          try {
            const metadata = await fs.readFile(metadataPath, 'utf-8');
            const versionData: RuntimeVersion = JSON.parse(metadata);
            this.versions.set(versionData.version, versionData);
          } catch {
            // Skip invalid metadata
          }
        }
      }
    } catch {
      // Versions directory doesn't exist yet
    }
  }
  
  /**
   * Save version metadata to disk
   */
  private async saveVersionMetadata(versionData: RuntimeVersion): Promise<void> {
    const versionDir = path.join(this.versionsPath, versionData.version);
    await fs.mkdir(versionDir, { recursive: true });
    
    const metadataPath = path.join(versionDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(versionData, null, 2));
  }
  
  /**
   * Compare two semantic versions
   */
  private compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aVal = aParts[i] || 0;
      const bVal = bParts[i] || 0;
      
      if (aVal > bVal) return 1;
      if (aVal < bVal) return -1;
    }
    
    return 0;
  }
}
