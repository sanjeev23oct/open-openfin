/**
 * PostMessage Router
 * Routes FDC3 messages between platform and iframes using postMessage
 */

import { BridgeMessage } from '../types';
import { ChannelManager } from '@desktop-interop/fdc3-core';
import { IntentResolver } from '@desktop-interop/fdc3-core';
import { ContextRouter } from '@desktop-interop/fdc3-core';
import { fdc3Monitor } from '../diagnostics/FDC3Monitor';

// Define Context type locally to avoid import issues
type Context = {
  type: string;
  [key: string]: any;
};

export class PostMessageRouter {
  private registeredApps: Map<string, HTMLIFrameElement> = new Map();
  private appChannels: Map<string, string> = new Map(); // appId -> channelId
  private channelManager: ChannelManager;
  private intentResolver: IntentResolver;
  private contextRouter: ContextRouter;
  private trustedOrigins: Set<string> = new Set();
  private appOrigins: Map<string, string> = new Map(); // appId -> origin
  
  constructor(trustedOrigins?: string[]) {
    this.channelManager = new ChannelManager();
    this.intentResolver = new IntentResolver();
    this.contextRouter = new ContextRouter();
    
    // SECURITY FIX: No more wildcard origins!
    // Always trust same origin
    this.trustedOrigins.add(window.location.origin);
    
    // Add configured trusted origins
    if (trustedOrigins) {
      trustedOrigins.forEach(origin => this.trustedOrigins.add(origin));
    }
    
    console.log('[PostMessageRouter] Trusted origins:', Array.from(this.trustedOrigins));
    
    this.setupMessageListener();
  }
  
