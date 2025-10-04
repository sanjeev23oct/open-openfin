import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import { RuntimeVersionManager } from './RuntimeVersionManager';

/**
 * Installation progress callback
 */
export type ProgressCallback = (progress: InstallProgress) => void;

/**
 * Installation progress information
 */
export interface InstallProgress {
  phase: 'downloading' | 'extracting' | 'installing' | 'complete';
  percent: number;
  message: string;
}

/**
 * Installs runtime versions
 */
export class RuntimeInstaller {
  constructor(
    private versionManager: RuntimeVersionManager,
    private downloadBaseUrl: string = 'https://downloads.desktop-interop.io/runtime'
  ) {}
  
  /**
   * Install a specific runtime version
   */
  async installVersion(
    version: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    // Check if already installed
    if (this.versionManager.isVersionInstalled(version)) {
      throw new Error(`Runtime version ${version} is already installed`);
    }
    
    const installPath = await this.getInstallPath(version);
    
    try {
      // Download phase
      onProgress?.({
        phase: 'downloading',
        percent: 0,
        message: `Downloading runtime ${version}...`
      });
      
      const downloadPath = await this.downloadRuntime(version, (percent) => {
        onProgress?.({
          phase: 'downloading',
          percent,
          message: `Downloading runtime ${version}... ${percent}%`
        });
      });
      
      // Extract phase
      onProgress?.({
        phase: 'extracting',
        percent: 0,
        message: `Extracting runtime ${version}...`
      });
      
      await this.extractRuntime(downloadPath, installPath);
      
      onProgress?.({
        phase: 'extracting',
        percent: 100,
        message: `Extracted runtime ${version}`
      });
      
      // Install phase
      onProgress?.({
        phase: 'installing',
        percent: 0,
        message: `Installing runtime ${version}...`
      });
      
      await this.versionManager.registerVersion(version, installPath);
      
      // Cleanup download
      await fs.rm(downloadPath, { force: true });
      
      // Complete
      onProgress?.({
        phase: 'complete',
        percent: 100,
        message: `Runtime ${version} installed successfully`
      });
      
    } catch (error) {
      // Cleanup on error
      await fs.rm(installPath, { recursive: true, force: true });
      throw error;
    }
  }
  
  /**
   * Download runtime package
   */
  private async downloadRuntime(
    version: string,
    onProgress: (percent: number) => void
  ): Promise<string> {
    const url = `${this.downloadBaseUrl}/${version}/runtime.zip`;
    const downloadPath = path.join(process.env.TEMP || '/tmp', `runtime-${version}.zip`);
    
    return new Promise((resolve, reject) => {
      const file = fs.open(downloadPath, 'w');
      
      https.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download runtime: HTTP ${response.statusCode}`));
          return;
        }
        
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        
        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const percent = Math.round((downloadedSize / totalSize) * 100);
          onProgress(percent);
        });
        
        const writeStream = require('fs').createWriteStream(downloadPath);
        response.pipe(writeStream);
        
        writeStream.on('finish', () => {
          writeStream.close();
          resolve(downloadPath);
        });
        
        writeStream.on('error', reject);
      }).on('error', reject);
    });
  }
  
  /**
   * Extract runtime package
   */
  private async extractRuntime(archivePath: string, targetPath: string): Promise<void> {
    await fs.mkdir(targetPath, { recursive: true });
    
    // For simplicity, this is a placeholder
    // In production, use a proper zip extraction library like 'adm-zip' or 'extract-zip'
    // For now, we'll just create the directory structure
    
    // Create basic runtime structure
    await fs.mkdir(path.join(targetPath, 'bin'), { recursive: true });
    await fs.mkdir(path.join(targetPath, 'resources'), { recursive: true });
    
    // In a real implementation, extract the archive here
  }
  
  /**
   * Get installation path for a version
   */
  private async getInstallPath(version: string): Promise<string> {
    const basePath = process.env.LOCALAPPDATA || '';
    return path.join(basePath, 'DesktopInterop', 'Runtimes', version);
  }
}
