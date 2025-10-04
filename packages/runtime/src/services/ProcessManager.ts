import { BrowserWindow } from 'electron';
import { ApplicationManifest, ApplicationProcess, ApplicationState } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import * as path from 'path';

/**
 * Application process implementation
 */
class ApplicationProcessImpl implements ApplicationProcess {
  public state: ApplicationState = 'initializing';
  public createdAt: Date = new Date();
  
  constructor(
    public id: string,
    public uuid: string,
    public pid: number,
    public window: BrowserWindow
  ) {}
}

/**
 * Manages application processes
 */
export class ProcessManager implements IService {
  private processes: Map<string, ApplicationProcessImpl> = new Map();
  private preloadPath: string;
  
  constructor(preloadScriptPath?: string) {
    this.preloadPath = preloadScriptPath || path.join(__dirname, '../preload.js');
  }
  
  async initialize(): Promise<void> {
    console.log('ProcessManager initialized');
  }
  
  async shutdown(): Promise<void> {
    // Terminate all processes
    const terminatePromises = Array.from(this.processes.keys())
      .map(id => this.terminateProcess(id));
    
    await Promise.all(terminatePromises);
  }
  
  /**
   * Create an application process
   */
  async createApplicationProcess(manifest: ApplicationManifest): Promise<ApplicationProcess> {
    const processId = this.generateProcessId();
    const uuid = manifest.startup_app.uuid;
    
    // Create browser window for the application
    const window = new BrowserWindow({
      width: manifest.startup_app.defaultWidth || 800,
      height: manifest.startup_app.defaultHeight || 600,
      x: manifest.startup_app.defaultLeft,
      y: manifest.startup_app.defaultTop,
      frame: manifest.startup_app.frame !== false,
      resizable: manifest.startup_app.resizable !== false,
      show: manifest.startup_app.autoShow !== false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        preload: this.preloadPath
      }
    });
    
    // Create process object
    const process = new ApplicationProcessImpl(
      processId,
      uuid,
      window.webContents.getOSProcessId(),
      window
    );
    
    // Track process
    this.processes.set(processId, process);
    
    // Handle window close
    window.on('closed', () => {
      process.state = 'closed';
      this.processes.delete(processId);
    });
    
    // Handle crashes
    window.webContents.on('crashed', () => {
      process.state = 'crashed';
    });
    
    // Load application URL
    try {
      await window.loadURL(manifest.startup_app.url);
      process.state = 'running';
    } catch (error) {
      process.state = 'failed';
      throw error;
    }
    
    return process;
  }
  
  /**
   * Terminate a process
   */
  async terminateProcess(processId: string): Promise<void> {
    const process = this.processes.get(processId);
    
    if (!process) {
      return;
    }
    
    process.state = 'closing';
    
    // Close the window
    if (!process.window.isDestroyed()) {
      process.window.close();
    }
    
    // Wait for window to close
    await new Promise<void>((resolve) => {
      if (process.window.isDestroyed()) {
        resolve();
      } else {
        process.window.once('closed', () => resolve());
      }
    });
    
    process.state = 'closed';
    this.processes.delete(processId);
  }
  
  /**
   * Get a process by ID
   */
  getProcess(processId: string): ApplicationProcess | null {
    return this.processes.get(processId) || null;
  }
  
  /**
   * Get process by UUID
   */
  getProcessByUuid(uuid: string): ApplicationProcess | null {
    for (const process of this.processes.values()) {
      if (process.uuid === uuid) {
        return process;
      }
    }
    return null;
  }
  
  /**
   * List all processes
   */
  listProcesses(): ApplicationProcess[] {
    return Array.from(this.processes.values());
  }
  
  /**
   * Generate unique process ID
   */
  private generateProcessId(): string {
    return `process-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
