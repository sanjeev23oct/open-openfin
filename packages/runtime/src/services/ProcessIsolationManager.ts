import { utilityProcess, UtilityProcess, BrowserWindow, ipcMain } from 'electron';
import { EventEmitter } from 'events';
import * as path from 'path';
import { ApplicationManifest, Identity } from '@desktop-interop/sdk';

/**
 * Process information
 */
export interface ProcessInfo {
  processId: number;
  pid: number;
  appUuid: string;
  appName: string;
  manifest: ApplicationManifest;
  window: BrowserWindow | null;
  utilityProcess: UtilityProcess;
  status: 'starting' | 'running' | 'crashed' | 'terminated';
  startTime: number;
  crashCount: number;
  lastCrashTime?: number;
  resourceLimits: ResourceLimits;
}

/**
 * Resource limits per process
 */
export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxRestarts: number;
}

/**
 * Process Isolation Manager
 * Implements OpenFin-style multi-process architecture
 * Each app runs in separate Electron UtilityProcess for crash isolation
 */
export class ProcessIsolationManager extends EventEmitter {
  private processes: Map<string, ProcessInfo> = new Map();
  private processIdCounter = 1;
  
  // Default resource limits
  private defaultLimits: ResourceLimits = {
    maxMemoryMB: 512,
    maxCpuPercent: 80,
    maxRestarts: 3
  };
  
  constructor() {
    super();
    this.setupIPCHandlers();
  }
  
  /**
   * Create isolated process for application
   */
  async createProcess(
    manifest: ApplicationManifest,
    customLimits?: Partial<ResourceLimits>
  ): Promise<ProcessInfo> {
    const appUuid = manifest.startup_app.uuid || `app-${this.processIdCounter}`;
    const processId = this.processIdCounter++;
    
    // Check if process already exists
    if (this.processes.has(appUuid)) {
      throw new Error(`Process already exists for app: ${appUuid}`);
    }
    
    const limits = { ...this.defaultLimits, ...customLimits };
    
    console.log(`[ProcessIsolation] Creating process for ${appUuid}`);
    
    // Create utility process for the app
    const utilProc = utilityProcess.fork(
      path.join(__dirname, 'app-process-worker.js'),
      [],
      {
        serviceName: `app-${appUuid}`,
        stdio: 'pipe',
        env: {
          APP_UUID: appUuid,
          APP_NAME: manifest.startup_app.name || appUuid,
          MAX_MEMORY_MB: limits.maxMemoryMB.toString(),
          MAX_CPU_PERCENT: limits.maxCpuPercent.toString()
        }
      }
    );
    
    const processInfo: ProcessInfo = {
      processId,
      pid: utilProc.pid!,
      appUuid,
      appName: manifest.startup_app.name || appUuid,
      manifest,
      window: null,
      utilityProcess: utilProc,
      status: 'starting',
      startTime: Date.now(),
      crashCount: 0,
      resourceLimits: limits
    };
    
    // Setup process event handlers
    this.setupProcessHandlers(processInfo);
    
    // Store process info
    this.processes.set(appUuid, processInfo);
    
    // Create BrowserWindow in the utility process context
    await this.createWindowInProcess(processInfo);
    
    processInfo.status = 'running';
    this.emit('process-created', processInfo);
    
    console.log(`[ProcessIsolation] Process created: ${appUuid} (PID: ${utilProc.pid})`);
    
    return processInfo;
  }
  
  /**
   * Create BrowserWindow within the isolated process
   */
  private async createWindowInProcess(processInfo: ProcessInfo): Promise<void> {
    const { manifest, appUuid } = processInfo;
    const app = manifest.startup_app;
    
    // Create window with process isolation
    const window = new BrowserWindow({
      width: app.defaultWidth || 800,
      height: app.defaultHeight || 600,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        // Associate with utility process
        partition: `persist:${appUuid}`
      },
      title: app.name || appUuid,
      show: app.autoShow !== false
    });
    
    processInfo.window = window;
    
