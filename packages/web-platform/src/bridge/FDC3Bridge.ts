/**
 * FDC3 Bridge
 * Provides FDC3 API to applications running in iframes
 * This script is injected into each application iframe
 */

import type { Context, Listener, Channel, IntentResolution, AppIntent } from '@desktop-interop/fdc3';

interface PendingMessage {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timeout: number;
}

/**
 * FDC3 Bridge - implements FDC3 2.0 DesktopAgent API
 */
export class FDC3Bridge {
  private platformOrigin: string;
  private appId: string;
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private contextListeners: Map<string, (context: Context) => void> = new Map();
  private currentChannel: string | null = null;
  
  constructor(platformOrigin: string, appId: string) {
    this.platformOrigin = platformOrigin;
    this.appId = appId;
    this.setupMessageListener();
    
    console.log(`[FDC3Bridge] Initialized for app: ${appId}`);
  }
  
  /**
   * Setup message listener for platform responses
   */
  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      // Validate origin
      if (event.origin !== this.platformOrigin) {
        return;
      }
      
      const { type, payload, messageId, error } = event.data;
      
      // Handle responses to pending messages
      if (messageId && this.pendingMessages.has(messageId)) {
        const pending = this.pendingMessages.get(messageId)!;
        clearTimeout(pending.timeout);
        this.pendingMessages.delete(messageId);
        
        if (error) {
          pending.reject(new Error(error));
        } else {
          pending.resolve(payload);
        }
        return;
      }
      
