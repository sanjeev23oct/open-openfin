import { EventEmitter } from 'events';
import { 
  WindowGroup, 
  WindowManagementError, 
  WindowManagementErrorCode,
  Bounds 
} from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { WindowInstance } from './WindowManager';
import { GroupStateStore } from './GroupStateStore';
import { TabBarWindow, TabInfo } from './TabBarWindow';

/**
 * Window Group Manager - manages window groups and tabbing
 */
export class WindowGroupManager extends EventEmitter implements IService {
  private groups: Map<string, WindowGroup> = new Map();
  private windowToGroup: Map<string, string> = new Map();
  private tabBars: Map<string, TabBarWindow> = new Map();
  private stateStore: GroupStateStore;
  
  constructor() {
    super();
    this.stateStore = new GroupStateStore();
  }
  
  async initialize(): Promise<void> {
    console.log('WindowGroupManager initialized');
    
    // Load saved group state
    try {
      const savedGroups = await this.stateStore.load();
      
      for (const group of savedGroups) {
        this.groups.set(group.id, group);
        
        for (const windowId of group.windows) {
          this.windowToGroup.set(windowId, group.id);
        }
      }
      
      console.log(`Restored ${savedGroups.length} window groups from saved state`);
    } catch (error) {
      console.error('Failed to load saved group state:', error);
    }
  }
  
  async shutdown(): Promise<void> {
    // Save group state before shutdown
    try {
      await this.saveState();
    } catch (error) {
      console.error('Failed to save group state on shutdown:', error);
    }
    
    // Clean up all groups
    for (const group of this.groups.values()) {
      await this.destroyGroup(group.id);
    }
    this.groups.clear();
    this.windowToGroup.clear();
  }
  
  /**
   * Create a new window group
   */
  async createGroup(windowIds: string[], windowInstances: Map<string, WindowInstance>): Promise<WindowGroup> {
    if (windowIds.length < 2) {
      throw new WindowManagementError(
        'At least 2 windows required to create a group',
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'grouping',
        true
      );
    }
    
    // Validate all windows exist
    for (const windowId of windowIds) {
      if (!windowInstances.has(windowId)) {
        throw new WindowManagementError(
          `Window ${windowId} not found`,
          WindowManagementErrorCode.INVALID_WINDOW_ID,
          'grouping',
          true
        );
      }
      
      // Check if window is already in a group
      if (this.windowToGroup.has(windowId)) {
        throw new WindowManagementError(
          `Window ${windowId} is already in a group`,
          WindowManagementErrorCode.INVALID_WINDOW_ID,
          'grouping',
          true
        );
      }
    }
    
    const groupId = this.generateGroupId();
    const firstWindow = windowInstances.get(windowIds[0])!;
    
    const group: WindowGroup = {
      id: groupId,
      windows: [...windowIds],
      activeWindow: windowIds[0],
      bounds: { ...firstWindow.bounds },
      state: 'normal',
      monitor: firstWindow.monitor,
      createdAt: new Date()
    };
    
    this.groups.set(groupId, group);
    
    // Map windows to group
    for (const windowId of windowIds) {
      this.windowToGroup.set(windowId, groupId);
    }
    
    // Create tab bar
    await this.createTabBar(groupId, windowInstances);
    
    // Emit event
    this.emit('group-created', { groupId, windowIds });
    
    console.log(`Created window group ${groupId} with ${windowIds.length} windows`);
    
    return group;
  }
  
  /**
   * Add a window to an existing group
   */
  async addWindowToGroup(windowId: string, groupId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    if (!windowInstances.has(windowId)) {
      throw new WindowManagementError(
        `Window ${windowId} not found`,
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'grouping',
        true
      );
    }
    
    if (this.windowToGroup.has(windowId)) {
      throw new WindowManagementError(
        `Window ${windowId} is already in a group`,
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'grouping',
        true
      );
    }
    
    // Add window to group
    group.windows.push(windowId);
    group.updatedAt = new Date();
    this.windowToGroup.set(windowId, groupId);
    
    // Emit event
    this.emit('window-grouped', { windowId, groupId });
    
    console.log(`Added window ${windowId} to group ${groupId}`);
  }
  
