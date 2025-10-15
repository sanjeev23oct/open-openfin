import { BrowserWindow, ipcMain } from 'electron';
import { Permission } from '@desktop-interop/sdk';
import * as path from 'path';

/**
 * Permission request data
 */
interface PermissionRequest {
  appUuid: string;
  appName?: string;
  permission: Permission;
  resolve: (granted: boolean) => void;
  reject: (error: Error) => void;
}

/**
 * Permission response
 */
interface PermissionResponse {
  granted: boolean;
  remember: boolean;
}

/**
 * Permission Dialog Manager
 * Handles showing user consent dialogs for permission requests
 */
export class PermissionDialogManager {
  private currentDialog: BrowserWindow | null = null;
  private pendingRequest: PermissionRequest | null = null;
  private requestQueue: PermissionRequest[] = [];
  
  constructor() {
    this.setupIPC();
  }
  
  /**
   * Setup IPC handlers
   */
  private setupIPC(): void {
    ipcMain.on('permission-response', (event, response: PermissionResponse) => {
      this.handleResponse(response);
    });
  }
  
  /**
   * Show permission dialog
   */
  async showPermissionDialog(
    appUuid: string,
    permission: Permission,
    appName?: string
  ): Promise<{ granted: boolean; remember: boolean }> {
    return new Promise((resolve, reject) => {
      const request: PermissionRequest = {
        appUuid,
        appName,
        permission,
        resolve: (granted) => resolve({ granted, remember: false }),
        reject
      };
      
      // Queue request if dialog is already showing
      if (this.currentDialog && !this.currentDialog.isDestroyed()) {
        this.requestQueue.push(request);
        return;
      }
      
      this.showDialog(request);
    });
  }
  
  /**
   * Show dialog window
   */
  private showDialog(request: PermissionRequest): void {
    this.pendingRequest = request;
    
    // Create dialog window
    this.currentDialog = new BrowserWindow({
      width: 520,
      height: 600,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      modal: true,
      show: false,
      webPreferences: {
        contextIsolation: false,
        nodeIntegration: true,
        sandbox: false
      }
    });
    
    // Load dialog HTML
    const dialogPath = path.join(__dirname, '../ui/permission-dialog.html');
    this.currentDialog.loadFile(dialogPath);
    
    // Show when ready
    this.currentDialog.once('ready-to-show', () => {
      if (this.currentDialog) {
        this.currentDialog.show();
        
        // Send permission request data
        this.currentDialog.webContents.send('permission-request', {
          appUuid: request.appUuid,
          appName: request.appName,
          permission: request.permission
        });
      }
    });
    
    // Handle window close
    this.currentDialog.on('closed', () => {
      // If no response received, default to deny
      if (this.pendingRequest) {
        this.pendingRequest.resolve(false);
        this.pendingRequest = null;
      }
      
      this.currentDialog = null;
      
      // Process next request in queue
      this.processQueue();
    });
  }
  
  /**
   * Handle permission response
   */
  private handleResponse(response: PermissionResponse): void {
    if (!this.pendingRequest) {
      return;
    }
    
    // Resolve with response
    this.pendingRequest.resolve(response.granted);
    this.pendingRequest = null;
    
    // Close dialog
    if (this.currentDialog && !this.currentDialog.isDestroyed()) {
      this.currentDialog.close();
    }
    
    // Store remember choice if needed
    if (response.remember) {
      // This will be handled by SecurityManager
    }
  }
  
  /**
   * Process next request in queue
   */
  private processQueue(): void {
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift()!;
      this.showDialog(nextRequest);
    }
  }
  
  /**
   * Close current dialog
   */
  closeDialog(): void {
    if (this.currentDialog && !this.currentDialog.isDestroyed()) {
      this.currentDialog.close();
    }
  }
  
  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.requestQueue.length;
  }
}