      // Handle incoming contexts
      if (type === 'context') {
        const listenerId = payload.listenerId;
        const listener = this.contextListeners.get(listenerId);
        if (listener) {
          listener(payload.context);
        }
      }
    });
  }
  
  /**
   * Send message to platform and wait for response
   */
  private sendToPlatform(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      
      // Setup timeout (5 seconds)
      const timeout = window.setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error('Platform communication timeout'));
        }
      }, 5000);
      
      // Store pending message
      this.pendingMessages.set(messageId, { resolve, reject, timeout });
      
      // Send to platform
      window.parent.postMessage({
        ...message,
        messageId,
        appId: this.appId,
        timestamp: Date.now()
      }, this.platformOrigin);
    });
  }
  
  /**
   * FDC3 2.0 API: broadcast
   */
  async broadcast(context: Context): Promise<void> {
    console.log('[FDC3Bridge] Broadcasting context:', context);
    
    await this.sendToPlatform({
      type: 'broadcast',
      payload: { context }
    });
  }
  
  /**
   * FDC3 2.0 API: raiseIntent
   */
  async raiseIntent(intent: string, context: Context, app?: any): Promise<IntentResolution> {
    console.log('[FDC3Bridge] Raising intent:', intent, context);
    
    const result = await this.sendToPlatform({
      type: 'raiseIntent',
      payload: { intent, context, app }
    });
    
    return result;
  }
  
  /**
   * FDC3 2.0 API: raiseIntentForContext
   */
  async raiseIntentForContext(context: Context, app?: any): Promise<IntentResolution> {
    console.log('[FDC3Bridge] Raising intent for context:', context);
    
    const result = await this.sendToPlatform({
      type: 'raiseIntentForContext',
      payload: { context, app }
    });
    
    return result;
  }
  
  /**
   * FDC3 2.0 API: addContextListener
   */
  async addContextListener(
    contextType: string | null,
    handler: (context: Context) => void
  ): Promise<Listener> {
    const listenerId = this.generateListenerId();
    
    console.log('[FDC3Bridge] Adding context listener:', contextType, listenerId);
    
    // Store handler locally
    this.contextListeners.set(listenerId, handler);
    
    // Register with platform
    await this.sendToPlatform({
      type: 'addContextListener',
      payload: { contextType, listenerId }
    });
    
    // Return listener object
    return {
      unsubscribe: async () => {
        console.log('[FDC3Bridge] Unsubscribing listener:', listenerId);
        this.contextListeners.delete(listenerId);
        
        await this.sendToPlatform({
          type: 'removeContextListener',
          payload: { listenerId }
        });
      }
    };
  }
  
  /**
   * FDC3 2.0 API: addIntentListener
   */
  async addIntentListener(
    intent: string,
    handler: (context: Context) => any
  ): Promise<Listener> {
    const listenerId = this.generateListenerId();
    
    console.log('[FDC3Bridge] Adding intent listener:', intent, listenerId);
    
    // Store handler locally
    this.contextListeners.set(listenerId, handler);
    
    // Register with platform
    await this.sendToPlatform({
      type: 'addIntentListener',
      payload: { intent, listenerId }
    });
    
    return {
      unsubscribe: async () => {
        console.log('[FDC3Bridge] Unsubscribing intent listener:', listenerId);
        this.contextListeners.delete(listenerId);
        
        await this.sendToPlatform({
          type: 'removeIntentListener',
          payload: { listenerId }
        });
      }
    };
  }
  
  /**
   * FDC3 2.0 API: getUserChannels
   */
  async getUserChannels(): Promise<Channel[]> {
    console.log('[FDC3Bridge] Getting user channels');
    
    const channels = await this.sendToPlatform({
      type: 'getUserChannels',
      payload: {}
    });
    
    return channels;
  }
  
  /**
   * FDC3 2.0 API: joinUserChannel
   */
  async joinUserChannel(channelId: string): Promise<void> {
    console.log('[FDC3Bridge] Joining user channel:', channelId);
    
    await this.sendToPlatform({
      type: 'joinUserChannel',
      payload: { channelId }
    });
    
    this.currentChannel = channelId;
  }
  
  /**
   * FDC3 2.0 API: getCurrentChannel
   */
  async getCurrentChannel(): Promise<Channel | null> {
    if (!this.currentChannel) {
      return null;
    }
    
    const channel = await this.sendToPlatform({
      type: 'getChannel',
      payload: { channelId: this.currentChannel }
    });
    
    return channel;
  }
  
  /**
   * FDC3 2.0 API: leaveCurrentChannel
   */
  async leaveCurrentChannel(): Promise<void> {
    console.log('[FDC3Bridge] Leaving current channel');
    
    await this.sendToPlatform({
      type: 'leaveCurrentChannel',
      payload: {}
    });
    
    this.currentChannel = null;
  }
  
  /**
   * FDC3 2.0 API: getOrCreateChannel
   */
  async getOrCreateChannel(channelId: string): Promise<Channel> {
    console.log('[FDC3Bridge] Getting or creating channel:', channelId);
    
    const channel = await this.sendToPlatform({
      type: 'getOrCreateChannel',
      payload: { channelId }
    });
    
    return channel;
  }
  
  /**
   * FDC3 2.0 API: getAppMetadata
   */
  async getAppMetadata(app: any): Promise<any> {
    console.log('[FDC3Bridge] Getting app metadata:', app);
    
    const metadata = await this.sendToPlatform({
      type: 'getAppMetadata',
      payload: { app }
    });
    
    return metadata;
  }
  
  /**
   * FDC3 2.0 API: findIntent
   */
  async findIntent(intent: string, context?: Context): Promise<AppIntent> {
    console.log('[FDC3Bridge] Finding intent:', intent);
    
    const result = await this.sendToPlatform({
      type: 'findIntent',
      payload: { intent, context }
    });
    
    return result;
  }
  
  /**
   * FDC3 2.0 API: findIntentsByContext
   */
  async findIntentsByContext(context: Context): Promise<AppIntent[]> {
    console.log('[FDC3Bridge] Finding intents by context:', context);
    
    const result = await this.sendToPlatform({
      type: 'findIntentsByContext',
      payload: { context }
    });
    
    return result;
  }
  
  /**
   * FDC3 2.0 API: open
   */
  async open(app: any, context?: Context): Promise<any> {
    console.log('[FDC3Bridge] Opening app:', app);
    
    const result = await this.sendToPlatform({
      type: 'open',
      payload: { app, context }
    });
    
    return result;
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique listener ID
   */
  private generateListenerId(): string {
    return `listener-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Auto-inject FDC3 bridge if running in iframe
 */
if (typeof window !== 'undefined' && window.parent !== window) {
  // We're in an iframe
  const params = new URLSearchParams(window.location.search);
  const platformOrigin = params.get('platformOrigin');
  const appId = params.get('appId');
  
  if (platformOrigin && appId) {
    const bridge = new FDC3Bridge(platformOrigin, appId);
    (window as any).fdc3 = bridge;
    console.log('[FDC3Bridge] Auto-injected into iframe');
  }
}