  /**
   * Remove a window from its group
   */
  async removeWindowFromGroup(windowId: string): Promise<void> {
    const groupId = this.windowToGroup.get(windowId);
    
    if (!groupId) {
      // Window is not in a group, nothing to do
      return;
    }
    
    const group = this.groups.get(groupId);
    
    if (!group) {
      // Group doesn't exist, clean up mapping
      this.windowToGroup.delete(windowId);
      return;
    }
    
    // Remove window from group
    group.windows = group.windows.filter(id => id !== windowId);
    group.updatedAt = new Date();
    this.windowToGroup.delete(windowId);
    
    // If active window was removed, set new active window
    if (group.activeWindow === windowId && group.windows.length > 0) {
      group.activeWindow = group.windows[0];
    }
    
    // If group has less than 2 windows, destroy it
    if (group.windows.length < 2) {
      await this.destroyGroup(groupId);
    }
    
    // Emit event
    this.emit('window-ungrouped', { windowId, groupId });
    
    console.log(`Removed window ${windowId} from group ${groupId}`);
  }
  
  /**
   * Get the group a window belongs to
   */
  getWindowGroup(windowId: string): WindowGroup | null {
    const groupId = this.windowToGroup.get(windowId);
    
    if (!groupId) {
      return null;
    }
    
    return this.groups.get(groupId) || null;
  }
  
  /**
   * Get a group by ID
   */
  getGroup(groupId: string): WindowGroup | null {
    return this.groups.get(groupId) || null;
  }
  
  /**
   * List all groups
   */
  listGroups(): WindowGroup[] {
    return Array.from(this.groups.values());
  }
  
  /**
   * Set the active window in a group
   */
  async setActiveWindow(groupId: string, windowId: string): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    if (!group.windows.includes(windowId)) {
      throw new WindowManagementError(
        `Window ${windowId} is not in group ${groupId}`,
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'grouping',
        true
      );
    }
    
    const previousActive = group.activeWindow;
    group.activeWindow = windowId;
    group.updatedAt = new Date();
    
    // Emit event
    this.emit('tab-switched', { groupId, windowId, previousActive });
    
