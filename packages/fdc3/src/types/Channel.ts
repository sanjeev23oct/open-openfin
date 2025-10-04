import { Context, ContextHandler } from './Context';
import { Listener } from './Listener';

/**
 * Channel types
 */
export type ChannelType = 'user' | 'app' | 'private';

/**
 * FDC3 Channel interface
 */
export interface Channel {
  /** Channel ID */
  id: string;
  /** Channel type */
  type: ChannelType;
  /** Display metadata for user channels */
  displayMetadata?: DisplayMetadata;
  
  /**
   * Broadcast context to all listeners on this channel
   */
  broadcast(context: Context): Promise<void>;
  
  /**
   * Get the current context for a specific type
   */
  getCurrentContext(contextType?: string): Promise<Context | null>;
  
  /**
   * Add a context listener
   */
  addContextListener(contextType: string | null, handler: ContextHandler): Listener;
}

/**
 * Display metadata for channels
 */
export interface DisplayMetadata {
  /** Display name */
  name?: string;
  /** Display color */
  color?: string;
  /** Display glyph/icon */
  glyph?: string;
}

/**
 * Private channel interface
 */
export interface PrivateChannel extends Channel {
  type: 'private';
  
  /**
   * Add event listener for disconnect
   */
  onDisconnect(handler: () => void): void;
  
  /**
   * Disconnect from the private channel
   */
  disconnect(): Promise<void>;
}
