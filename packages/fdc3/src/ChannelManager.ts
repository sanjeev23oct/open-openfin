import { Channel, ChannelType, DisplayMetadata, PrivateChannel } from './types/Channel';
import { Context, ContextHandler } from './types/Context';
import { Listener } from './types/Listener';

/**
 * Channel implementation
 */
class ChannelImpl implements Channel {
  private contextListeners: Map<string, Set<ContextHandler>> = new Map();
  private currentContext: Map<string, Context> = new Map();
  
  constructor(
    public id: string,
    public type: ChannelType,
    public displayMetadata?: DisplayMetadata
  ) {}
  
  async broadcast(context: Context): Promise<void> {
    // Store context
    this.currentContext.set(context.type, context);
    
    // Notify listeners
    const typeListeners = this.contextListeners.get(context.type) || new Set();
    const allListeners = this.contextListeners.get('*') || new Set();
    
    for (const handler of [...typeListeners, ...allListeners]) {
      try {
        await handler(context);
      } catch (error) {
        console.error('Context handler error:', error);
      }
    }
  }
  
  async getCurrentContext(contextType?: string): Promise<Context | null> {
    if (contextType) {
      return this.currentContext.get(contextType) || null;
    }
    
    // Return most recent context
    const contexts = Array.from(this.currentContext.values());
    return contexts.length > 0 ? contexts[contexts.length - 1] : null;
  }
  
  addContextListener(contextType: string | null, handler: ContextHandler): Listener {
    const type = contextType || '*';
    
    if (!this.contextListeners.has(type)) {
      this.contextListeners.set(type, new Set());
    }
    
    this.contextListeners.get(type)!.add(handler);
    
    return {
      unsubscribe: () => {
        this.contextListeners.get(type)?.delete(handler);
      }
    };
  }
}

/**
 * Private channel implementation
 */
class PrivateChannelImpl extends ChannelImpl implements PrivateChannel {
  private disconnectHandlers: Set<() => void> = new Set();
  private isDisconnected: boolean = false;
  
  constructor(id: string) {
    super(id, 'private');
  }
  
  onDisconnect(handler: () => void): void {
    this.disconnectHandlers.add(handler);
  }
  
  async disconnect(): Promise<void> {
    if (this.isDisconnected) {
      return;
    }
    
    this.isDisconnected = true;
    
    // Notify disconnect handlers
    for (const handler of this.disconnectHandlers) {
      try {
        handler();
      } catch (error) {
        console.error('Disconnect handler error:', error);
      }
    }
    
    this.disconnectHandlers.clear();
  }
}

/**
 * Channel Manager - manages user, app, and private channels
 */
export class ChannelManager {
  private userChannels: Map<string, Channel> = new Map();
  private appChannels: Map<string, Channel> = new Map();
  private privateChannels: Map<string, PrivateChannel> = new Map();
  
  constructor() {
    this.initializeUserChannels();
  }
  
  /**
   * Initialize standard user channels
   */
  private initializeUserChannels(): void {
    const standardChannels = [
      { id: 'red', color: '#f44336', name: 'Red' },
      { id: 'blue', color: '#2196F3', name: 'Blue' },
      { id: 'green', color: '#4CAF50', name: 'Green' },
      { id: 'yellow', color: '#FFC107', name: 'Yellow' },
      { id: 'orange', color: '#FF9800', name: 'Orange' },
      { id: 'purple', color: '#9C27B0', name: 'Purple' }
    ];
    
    for (const channelDef of standardChannels) {
      const channel = new ChannelImpl(
        channelDef.id,
        'user',
        {
          name: channelDef.name,
          color: channelDef.color
        }
      );
      this.userChannels.set(channelDef.id, channel);
    }
  }
  
  /**
   * Get user channels
   */
  getUserChannels(): Channel[] {
    return Array.from(this.userChannels.values());
  }
  
  /**
   * Get user channel by ID
   */
  getUserChannel(channelId: string): Channel | null {
    return this.userChannels.get(channelId) || null;
  }
  
  /**
   * Get or create app channel
   */
  getOrCreateAppChannel(channelId: string): Channel {
    if (!this.appChannels.has(channelId)) {
      const channel = new ChannelImpl(channelId, 'app');
      this.appChannels.set(channelId, channel);
    }
    return this.appChannels.get(channelId)!;
  }
  
  /**
   * Create private channel
   */
  createPrivateChannel(): PrivateChannel {
    const channelId = this.generatePrivateChannelId();
    const channel = new PrivateChannelImpl(channelId);
    this.privateChannels.set(channelId, channel);
    
    return channel;
  }
  
  /**
   * Get private channel by ID
   */
  getPrivateChannel(channelId: string): PrivateChannel | null {
    return this.privateChannels.get(channelId) || null;
  }
  
  /**
   * Generate unique private channel ID
   */
  private generatePrivateChannelId(): string {
    return `private-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