    // Handle window close
    window.on('closed', () => {
      console.log(`[ProcessIsolation] Window closed for ${appUuid}`);
      this.terminateProcess(appUuid);
    });
    
    // Load app URL
    const appUrl = app.url;
    if (appUrl.startsWith('http://') || appUrl.startsWith('https://')) {
      await window.loadURL(appUrl);
    } else {
      await window.loadFile(appUrl);
    }
  }
  
  /**
   * Setup process event handlers
   */
  private setupProcessHandlers(processInfo: ProcessInfo): void {
    const { utilityProcess: proc, appUuid } = processInfo;
    
    // Handle process messages
    proc.on('message', (message) => {
      this.handleProcessMessage(appUuid, message);
    });
    
    // Handle process spawn
    proc.on('spawn', () => {
      console.log(`[ProcessIsolation] Process spawned: ${appUuid} (PID: ${proc.pid})`);
    });
    
    // Handle process exit
    proc.on('exit', (code) => {
      console.log(`[ProcessIsolation] Process exited: ${appUuid} (code: ${code})`);
      this.handleProcessExit(appUuid, code);
    });
    
    // Handle stdout
    if (proc.stdout) {
      proc.stdout.on('data', (data) => {
        console.log(`[${appUuid}] ${data.toString().trim()}`);
      });
    }
    
    // Handle stderr
    if (proc.stderr) {
      proc.stderr.on('data', (data) => {
        console.error(`[${appUuid}] ERROR: ${data.toString().trim()}`);
      });
    }
  }
  
  /**
   * Handle messages from utility process
   */
  private handleProcessMessage(appUuid: string, message: any): void {
    const processInfo = this.processes.get(appUuid);
    if (!processInfo) return;
    
    console.log(`[ProcessIsolation] Message from ${appUuid}:`, message);
    
    // Handle different message types
    switch (message.type) {
      case 'ready':
        processInfo.status = 'running';
        this.emit('process-ready', processInfo);
        break;
        
      case 'resource-usage':
        this.checkResourceLimits(processInfo, message.data);
        break;
        
      case 'error':
        console.error(`[ProcessIsolation] Error in ${appUuid}:`, message.error);
        this.emit('process-error', processInfo, message.error);
        break;
    }
  }
  
  /**
   * Handle process exit
   */
  private handleProcessExit(appUuid: string, exitCode: number): void {
    const processInfo = this.processes.get(appUuid);
    if (!processInfo) return;
    
    const isCrash = exitCode !== 0;
    
    if (isCrash) {
      processInfo.crashCount++;
      processInfo.lastCrashTime = Date.now();
      processInfo.status = 'crashed';
      
      console.error(`[ProcessIsolation] Process crashed: ${appUuid} (count: ${processInfo.crashCount})`);
      this.emit('process-crashed', processInfo);
      
      // Attempt restart if under limit
      if (processInfo.crashCount < processInfo.resourceLimits.maxRestarts) {
        console.log(`[ProcessIsolation] Attempting restart for ${appUuid}...`);
        setTimeout(() => this.restartProcess(appUuid), 1000);
      } else {
        console.error(`[ProcessIsolation] Max restarts exceeded for ${appUuid}`);
        this.emit('process-failed', processInfo);
      }
    } else {
      processInfo.status = 'terminated';
      this.emit('process-terminated', processInfo);
    }
    
    // Close window if still open
    if (processInfo.window && !processInfo.window.isDestroyed()) {
      processInfo.window.close();
    }
  }
  
  /**
   * Check resource limits
   */
  private checkResourceLimits(processInfo: ProcessInfo, usage: any): void {
    const { resourceLimits } = processInfo;
    
    // Check memory limit
    if (usage.memoryMB > resourceLimits.maxMemoryMB) {
      console.warn(
        `[ProcessIsolation] Memory limit exceeded for ${processInfo.appUuid}: ` +
        `${usage.memoryMB}MB > ${resourceLimits.maxMemoryMB}MB`
      );
      this.emit('resource-limit-exceeded', processInfo, 'memory', usage.memoryMB);
      
      // Terminate process
      this.terminateProcess(processInfo.appUuid);
    }
    
    // Check CPU limit
    if (usage.cpuPercent > resourceLimits.maxCpuPercent) {
      console.warn(
        `[ProcessIsolation] CPU limit exceeded for ${processInfo.appUuid}: ` +
        `${usage.cpuPercent}% > ${resourceLimits.maxCpuPercent}%`
      );
      this.emit('resource-limit-exceeded', processInfo, 'cpu', usage.cpuPercent);
    }
  }
  
  /**
   * Restart crashed process
   */
  private async restartProcess(appUuid: string): Promise<void> {
    const processInfo = this.processes.get(appUuid);
    if (!processInfo) return;
    
    console.log(`[ProcessIsolation] Restarting process: ${appUuid}`);
    
    // Remove old process
    this.processes.delete(appUuid);
    
    // Create new process
    try {
      await this.createProcess(processInfo.manifest, processInfo.resourceLimits);
      this.emit('process-restarted', appUuid);
    } catch (error) {
      console.error(`[ProcessIsolation] Failed to restart ${appUuid}:`, error);
      this.emit('process-restart-failed', appUuid, error);
    }
  }
  
  /**
   * Terminate process
   */
  terminateProcess(appUuid: string): void {
    const processInfo = this.processes.get(appUuid);
    if (!processInfo) return;
    
    console.log(`[ProcessIsolation] Terminating process: ${appUuid}`);
    
    // Close window
    if (processInfo.window && !processInfo.window.isDestroyed()) {
      processInfo.window.close();
    }
    
    // Kill utility process
    if (processInfo.utilityProcess) {
      processInfo.utilityProcess.kill();
    }
    
    // Remove from map
    this.processes.delete(appUuid);
    
    this.emit('process-terminated', processInfo);
  }
  
  /**
   * Get process info
   */
  getProcess(appUuid: string): ProcessInfo | undefined {
    return this.processes.get(appUuid);
  }
  
  /**
   * Get all processes
   */
  getAllProcesses(): ProcessInfo[] {
    return Array.from(this.processes.values());
  }
  
  /**
   * Get process statistics
   */
  getStatistics() {
    const processes = this.getAllProcesses();
    
    return {
      totalProcesses: processes.length,
      runningProcesses: processes.filter(p => p.status === 'running').length,
      crashedProcesses: processes.filter(p => p.status === 'crashed').length,
      totalCrashes: processes.reduce((sum, p) => sum + p.crashCount, 0),
      averageUptime: processes.reduce((sum, p) => sum + (Date.now() - p.startTime), 0) / processes.length,
      processes: processes.map(p => ({
        appUuid: p.appUuid,
        appName: p.appName,
        pid: p.pid,
        status: p.status,
        uptime: Date.now() - p.startTime,
        crashCount: p.crashCount
      }))
    };
  }
  
  /**
   * Setup IPC handlers
   */
  private setupIPCHandlers(): void {
    // Handle process creation requests
    ipcMain.handle('process:create', async (event, manifest, limits) => {
      try {
        const processInfo = await this.createProcess(manifest, limits);
        return { success: true, processInfo };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    // Handle process termination requests
    ipcMain.handle('process:terminate', async (event, appUuid) => {
      this.terminateProcess(appUuid);
      return { success: true };
    });
    
    // Handle process info requests
    ipcMain.handle('process:get-info', async (event, appUuid) => {
      const processInfo = this.getProcess(appUuid);
      return processInfo || null;
    });
    
    // Handle statistics requests
    ipcMain.handle('process:get-stats', async () => {
      return this.getStatistics();
    });
  }
  
  /**
   * Shutdown all processes
   */
  async shutdown(): Promise<void> {
    console.log('[ProcessIsolation] Shutting down all processes...');
    
    const processes = this.getAllProcesses();
    for (const processInfo of processes) {
      this.terminateProcess(processInfo.appUuid);
    }
    
    this.processes.clear();
  }
}
