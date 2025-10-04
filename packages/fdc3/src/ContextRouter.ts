import { Context, ContextHandler } from './types/Context';
import { Listener } from './types/Listener';

/**
 * Context subscription
 */
interface ContextSubscription {
  id: string;
  appId: string;
  contextType: string;
  handler: ContextHandler;
}

/**
 * Context Router - routes context messages to subscribers
 */
export class ContextRouter {
  private subscriptions: Map<string, ContextSubscription> = new Map();
  private subscriptionsByType: Map<string, Set<string>> = new Map();
  private subscriptionsByApp: Map<string, Set<string>> = new Map();
  
  /**
   * Subscribe to context type
   */
  subscribe(
    appId: string,
    contextType: string | null,
    handler: ContextHandler
  ): Listener {
    const subscriptionId = this.generateSubscriptionId();
    const type = contextType || '*';
    
    const subscription: ContextSubscription = {
      id: subscriptionId,
      appId,
      contextType: type,
      handler
    };
    
    // Store subscription
    this.subscriptions.set(subscriptionId, subscription);
    
    // Index by type
    if (!this.subscriptionsByType.has(type)) {
      this.subscriptionsByType.set(type, new Set());
    }
    this.subscriptionsByType.get(type)!.add(subscriptionId);
    
    // Index by app
    if (!this.subscriptionsByApp.has(appId)) {
      this.subscriptionsByApp.set(appId, new Set());
    }
    this.subscriptionsByApp.get(appId)!.add(subscriptionId);
    
    return {
      unsubscribe: () => {
        this.unsubscribe(subscriptionId);
      }
    };
  }
  
  /**
   * Unsubscribe
   */
  private unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (!subscription) {
      return;
    }
    
    // Remove from indexes
    this.subscriptionsByType.get(subscription.contextType)?.delete(subscriptionId);
    this.subscriptionsByApp.get(subscription.appId)?.delete(subscriptionId);
    
    // Remove subscription
    this.subscriptions.delete(subscriptionId);
  }
  
  /**
   * Route context to subscribers
   */
  async routeContext(context: Context, excludeAppId?: string): Promise<void> {
    // Get subscribers for this context type
    const typeSubscribers = this.subscriptionsByType.get(context.type) || new Set();
    const allSubscribers = this.subscriptionsByType.get('*') || new Set();
    
    const subscriberIds = new Set([...typeSubscribers, ...allSubscribers]);
    
    // Notify subscribers
    for (const subscriptionId of subscriberIds) {
      const subscription = this.subscriptions.get(subscriptionId);
      
      if (!subscription) {
        continue;
      }
      
      // Skip excluded app
      if (excludeAppId && subscription.appId === excludeAppId) {
        continue;
      }
      
      try {
        await subscription.handler(context);
      } catch (error) {
        console.error(`Context handler error for ${subscription.appId}:`, error);
      }
    }
  }
  
  /**
   * Unsubscribe all for an app
   */
  unsubscribeApp(appId: string): void {
    const subscriptionIds = this.subscriptionsByApp.get(appId);
    
    if (!subscriptionIds) {
      return;
    }
    
    for (const subscriptionId of subscriptionIds) {
      this.unsubscribe(subscriptionId);
    }
  }
  
  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
