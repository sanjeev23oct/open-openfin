import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { RuntimeVersionManager } from './RuntimeVersionManager';
import { RuntimeProcess, LaunchArgs } from './types';

/**
 * Launches runtime processes
 */
export class RuntimeLauncher {
  private runningProcesses: Map<string, RuntimeProcessImpl> = new Map();
  
  constructor(private versionManager: RuntimeVersionManager) {}
  
  /**
   * Launch a runtime with specified version
   */
  async launchRuntime(version: string, args: LaunchArgs = {}): Promise<RuntimeProcess> {
    // Check if version is installed
    if (!this.versionManager.isVersionInstalled(version)) {
      throw new Error(`Runtime version ${version} is not installed`);
    }
    
    const versionData = this.versionManager.getVersion(version);
    if (!versionData) {
      throw new Error(`Failed to get version data for ${version}`);
    }
    
    // Allocate port if not specified
    const port = args.port || await this.allocatePort();
    
    // Build runtime executable path
    const runtimePath = path.join(versionData.path, 'bin', 'runtime.exe');
    
    // Build command line arguments
    const cmdArgs = this.buildCommandArgs(port, args);
    
    // Spawn runtime process
    const childProcess = spawn(runtimePath, cmdArgs, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Create runtime process wrapper
    const runtimeProcess = new RuntimeProcessImpl(
      version,
      childProcess,
      port
    );
    
    // Track running process
    this.runningProcesses.set(version, runtimeProcess);
    
    // Handle process exit
    childProcess.on('exit', (code) => {
      this.runningProcesses.delete(version);
    });
    
    // Wait for runtime to be ready
    await this.waitForReady(port);
    
    return runtimeProcess;
  }
  
  /**
   * Get running runtime process
   */
  getRunningProcess(version: string): RuntimeProcess | undefined {
    return this.runningProcesses.get(version);
  }
  
  /**
   * Shutdown all running runtimes
   */
  async shutdownAll(): Promise<void> {
    const shutdownPromises = Array.from(this.runningProcesses.values())
      .map(process => process.shutdown());
    
    await Promise.all(shutdownPromises);
  }
  
  /**
   * Build command line arguments
   */
  private buildCommandArgs(port: number, args: LaunchArgs): string[] {
    const cmdArgs: string[] = [
      '--port', port.toString()
    ];
    
    if (args.config) {
      cmdArgs.push('--config', args.config);
    }
    
    if (args.logLevel) {
      cmdArgs.push('--log-level', args.logLevel);
    }
    
    // Add any additional arguments
    for (const [key, value] of Object.entries(args)) {
      if (key !== 'port' && key !== 'config' && key !== 'logLevel') {
        cmdArgs.push(`--${key}`, String(value));
      }
    }
    
    return cmdArgs;
  }
  
  /**
   * Allocate an available port
   */
  private async allocatePort(): Promise<number> {
    // Simple port allocation - start from 9000
    const basePort = 9000;
    const usedPorts = Array.from(this.runningProcesses.values()).map(p => p.port);
    
    for (let port = basePort; port < basePort + 1000; port++) {
      if (!usedPorts.includes(port)) {
        return port;
      }
    }
    
    throw new Error('No available ports');
  }
  
  /**
   * Wait for runtime to be ready
   */
  private async waitForReady(port: number, timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        // Try to connect to runtime (simplified check)
        await new Promise(resolve => setTimeout(resolve, 100));
        // In production, actually check if runtime is responding
        return;
      } catch {
        // Continue waiting
      }
    }
    
    throw new Error('Runtime failed to start within timeout');
  }
}

/**
 * Runtime process implementation
 */
class RuntimeProcessImpl implements RuntimeProcess {
  constructor(
    public version: string,
    private childProcess: ChildProcess,
    public port: number
  ) {}
  
  get pid(): number {
    return this.childProcess.pid || 0;
  }
  
  async shutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.childProcess.pid) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        // Force kill if graceful shutdown fails
        this.childProcess.kill('SIGKILL');
        reject(new Error('Runtime shutdown timeout'));
      }, 5000);
      
      this.childProcess.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      
      // Send graceful shutdown signal
      this.childProcess.kill('SIGTERM');
    });
  }
}
