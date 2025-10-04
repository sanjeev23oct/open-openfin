import { Context, ContextHandler } from './types/Context';
import { IntentResolution, IntentHandler, TargetApp } from './types/Intent';
import { Channel } from './types/Channel';
import { Listener } from './types/Listener';
import { ChannelManager } from './ChannelManager';
import { IntentResolver } from './IntentResolver';
import { ContextRouter } from './ContextRouter';

/**
 * FDC3 Message Bus - implements FDC3 on top of IAB
 */
export class FDC3MessageBus {
  private channelManager: ChannelManager;
  private intentResolver: IntentResolver;
  private contextRouter: ContextRouter;
  private currentChannel: Channel | null = null;
  private appId: string;
  
  constructor(appId: string) {
    this.appId = appId;
    this.channelManager = new ChannelManager();
    this.intentResolver = new IntentResolver();
    this.contextRouter = new ContextRouter();
  }
  
  /**
   * Broadcast context to current channel
   */
  async broadcast(context: Context): Promise<void> {
    if (!this.currentChannel) {
      throw new Error('Not joined to any channel');
    }
    
    await this.currentChannel.broadcast(context);
  }
  
  /**
   * Raise an intent
   */
  async raiseIntent(intent: string, context: Context, target?: string): Promise<IntentResolution> {
    const targetApp: TargetApp | undefined = target ? { appId: target } : undefined;
    return await this.intentResolver.resolveIntent(intent, context, targetApp);
  }
  
  /**
   * Add context listener
   */
  addContextListener(contextType: string | null, handler: ContextHandler): Listener {
    if (this.currentChannel) {
      return this.currentChannel.addContextListener(contextType, handler);
    }
    
    // If not on a channel, use context router
    return this.contextRouter.subscribe(this.appId, contextType, handler);
  }
  
  /**
   * Add intent listener
   */
  addIntentListener(intent: string, handler: IntentHandler): Listener {
    this.intentResolver.registerIntentHandler({
      appId: this.appId,
      intent,
      handler
    });
    
    return {
      unsubscribe: () => {
        this.intentResolver.unregisterIntentHandler(this.appId, intent);
      }
    };
  }
  
  /**
   * Join a user channel
   */
  async joinUserChannel(channelId: string): Promise<void> {
    const channel = this.channelManager.getUserChannel(channelId);
    
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }
    
    this.currentChannel = channel;
  }
  
  /**
   * Get current channel
   */
  getCurrentChannel(): Channel | null {
    return this.currentChannel;
  }
  
  /**
   * Leave current channel
   */
  async leaveCurrentChannel(): Promise<void> {
    this.currentChannel = null;
  }
  
  /**
   * Get user channels
   */
  getUserChannels(): Channel[] {
    return this.channelManager.getUserChannels();
  }
  
  /**
   * Get or create channel
   */
  getOrCreateChannel(channelId: string): Channel {
    return this.channelManager.getOrCreateAppChannel(channelId);
  }
}
