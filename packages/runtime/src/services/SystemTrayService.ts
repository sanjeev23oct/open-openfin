import { Tray, Menu, nativeImage, app } from 'electron';
import { IService } from './ServiceRegistry';

/**
 * System tray menu item
 */
export interface TrayMenuItem {
  id: string;
  label: string;
  type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
  enabled?: boolean;
  visible?: boolean;
  checked?: boolean;
  submenu?: TrayMenuItem[];
  click?: () => void;
}

/**
 * System tray options
 */
export interface SystemTrayOptions {
  icon: string;
  tooltip?: string;
  menu?: TrayMenuItem[];
}

/**
 * System Tray Service
 * Manages system tray icon and menu
 */
export class SystemTrayService implements IService {
  private tray: Tray | null = null;
  private menuItems: Map<string, TrayMenuItem> = new Map();
  private clickHandlers: Map<string, () => void> = new Map();
  
  async initialize(): Promise<void> {
    console.log('SystemTrayService initialized');
  }
  
  async shutdown(): Promise<void> {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    this.menuItems.clear();
    this.clickHandlers.clear();
  }
  
  /**
   * Create or update system tray
   */
  async createTray(options: SystemTrayOptions): Promise<void> {
    // Create tray if it doesn't exist
    if (!this.tray) {
      const icon = nativeImage.createFromPath(options.icon);
      this.tray = new Tray(icon);
      
      // Handle tray click
      this.tray.on('click', () => {
        // Show/hide main window or show menu
        if (this.tray) {
          this.tray.popUpContextMenu();
        }
      });
    } else {
      // Update icon
      const icon = nativeImage.createFromPath(options.icon);
      this.tray.setImage(icon);
    }
    
    // Set tooltip
    if (options.tooltip) {
      this.tray.setToolTip(options.tooltip);
    }
    
    // Build and set menu
    if (options.menu) {
      const menu = this.buildMenu(options.menu);
      this.tray.setContextMenu(menu);
    }
  }
  
  /**
   * Update tray icon
   */
  async updateIcon(iconPath: string): Promise<void> {
    if (this.tray) {
      const icon = nativeImage.createFromPath(iconPath);
      this.tray.setImage(icon);
    }
  }
  
  /**
   * Update tray tooltip
   */
  async updateTooltip(tooltip: string): Promise<void> {
    if (this.tray) {
      this.tray.setToolTip(tooltip);
    }
  }
  
  /**
   * Update tray menu
   */
  async updateMenu(menuItems: TrayMenuItem[]): Promise<void> {
    if (this.tray) {
      const menu = this.buildMenu(menuItems);
      this.tray.setContextMenu(menu);
    }
  }
  
  /**
   * Add menu item
   */
  async addMenuItem(item: TrayMenuItem, position?: number): Promise<void> {
    this.menuItems.set(item.id, item);
    
    if (item.click) {
      this.clickHandlers.set(item.id, item.click);
    }
    
    // Rebuild menu
    const allItems = Array.from(this.menuItems.values());
    if (position !== undefined) {
      allItems.splice(position, 0, item);
    }
    
    await this.updateMenu(allItems);
  }
  
  /**
   * Remove menu item
   */
  async removeMenuItem(itemId: string): Promise<void> {
    this.menuItems.delete(itemId);
    this.clickHandlers.delete(itemId);
    
    // Rebuild menu
    const allItems = Array.from(this.menuItems.values());
    await this.updateMenu(allItems);
  }
  
  /**
   * Destroy tray
   */
  async destroyTray(): Promise<void> {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    this.menuItems.clear();
    this.clickHandlers.clear();
  }
  
  /**
   * Build Electron menu from menu items
   */
  private buildMenu(items: TrayMenuItem[]): Menu {
    const template = items.map(item => this.buildMenuItem(item));
    return Menu.buildFromTemplate(template);
  }
  
  /**
   * Build Electron menu item
   */
  private buildMenuItem(item: TrayMenuItem): Electron.MenuItemConstructorOptions {
    const menuItem: Electron.MenuItemConstructorOptions = {
      id: item.id,
      label: item.label,
      type: item.type || 'normal',
      enabled: item.enabled !== false,
      visible: item.visible !== false,
      checked: item.checked
    };
    
    // Handle click
    if (item.click) {
      menuItem.click = item.click;
    }
    
    // Handle submenu
    if (item.submenu) {
      menuItem.submenu = item.submenu.map(subItem => this.buildMenuItem(subItem));
    }
    
    return menuItem;
  }
  
  /**
   * Create default application menu
   */
  createDefaultMenu(): TrayMenuItem[] {
    return [
      {
        id: 'show',
        label: 'Show Platform',
        click: () => {
          // Show main window or launcher
          console.log('Show platform clicked');
        }
      },
      {
        id: 'separator1',
        label: '',
        type: 'separator'
      },
      {
        id: 'applications',
        label: 'Applications',
        type: 'submenu',
        submenu: []
      },
      {
        id: 'separator2',
        label: '',
        type: 'separator'
      },
      {
        id: 'quit',
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ];
  }
}
