import { AppIntent, AppMetadata, IntentResolution, TargetApp } from './types/Intent';
import { Context } from './types/Context';

/**
 * Intent handler registration
 */
export interface IntentHandlerRegistration {
  appId: string;
  intent: string;
  handler: (context: Context) => Promise<IntentResolution>;
}

/**
 * Intent Resolver - resolves intents to handler applications
 */
export class IntentResolver {
  private intentHandlers: Map<string, IntentHandlerRegistration[]> = new Map();
  private appMetadata: Map<string, AppMetadata> = new Map();
  
  /**
   * Register an intent handler
   */
  registerIntentHandler(registration: IntentHandlerRegistration): void {
    const { intent } = registration;
    
    if (!this.intentHandlers.has(intent)) {
      this.intentHandlers.set(intent, []);
    }
    
    this.intentHandlers.get(intent)!.push(registration);
  }
  
  /**
   * Unregister intent handler
   */
  unregisterIntentHandler(appId: string, intent: string): void {
    const handlers = this.intentHandlers.get(intent);
    
    if (handlers) {
      const filtered = handlers.filter(h => h.appId !== appId);
      if (filtered.length > 0) {
        this.intentHandlers.set(intent, filtered);
      } else {
        this.intentHandlers.delete(intent);
      }
    }
  }
  
  /**
   * Register app metadata
   */
  registerAppMetadata(metadata: AppMetadata): void {
    this.appMetadata.set(metadata.appId, metadata);
  }
  
  /**
   * Find handlers for an intent
   */
  findIntentHandlers(intent: string, context?: Context): IntentHandlerRegistration[] {
    const handlers = this.intentHandlers.get(intent) || [];
    
    // TODO: Filter by context type if provided
    return handlers;
  }
  
  /**
   * Resolve intent to specific handler
   */
  async resolveIntent(
    intent: string,
    context: Context,
    target?: TargetApp
  ): Promise<IntentResolution> {
    const handlers = this.findIntentHandlers(intent, context);
    
    if (handlers.length === 0) {
      throw new Error(`No handlers found for intent: ${intent}`);
    }
    
    let selectedHandler: IntentHandlerRegistration;
    
    if (target) {
      // Find specific target
      selectedHandler = handlers.find(h => h.appId === target.appId)!;
      if (!selectedHandler) {
        throw new Error(`Target app ${target.appId} does not handle intent ${intent}`);
      }
    } else if (handlers.length === 1) {
      // Only one handler, use it
      selectedHandler = handlers[0];
    } else {
      // Multiple handlers - show resolver UI
      selectedHandler = await this.showResolverUI(intent, handlers);
    }
    
    // Execute handler
    return await selectedHandler.handler(context);
  }
  
  /**
   * Get app intents
   */
  getAppIntents(context?: Context): AppIntent[] {
    const intents: AppIntent[] = [];
    
    for (const [intentName, handlers] of this.intentHandlers.entries()) {
      const apps = handlers.map(h => {
        const metadata = this.appMetadata.get(h.appId);
        return metadata || {
          appId: h.appId,
          name: h.appId
        };
      });
      
      intents.push({
        intent: intentName,
        apps
      });
    }
    
    return intents;
  }
  
  /**
   * Show resolver UI for multiple handlers
   */
  private async showResolverUI(
    intent: string,
    handlers: IntentHandlerRegistration[]
  ): Promise<IntentHandlerRegistration> {
    // For now, just return first handler
    // In production, this would show a UI dialog
    console.log(`Multiple handlers for ${intent}, showing resolver UI...`);
    return handlers[0];
  }
}