  private setupMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      this.handleMessage(event);
    });
  }
  
  private handleMessage(event: MessageEvent): void {
    // SECURITY: Validate origin first
    if (!this.isOriginTrusted(event.origin)) {
      console.warn('[PostMessageRouter] Rejected message from untrusted origin:', event.origin);
      return;
    }
    
    // Validate message structure
    if (!event.data || typeof event.data !== 'object') {
      return;
    }
    
    const { type, payload, messageId, appId, context } = event.data;
    
    if (!type) {
      return;
    }
    
    // Handle simple FDC3 broadcast format from apps
    if (type === 'fdc3.broadcast' && context) {
      // Find which app sent this by matching the iframe
      const sourceAppId = this.findAppIdByWindow(event.source as Window);
      if (sourceAppId) {
        console.log('[PostMessageRouter] FDC3 broadcast from', sourceAppId);
        
        // Log to monitor
        fdc3Monitor.logMessage({
          direction: 'received',
          type: 'broadcast',
          from: sourceAppId,
          payload: context
        });
        
        this.handleBroadcast(sourceAppId, context);
        // Broadcast to all other apps
        this.broadcastContextToApps(context, sourceAppId);
      }
      return;
    }
    
    // Handle standard platform messages
    if (!appId) {
      console.warn('[PostMessageRouter] Invalid message structure');
      return;
    }
    
    // Validate app is registered
    if (!this.registeredApps.has(appId)) {
      console.warn('[PostMessageRouter] Message from unregistered app:', appId);
      return;
    }
    
    console.log('[PostMessageRouter] Received message:', type, 'from', appId);
    
    // Route message based on type
    this.routeMessage(type, payload, messageId, appId, event.source as Window);
  }
  
  private findAppIdByWindow(window: Window): string | null {
    for (const [appId, iframe] of this.registeredApps.entries()) {
      if (iframe.contentWindow === window) {
        return appId;
      }
    }
    return null;
  }
  
  private broadcastContextToApps(context: Context, excludeAppId?: string): void {
    for (const [appId, iframe] of this.registeredApps.entries()) {
      if (appId === excludeAppId) continue;
      
      if (iframe.contentWindow) {
        // SECURITY: Send to specific origin
        const targetOrigin = this.appOrigins.get(appId) || window.location.origin;
        iframe.contentWindow.postMessage({
          type: 'fdc3.context',
          context
        }, targetOrigin);
        
        // Log to monitor
        fdc3Monitor.logMessage({
          direction: 'sent',
          type: 'context',
          to: appId,
          payload: context
        });
      }
    }
  }
  
  private async routeMessage(
    type: string,
    payload: any,
    messageId: string,
    appId: string,
    source: Window
  ): Promise<void> {
    try {
      let result: any;
      
      switch (type) {
        case 'broadcast':
          await this.handleBroadcast(appId, payload.context);
          result = { success: true };
          break;
          
        case 'raiseIntent':
          result = await this.handleRaiseIntent(appId, payload.intent, payload.context, payload.app);
          break;
          
        case 'addContextListener':
          result = await this.handleAddContextListener(appId, payload.contextType, payload.listenerId);
          break;
          
        case 'removeContextListener':
          await this.handleRemoveContextListener(appId, payload.listenerId);
          result = { success: true };
          break;
          
        case 'joinUserChannel':
          await this.handleJoinUserChannel(appId, payload.channelId);
          result = { success: true };
          break;
          
        case 'leaveCurrentChannel':
          await this.handleLeaveCurrentChannel(appId);
          result = { success: true };
          break;
          
        case 'getUserChannels':
          result = this.channelManager.getUserChannels();
          break;
          
        case 'getChannel':
          result = this.channelManager.getUserChannel(payload.channelId);
          break;
          
        case 'getOrCreateChannel':
          result = this.channelManager.getOrCreateAppChannel(payload.channelId);
          break;
          
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
      
      // Send response
      this.sendResponse(source, messageId, result);
      
    } catch (error) {
      console.error('[PostMessageRouter] Error handling message:', error);
      this.sendError(source, messageId, error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  private async handleBroadcast(appId: string, context: Context): Promise<void> {
    console.log('[PostMessageRouter] Broadcasting context from', appId, ':', context);
    
    // Get app's current channel
    const channelId = this.appChannels.get(appId);
    
    if (channelId) {
      // Broadcast on channel
      const channel = this.channelManager.getUserChannel(channelId);
      if (channel) {
        await channel.broadcast(context);
      }
    } else {
      // Broadcast to all apps not on a channel
      await this.contextRouter.routeContext(context, appId);
    }
  }
  
  private async handleRaiseIntent(
    appId: string,
    intent: string,
    context: Context,
    targetApp?: any
  ): Promise<any> {
    console.log('[PostMessageRouter] Raising intent:', intent, 'from', appId);
    
    // Use intent resolver
    const resolution = await this.intentResolver.resolveIntent(intent, context, targetApp);
    return resolution;
  }
  
  private async handleAddContextListener(
    appId: string,
    contextType: string | null,
    listenerId: string
  ): Promise<any> {
    console.log('[PostMessageRouter] Adding context listener for', appId, ':', contextType);
    
    // Subscribe to context router
    this.contextRouter.subscribe(appId, contextType, async (context: Context) => {
      // Send context to app
      const iframe = this.registeredApps.get(appId);
      if (iframe && iframe.contentWindow) {
        // SECURITY: Send to specific origin
        const targetOrigin = this.appOrigins.get(appId) || window.location.origin;
        iframe.contentWindow.postMessage({
          type: 'context',
          payload: {
            listenerId,
            context
          }
        }, targetOrigin);
      }
    });
    
    return { success: true };
  }
  
  private async handleRemoveContextListener(appId: string, listenerId: string): Promise<void> {
    console.log('[PostMessageRouter] Removing context listener:', listenerId);
    // Context router handles this via listener.unsubscribe()
  }
  
  private async handleJoinUserChannel(appId: string, channelId: string): Promise<void> {
    console.log('[PostMessageRouter] App', appId, 'joining channel:', channelId);
    
    // Leave current channel if any
    const currentChannel = this.appChannels.get(appId);
    if (currentChannel) {
      await this.handleLeaveCurrentChannel(appId);
    }
    
    // Join new channel
    this.appChannels.set(appId, channelId);
    
    // Subscribe to channel contexts
    const channel = this.channelManager.getUserChannel(channelId);
    if (channel) {
      channel.addContextListener(null, async (context: Context) => {
        // Send to app
        const iframe = this.registeredApps.get(appId);
        if (iframe && iframe.contentWindow) {
          // SECURITY: Send to specific origin
          const targetOrigin = this.appOrigins.get(appId) || window.location.origin;
          iframe.contentWindow.postMessage({
            type: 'context',
            payload: { context }
          }, targetOrigin);
        }
      });
    }
  }
  
  private async handleLeaveCurrentChannel(appId: string): Promise<void> {
    console.log('[PostMessageRouter] App', appId, 'leaving channel');
    this.appChannels.delete(appId);
  }
  
  private sendResponse(target: Window, messageId: string, payload: any): void {
    // SECURITY: Send to specific origin, not wildcard
    const targetOrigin = this.getTargetOrigin(target);
    target.postMessage({
      type: 'response',
      messageId,
      payload
    }, targetOrigin);
  }
  
  private sendError(target: Window, messageId: string, error: string): void {
    // SECURITY: Send to specific origin, not wildcard
    const targetOrigin = this.getTargetOrigin(target);
    target.postMessage({
      type: 'response',
      messageId,
      error
    }, targetOrigin);
  }
  
  /**
   * Check if origin is trusted
   */
  private isOriginTrusted(origin: string): boolean {
    // Check against trusted origins list
    if (this.trustedOrigins.has(origin)) {
      return true;
    }
    
    // Check if it's a registered app's origin
    for (const appOrigin of this.appOrigins.values()) {
      if (appOrigin === origin) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get target origin for postMessage
   */
  private getTargetOrigin(target: Window): string {
    // Find the iframe for this window
    for (const [appId, iframe] of this.registeredApps.entries()) {
      if (iframe.contentWindow === target) {
        const appOrigin = this.appOrigins.get(appId);
        if (appOrigin) {
          return appOrigin;
        }
      }
    }
    
    // Fallback to same origin
    return window.location.origin;
  }
  
  /**
   * Add trusted origin
   */
  addTrustedOrigin(origin: string): void {
    this.trustedOrigins.add(origin);
    console.log('[PostMessageRouter] Added trusted origin:', origin);
  }
  
  /**
   * Remove trusted origin
   */
  removeTrustedOrigin(origin: string): void {
    this.trustedOrigins.delete(origin);
    console.log('[PostMessageRouter] Removed trusted origin:', origin);
  }
  
  /**
   * Get list of trusted origins
   */
  getTrustedOrigins(): string[] {
    return Array.from(this.trustedOrigins);
  }
  
  registerApplication(appId: string, iframe: HTMLIFrameElement, appOrigin?: string): void {
    console.log('[PostMessageRouter] Registering app:', appId);
    this.registeredApps.set(appId, iframe);
    
    // Track app origin for security
    if (appOrigin) {
      this.appOrigins.set(appId, appOrigin);
      // Auto-trust app origin
      this.addTrustedOrigin(appOrigin);
    } else {
      // Default to same origin
      this.appOrigins.set(appId, window.location.origin);
    }
  }
  
  unregisterApplication(appId: string): void {
    console.log('[PostMessageRouter] Unregistering app:', appId);
    this.registeredApps.delete(appId);
    this.appChannels.delete(appId);
    this.appOrigins.delete(appId);
    this.contextRouter.unsubscribeApp(appId);
  }
  
  sendToApplication(appId: string, message: BridgeMessage): void {
    const iframe = this.registeredApps.get(appId);
    if (!iframe || !iframe.contentWindow) {
      console.warn('[PostMessageRouter] App not found:', appId);
      return;
    }
    
    // SECURITY: Send to specific origin
    const targetOrigin = this.appOrigins.get(appId) || window.location.origin;
    iframe.contentWindow.postMessage(message, targetOrigin);
  }
  
  broadcast(message: BridgeMessage, excludeAppId?: string): void {
    for (const [appId, iframe] of this.registeredApps.entries()) {
      if (appId === excludeAppId) continue;
      
      if (iframe.contentWindow) {
        // SECURITY: Send to specific origin
        const targetOrigin = this.appOrigins.get(appId) || window.location.origin;
        iframe.contentWindow.postMessage(message, targetOrigin);
      }
    }
  }
  
  getChannelManager(): ChannelManager {
    return this.channelManager;
  }
  
  getIntentResolver(): IntentResolver {
    return this.intentResolver;
  }
  
  getContextRouter(): ContextRouter {
    return this.contextRouter;
  }
}
