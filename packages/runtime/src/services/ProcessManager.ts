import { BrowserWindow } from 'electron';
import { ApplicationManifest, ApplicationProcess, ApplicationState } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { ProcessIsolationManager, ProcessInfo } from './ProcessIsolationManager';
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
    public window: BrowserWindow,
    public processInfo?: ProcessInfo
  ) {}
}

/**
 * Manages application processes with multi-process isolation
 */
export class ProcessManager implements IService {
  private processes: Map<string, ApplicationProcessImpl> = new Map();
  private preloadPath: string;
  private isolationManager: ProcessIsolationManager;
  private useProcessIsolation: boolean = true; // Feature flag
  
  constructor(preloadScriptPath?: string, useIsolation: boolean = true) {
    this.preloadPath = preloadScriptPath || path.join(__dirname, '../preload.js');
    this.useProcessIsolation = useIsolation;
    this.isolationManager = new ProcessIsolationManager();
    
    // Setup isolation manager event handlers
    this.setupIsolationHandlers();
  }
  
  async initialize(): Promise<void> {
    console.log(`ProcessManager initialized (isolation: ${this.useProcessIsolation ? 'enabled' : 'disabled'})`);
  }
  
  async shutdown(): Promise<void> {
    // Terminate all processes
    const terminatePromises = Array.from(this.processes.keys())
      .map(id => this.terminateProcess(id));
    
    await Promise.all(terminatePromises);
    
    // Shutdown isolation manager
    if (this.useProcessIsolation) {
      await this.isolationManager.shutdown();
    }
  }
  
  /**
   * Setup isolation manager event handlers
   */
  private setupIsolationHandlers(): void {
    this.isolationManager.on('process-crashed', (processInfo: ProcessInfo) => {
      console.error(`[ProcessManager] App crashed: ${processInfo.appName} (${processInfo.appUuid})`);
      
      // Update process state
      const process = this.getProcessByUuid(processInfo.appUuid);
      if (process) {
        process.state = 'crashed';
      }
    });
    
    this.isolationManager.on('process-restarted', (appUuid: string) => {
      console.log(`[ProcessManager] App restarted: ${appUuid}`);
      
      // Update process state
      const process = this.getProcessByUuid(appUuid);
      if (process) {
        process.state = 'running';
      }
    });
    
    this.isolationManager.on('resource-limit-exceeded', (processInfo: ProcessInfo, type: string, value: number) => {
      console.warn(`[ProcessManager] Resource limit exceeded for ${processInfo.appName}: ${type} = ${value}`);
    });
  }
  
  /**
   * Create an application process with optional isolation
   */
  async createApplicationProcess(manifest: ApplicationManifest): Promise<ApplicationProcess> {
    const processId = this.generateProcessId();
    const uuid = manifest.startup_app?.uuid || processId;
    
    if (this.useProcessIsolation) {
      // Use multi-process architecture
      return this.createIsolatedProcess(manifest, processId, uuid);
    } else {
      // Use legacy single-process architecture
      return this.createLegacyProcess(manifest, processId, uuid);
    }
  }
  
  /**
   * Create isolated process (NEW - OpenFin-style)
   */
  private async createIsolatedProcess(
    manifest: ApplicationManifest,
    processId: string,
    uuid: string
  ): Promise<ApplicationProcess> {
    console.log(`[ProcessManager] Creating isolated process for ${uuid}`);
    
    try {
      // Create isolated process
      const processInfo = await this.isolationManager.createProcess(manifest);
      
      // Create process object
      const process = new ApplicationProcessImpl(
        processId,
        uuid,
        processInfo.pid,
        processInfo.window!,
        processInfo
      );
      
      process.state = 'running';
      
      // Track process
      this.processes.set(processId, process);
      
      console.log(`[ProcessManager] Isolated process created: ${uuid} (PID: ${processInfo.pid})`);
      
      return process;
    } catch (error) {
      console.error(`[ProcessManager] Failed to create isolated process:`, error);
      throw error;
    }
  }
  
  /**
   * Create legacy process (OLD - single process)
   */
  private async createLegacyProcess(
    manifest: ApplicationManifest,
    processId: string,
    uuid: string
  ): Promise<ApplicationProcess> {
    console.log(`[ProcessManager] Creating legacy process for ${uuid}`);
    
    const app = manifest.startup_app || manifest;
    
    // Create browser window for the application
    const window = new BrowserWindow({
      width: app.defaultWidth || 800,
      height: app.defaultHeight || 600,
      x: app.defaultLeft,
      y: app.defaultTop,
      frame: app.frame !== false,
      resizable: app.resizable !== false,
      show: app.autoShow !== false,
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
    window.webContents.on('render-process-gone', (event, details) => {
      console.error(`[ProcessManager] Render process gone for ${uuid}:`, details.reason);
      process.state = 'crashed';
    });
    
    // Load application URL
    try {
      const appUrl = app.url;
      if (appUrl.startsWith('http://') || appUrl.startsWith('https://')) {
        await window.loadURL(appUrl);
      } else {
        await window.loadFile(appUrl);
      }
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
    
    // If using isolation, terminate through isolation manager
    if (this.useProcessIsolation && process.processInfo) {
      this.isolationManager.terminateProcess(process.uuid);
    } else {
      // Legacy termination
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
    }
    
    process.state = 'closed';
    this.processes.delete(processId);
  }
  
  /**
   * Get process statistics
   */
  getStatistics() {
    if (this.useProcessIsolation) {
      return this.isolationManager.getStatistics();
    } else {
      return {
        totalProcesses: this.processes.size,
        runningProcesses: Array.from(this.processes.values()).filter(p => p.state === 'running').length,
        isolationEnabled: false
      };
    }
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
