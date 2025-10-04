import { Notification } from 'electron';
import { IService } from './ServiceRegistry';
import { SecurityManager } from './SecurityManager';

/**
 * Notification options
 */
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: NotificationAction[];
}

/**
 * Notification action
 */
export interface NotificationAction {
  type: string;
  text: string;
}

/**
 * Notification click handler
 */
export type NotificationClickHandler = (action?: string) => void;

/**
 * Notification Service
 * Handles native OS notifications with permission integration
 */
export class NotificationService implements IService {
  private notifications: Map<string, Notification> = new Map();
  private clickHandlers: Map<string, NotificationClickHandler> = new Map();
  private appNotifications: Map<string, Set<string>> = new Map(); // appId -> notificationIds
  private securityManager?: SecurityManager;
  
  constructor(securityManager?: SecurityManager) {
    this.securityManager = securityManager;
  }
  
  async initialize(): Promise<void> {
    console.log('NotificationService initialized');
  }
  
  async shutdown(): Promise<void> {
    // Close all notifications
    for (const notification of this.notifications.values()) {
      notification.close();
    }
    this.notifications.clear();
    this.clickHandlers.clear();
  }
  
  /**
   * Show a notification
   * Checks permissions before displaying
   */
  async showNotification(
    appId: string,
    options: NotificationOptions,
    clickHandler?: NotificationClickHandler
  ): Promise<string> {
    // Check permission
    if (this.securityManager) {
      const hasPermission = await this.securityManager.validatePermission(appId, {
        type: 'notifications',
        granted: false
      });
      
      if (!hasPermission) {
        throw new Error(`Application ${appId} does not have notification permission`);
      }
    }
    
    const notificationId = this.generateNotificationId();
    
    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon,
      silent: options.silent,
      urgency: options.urgency
    });
    
    // Store notification
    this.notifications.set(notificationId, notification);
    
    // Track notification by app
    if (!this.appNotifications.has(appId)) {
      this.appNotifications.set(appId, new Set());
    }
    this.appNotifications.get(appId)!.add(notificationId);
    
    // Store click handler
    if (clickHandler) {
      this.clickHandlers.set(notificationId, clickHandler);
    }
    
    // Handle click
    notification.on('click', () => {
      const handler = this.clickHandlers.get(notificationId);
      if (handler) {
        handler();
      }
    });
    
    // Handle action
    notification.on('action', (event, index) => {
      const handler = this.clickHandlers.get(notificationId);
      if (handler && options.actions) {
        handler(options.actions[index].type);
      }
    });
    
    // Handle close
    notification.on('close', () => {
      this.notifications.delete(notificationId);
      this.clickHandlers.delete(notificationId);
      
      // Remove from app tracking
      const appNotifs = this.appNotifications.get(appId);
      if (appNotifs) {
        appNotifs.delete(notificationId);
        if (appNotifs.size === 0) {
          this.appNotifications.delete(appId);
        }
      }
    });
    
    // Show notification
    notification.show();
    
    return notificationId;
  }
  
  /**
   * Close a notification
   */
  async closeNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);
    
    if (notification) {
      notification.close();
      this.notifications.delete(notificationId);
      this.clickHandlers.delete(notificationId);
    }
  }
  
  /**
   * Close all notifications for an application
   */
  async closeApplicationNotifications(appId: string): Promise<void> {
    const notificationIds = this.appNotifications.get(appId);
    
    if (notificationIds) {
      for (const notificationId of notificationIds) {
        await this.closeNotification(notificationId);
      }
      this.appNotifications.delete(appId);
    }
  }
  
  /**
   * Get all active notifications for an application
   */
  getApplicationNotifications(appId: string): string[] {
    const notificationIds = this.appNotifications.get(appId);
    return notificationIds ? Array.from(notificationIds) : [];
  }
  
  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