    console.log(`Set active window in group ${groupId} to ${windowId}`);
  }
  
  /**
   * Reorder windows in a group
   */
  async reorderWindows(groupId: string, windowIds: string[]): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    // Validate all windows are in the group
    if (windowIds.length !== group.windows.length) {
      throw new WindowManagementError(
        'Window count mismatch',
        WindowManagementErrorCode.INVALID_WINDOW_ID,
        'grouping',
        true
      );
    }
    
    for (const windowId of windowIds) {
      if (!group.windows.includes(windowId)) {
        throw new WindowManagementError(
          `Window ${windowId} is not in group ${groupId}`,
          WindowManagementErrorCode.INVALID_WINDOW_ID,
          'grouping',
          true
        );
      }
    }
    
    group.windows = [...windowIds];
    group.updatedAt = new Date();
    
    // Emit event
    this.emit('tabs-reordered', { groupId, windowIds });
    
    console.log(`Reordered windows in group ${groupId}`);
  }
  
  /**
   * Close a group with specified action
   */
  async closeGroup(groupId: string, action: 'closeAll' | 'ungroup'): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    if (action === 'ungroup') {
      // Just ungroup, don't close windows
      for (const windowId of group.windows) {
        this.windowToGroup.delete(windowId);
      }
    }
    
    this.groups.delete(groupId);
    
    // Emit event
    this.emit('group-closed', { groupId, action });
    
    console.log(`Closed group ${groupId} with action: ${action}`);
  }
  
  /**
   * Destroy a group (internal cleanup)
   */
  private async destroyGroup(groupId: string): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      return;
    }
    
    // Destroy tab bar
    this.destroyTabBar(groupId);
    
    // Clean up window mappings
    for (const windowId of group.windows) {
      this.windowToGroup.delete(windowId);
    }
    
    this.groups.delete(groupId);
    
    console.log(`Destroyed group ${groupId}`);
  }
  
  /**
   * Move a group to a new position
   */
  async moveGroup(groupId: string, x: number, y: number, windowInstances: Map<string, WindowInstance>): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    // Calculate offset from current position
    const offsetX = x - group.bounds.x;
    const offsetY = y - group.bounds.y;
    
    // Move all windows in the group
    for (const windowId of group.windows) {
      const windowInstance = windowInstances.get(windowId);
      
      if (windowInstance && !windowInstance.browserWindow.isDestroyed()) {
        const currentBounds = windowInstance.browserWindow.getBounds();
        windowInstance.browserWindow.setBounds({
          x: currentBounds.x + offsetX,
          y: currentBounds.y + offsetY,
          width: currentBounds.width,
          height: currentBounds.height
        });
      }
    }
    
    // Update group bounds
    group.bounds.x = x;
    group.bounds.y = y;
    group.bounds.left = x;
    group.bounds.top = y;
    group.bounds.right = x + group.bounds.width;
    group.bounds.bottom = y + group.bounds.height;
    group.updatedAt = new Date();
    
    // Emit event
    this.emit('group-moved', { groupId, x, y });
    
    console.log(`Moved group ${groupId} to (${x}, ${y})`);
  }
  
  /**
   * Resize a group
   */
  async resizeGroup(groupId: string, width: number, height: number, windowInstances: Map<string, WindowInstance>): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      throw new WindowManagementError(
        `Group ${groupId} not found`,
        WindowManagementErrorCode.GROUP_NOT_FOUND,
        'grouping',
        true
      );
    }
    
    // Calculate scale factors
    const scaleX = width / group.bounds.width;
    const scaleY = height / group.bounds.height;
    
    // Resize all windows in the group proportionally
    for (const windowId of group.windows) {
      const windowInstance = windowInstances.get(windowId);
      
      if (windowInstance && !windowInstance.browserWindow.isDestroyed()) {
        const currentBounds = windowInstance.browserWindow.getBounds();
        
        // Calculate new position relative to group
        const relativeX = currentBounds.x - group.bounds.x;
        const relativeY = currentBounds.y - group.bounds.y;
        
        const newBounds = {
          x: group.bounds.x + (relativeX * scaleX),
          y: group.bounds.y + (relativeY * scaleY),
          width: currentBounds.width * scaleX,
          height: currentBounds.height * scaleY
        };
        
        windowInstance.browserWindow.setBounds(newBounds);
      }
    }
    
    // Update group bounds
    group.bounds.width = width;
    group.bounds.height = height;
    group.bounds.right = group.bounds.x + width;
    group.bounds.bottom = group.bounds.y + height;
    group.updatedAt = new Date();
    
    // Emit event
    this.emit('group-resized', { groupId, width, height });
    
    console.log(`Resized group ${groupId} to ${width}x${height}`);
  }
  
  /**
   * Update group bounds based on window changes
   */
  updateGroupBounds(groupId: string, windowInstances: Map<string, WindowInstance>): void {
    const group = this.groups.get(groupId);
    
    if (!group || group.windows.length === 0) {
      return;
    }
    
    // Calculate bounding box of all windows in group
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const windowId of group.windows) {
      const windowInstance = windowInstances.get(windowId);
      
      if (windowInstance && !windowInstance.browserWindow.isDestroyed()) {
        const bounds = windowInstance.browserWindow.getBounds();
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
      }
    }
    
    if (minX !== Infinity) {
      group.bounds = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        left: minX,
        top: minY,
        right: maxX,
        bottom: maxY
      };
      group.updatedAt = new Date();
    }
  }
  
  /**
   * Save current group state to disk
   */
  async saveState(): Promise<void> {
    const groups = Array.from(this.groups.values());
    await this.stateStore.save(groups);
  }
  
  /**
   * Load group state from disk
   */
  async loadState(): Promise<WindowGroup[]> {
    return await this.stateStore.load();
  }
  
  /**
   * Clear saved group state
   */
  async clearState(): Promise<void> {
    await this.stateStore.clear();
  }
  
  /**
   * Create tab bar for a group
   */
  private async createTabBar(groupId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    const group = this.groups.get(groupId);
    
    if (!group) {
      return;
    }
    
    // Position tab bar above the group
    const tabBarX = group.bounds.x;
    const tabBarY = group.bounds.y - 32; // 32px height for tab bar
    const tabBarWidth = group.bounds.width;
    
    const tabBar = new TabBarWindow(groupId, tabBarX, tabBarY, tabBarWidth);
    
    // Set up event handlers
    tabBar.on('tab-click', (windowId: string) => {
      this.handleTabClick(groupId, windowId, windowInstances);
    });
    
    tabBar.on('tab-close', (windowId: string) => {
      this.handleTabClose(groupId, windowId);
    });
    
    tabBar.on('tab-drag-start', (windowId: string) => {
      this.emit('tab-drag-start', { groupId, windowId });
    });
    
    tabBar.on('tab-drag-end', (data: { windowId: string; x: number; y: number }) => {
      this.handleTabDragOut(groupId, data.windowId, data.x, data.y);
    });
    
    tabBar.on('tab-reorder', (windowIds: string[]) => {
      this.reorderWindows(groupId, windowIds);
    });
    
    this.tabBars.set(groupId, tabBar);
    
    // Update tab bar with window info
    this.updateTabBar(groupId, windowInstances);
  }
  
  /**
   * Update tab bar with current window information
   */
  private updateTabBar(groupId: string, windowInstances: Map<string, WindowInstance>): void {
    const group = this.groups.get(groupId);
    const tabBar = this.tabBars.get(groupId);
    
    if (!group || !tabBar) {
      return;
    }
    
    const tabs: TabInfo[] = group.windows.map(windowId => {
      const windowInstance = windowInstances.get(windowId);
      return {
        windowId,
        title: windowInstance?.browserWindow.getTitle() || 'Untitled',
        icon: windowInstance?.options.icon,
        isActive: windowId === group.activeWindow
      };
    });
    
    tabBar.updateTabs(tabs);
  }
  
  /**
   * Handle tab click
   */
  private async handleTabClick(groupId: string, windowId: string, windowInstances: Map<string, WindowInstance>): Promise<void> {
    await this.setActiveWindow(groupId, windowId);
    
    // Bring window to front
    const windowInstance = windowInstances.get(windowId);
    if (windowInstance && !windowInstance.browserWindow.isDestroyed()) {
      windowInstance.browserWindow.focus();
      windowInstance.browserWindow.show();
    }
    
    // Update tab bar
    this.updateTabBar(groupId, windowInstances);
  }
  
  /**
   * Handle tab close
   */
  private async handleTabClose(groupId: string, windowId: string): Promise<void> {
    await this.removeWindowFromGroup(windowId);
  }
  
  /**
   * Handle tab drag out
   */
  private async handleTabDragOut(groupId: string, windowId: string, x: number, y: number): Promise<void> {
    await this.removeWindowFromGroup(windowId);
    this.emit('tab-dragged-out', { groupId, windowId, x, y });
  }
  
  /**
   * Destroy tab bar for a group
   */
  private destroyTabBar(groupId: string): void {
    const tabBar = this.tabBars.get(groupId);
    
    if (tabBar) {
      tabBar.close();
      this.tabBars.delete(groupId);
    }
  }
  
  /**
   * Generate unique group ID
   */
  private generateGroupId(): string {
    return `group-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
