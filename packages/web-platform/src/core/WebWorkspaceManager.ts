/**
 * Web Workspace Manager
 * Manages workspace persistence using browser storage
 */

import { Workspace, WorkspaceConfig } from '../types';
import { StorageManager } from '../storage/StorageManager';

export class WebWorkspaceManager {
  private currentWorkspace: Workspace | null = null;
  private storage: StorageManager;
  private autoSaveInterval: number | null = null;
  
  constructor(storage: StorageManager) {
    this.storage = storage;
  }
  
  async saveWorkspace(name: string, config?: WorkspaceConfig): Promise<Workspace> {
    console.log('[WebWorkspaceManager] Saving workspace:', name);
    
    const workspace: Workspace = {
      id: this.generateWorkspaceId(),
      name,
      config: config || this.captureCurrentState(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await this.storage.set(workspace.id, workspace, 'workspaces');
    this.currentWorkspace = workspace;
    
    return workspace;
  }
  
  async loadWorkspace(workspaceId: string): Promise<void> {
    console.log('[WebWorkspaceManager] Loading workspace:', workspaceId);
    
    const workspace = await this.storage.get(workspaceId, 'workspaces');
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    this.currentWorkspace = workspace;
    
    // TODO: Restore applications from workspace config
    // This would be handled by WebPlatformCore
  }
  
  async getWorkspaces(): Promise<Workspace[]> {
    const keys = await this.storage.keys('workspaces');
    const workspaces: Workspace[] = [];
    
    for (const key of keys) {
      const workspace = await this.storage.get(key, 'workspaces');
      if (workspace) {
        workspaces.push(workspace);
      }
    }
    
    return workspaces.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  
  async deleteWorkspace(workspaceId: string): Promise<void> {
    console.log('[WebWorkspaceManager] Deleting workspace:', workspaceId);
    await this.storage.delete(workspaceId, 'workspaces');
    
    if (this.currentWorkspace?.id === workspaceId) {
      this.currentWorkspace = null;
    }
  }
  
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }
  
  captureCurrentState(): WorkspaceConfig {
    // This will be populated by WebPlatformCore with actual window states
    return {
      applications: [],
      layout: { type: 'free' }
    };
  }
  
  async exportWorkspace(workspaceId: string): Promise<string> {
    const workspace = await this.storage.get(workspaceId, 'workspaces');
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }
    
    return JSON.stringify(workspace, null, 2);
  }
  
  async importWorkspace(json: string): Promise<Workspace> {
    const workspace = JSON.parse(json);
    workspace.id = this.generateWorkspaceId(); // New ID
    workspace.createdAt = new Date();
    workspace.updatedAt = new Date();
    
    await this.storage.set(workspace.id, workspace, 'workspaces');
    return workspace;
  }
  
  generateShareableURL(workspaceId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?workspace=${workspaceId}`;
  }
  
  enableAutoSave(interval: number = 30000): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = window.setInterval(async () => {
      if (this.currentWorkspace) {
        console.log('[WebWorkspaceManager] Auto-saving workspace');
        await this.saveWorkspace(this.currentWorkspace.name);
      }
    }, interval);
  }
  
  disableAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
  
  private generateWorkspaceId(): string {
    return `workspace-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
