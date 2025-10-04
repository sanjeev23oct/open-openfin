/**
 * FDC3 Listener interface
 */
export interface Listener {
  /**
   * Unsubscribe the listener
   */
  unsubscribe(): void;
}

/**
 * Subscription interface for IAB
 */
export interface Subscription {
  /** Subscription ID */
  id: string;
  /** Topic being subscribed to */
  topic: string;
  /** Unsubscribe function */
  unsubscribe(): void;
}
