import { EventEmitter } from 'events';
import { Identity } from '@desktop-interop/sdk';

/**
 * Message envelope with metadata
 */
export interface MessageEnvelope {
  id: string;
  correlationId?: string;
  timestamp: number;
  sender: Identity;
  topic: string;
  payload: any;
  headers?: Record<string, string>;
  ttl?: number;
  priority?: number;
}

/**
 * Routing table entry
 */
interface RouteEntry {
  clientId: string;
  pattern: string;
  isWildcard: boolean;
  handler: (message: MessageEnvelope) => void;
}

/**
 * Message Broker - Centralized message routing with persistence
 * Implements OpenFin-style message broker pattern
 */
export class MessageBroker extends EventEmitter {
  private routingTable: Map<string, RouteEntry[]> = new Map();
  private wildcardRoutes: RouteEntry[] = [];
  private messageQueue: Map<string, MessageEnvelope[]> = new Map();
  private deadLetterQueue: MessageEnvelope[] = [];
  private messageHistory: Map<string, MessageEnvelope[]> = new Map();
  
  // Configuration
  private readonly maxQueueSize = 10000;
  private readonly maxHistoryPerTopic = 100;
  private readonly maxDeadLetterSize = 1000;
  
  constructor() {
    super();
    this.startCleanupTimer();
  }
  
  /**
   * Subscribe to topic with wildcard support
   */
  subscribe(
    clientId: string,
    topic: string,
    handler: (message: MessageEnvelope) => void
  ): void {
    const isWildcard = topic.includes('*') || topic.includes('#');
    const pattern = this.topicToRegex(topic);
    
    const entry: RouteEntry = {
      clientId,
      pattern,
      isWildcard,
      handler
    };
    
    if (isWildcard) {
      this.wildcardRoutes.push(entry);
    } else {
      if (!this.routingTable.has(topic)) {
        this.routingTable.set(topic, []);
      }
      this.routingTable.get(topic)!.push(entry);
    }
    
    this.emit('subscribed', { clientId, topic });
  }

  
  /**
   * Unsubscribe from topic
   */
  unsubscribe(clientId: string, topic: string): void {
    // Remove from exact match routes
    const routes = this.routingTable.get(topic);
    if (routes) {
      const filtered = routes.filter(r => r.clientId !== clientId);
      if (filtered.length === 0) {
        this.routingTable.delete(topic);
      } else {
        this.routingTable.set(topic, filtered);
      }
    }
    
    // Remove from wildcard routes
    this.wildcardRoutes = this.wildcardRoutes.filter(
      r => !(r.clientId === clientId && r.pattern === this.topicToRegex(topic))
    );
    
    this.emit('unsubscribed', { clientId, topic });
  }
  
  /**
   * Publish message with O(1) routing for exact matches
   */
  async publish(message: MessageEnvelope): Promise<void> {
    // Add to history
    this.addToHistory(message);
    
    // Get exact match subscribers (O(1))
    const exactRoutes = this.routingTable.get(message.topic) || [];
    
    // Get wildcard match subscribers (O(m) where m = wildcard count)
    const wildcardRoutes = this.wildcardRoutes.filter(route => {
      const regex = new RegExp(route.pattern);
      return regex.test(message.topic);
    });
    
    const allRoutes = [...exactRoutes, ...wildcardRoutes];
    
    if (allRoutes.length === 0) {
      // No subscribers - add to dead letter queue
      this.addToDeadLetterQueue(message);
      return;
    }
    
    // Dispatch in parallel
    const deliveryPromises = allRoutes.map(route => 
      this.deliverMessage(route, message)
    );
    
    await Promise.allSettled(deliveryPromises);
    
    this.emit('published', {
      messageId: message.id,
      topic: message.topic,
      subscriberCount: allRoutes.length
    });
  }
  
  /**
   * Deliver message to subscriber with error handling
   */
  private async deliverMessage(
    route: RouteEntry,
    message: MessageEnvelope
  ): Promise<void> {
    try {
      await route.handler(message);
    } catch (error) {
      console.error(`Failed to deliver message to ${route.clientId}:`, error);
      
      // Queue for retry
      this.queueForRetry(route.clientId, message);
      
      this.emit('delivery-failed', {
        clientId: route.clientId,
        messageId: message.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  /**
   * Queue message for retry
   */
  private queueForRetry(clientId: string, message: MessageEnvelope): void {
    if (!this.messageQueue.has(clientId)) {
      this.messageQueue.set(clientId, []);
    }
    
    const queue = this.messageQueue.get(clientId)!;
    
    // Enforce queue size limit
    if (queue.length >= this.maxQueueSize) {
      const dropped = queue.shift();
      this.addToDeadLetterQueue(dropped!);
    }
    
    queue.push(message);
  }
  
  /**
   * Get queued messages for client
   */
  getQueuedMessages(clientId: string): MessageEnvelope[] {
    return this.messageQueue.get(clientId) || [];
  }
  
  /**
   * Clear queue for client
   */
  clearQueue(clientId: string): void {
    this.messageQueue.delete(clientId);
  }
  
  /**
   * Get message history for topic
   */
  getHistory(topic: string, limit: number = 10): MessageEnvelope[] {
    const history = this.messageHistory.get(topic) || [];
    return history.slice(-limit);
  }
  
  /**
   * Add message to history
   */
  private addToHistory(message: MessageEnvelope): void {
    if (!this.messageHistory.has(message.topic)) {
      this.messageHistory.set(message.topic, []);
    }
    
    const history = this.messageHistory.get(message.topic)!;
    history.push(message);
    
    // Enforce history limit
    if (history.length > this.maxHistoryPerTopic) {
      history.shift();
    }
  }
  
  /**
   * Add to dead letter queue
   */
  private addToDeadLetterQueue(message: MessageEnvelope): void {
    this.deadLetterQueue.push(message);
    
    // Enforce DLQ limit
    if (this.deadLetterQueue.length > this.maxDeadLetterSize) {
      this.deadLetterQueue.shift();
    }
    
    this.emit('dead-letter', { messageId: message.id, topic: message.topic });
  }
  
  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): MessageEnvelope[] {
    return [...this.deadLetterQueue];
  }
  
  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }
  
  /**
   * Convert topic pattern to regex
   */
  private topicToRegex(topic: string): string {
    // * matches single level: market.*.prices
    // # matches multiple levels: market.#
    return topic
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.+');
  }
  
  /**
   * Clean up expired messages
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up expired messages from queues
      for (const [clientId, queue] of this.messageQueue.entries()) {
        const filtered = queue.filter(msg => {
          if (!msg.ttl) return true;
          return (now - msg.timestamp) < msg.ttl;
        });
        
        if (filtered.length === 0) {
          this.messageQueue.delete(clientId);
        } else {
          this.messageQueue.set(clientId, filtered);
        }
      }
      
      // Clean up old history
      for (const [topic, history] of this.messageHistory.entries()) {
        const filtered = history.filter(msg => {
          // Keep messages from last hour
          return (now - msg.timestamp) < 3600000;
        });
        
        if (filtered.length === 0) {
          this.messageHistory.delete(topic);
        } else {
          this.messageHistory.set(topic, filtered);
        }
      }
    }, 60000); // Run every minute
  }
  
  /**
   * Get routing statistics
   */
  getStats(): {
    exactRoutes: number;
    wildcardRoutes: number;
    queuedMessages: number;
    deadLetterMessages: number;
    topics: number;
  } {
    let queuedMessages = 0;
    for (const queue of this.messageQueue.values()) {
      queuedMessages += queue.length;
    }
    
    return {
      exactRoutes: Array.from(this.routingTable.values()).reduce(
        (sum, routes) => sum + routes.length,
        0
      ),
      wildcardRoutes: this.wildcardRoutes.length,
      queuedMessages,
      deadLetterMessages: this.deadLetterQueue.length,
      topics: this.routingTable.size
    };
  }
  
  /**
   * Remove all subscriptions for client
   */
  removeClient(clientId: string): void {
    // Remove from routing table
    for (const [topic, routes] of this.routingTable.entries()) {
      const filtered = routes.filter(r => r.clientId !== clientId);
      if (filtered.length === 0) {
        this.routingTable.delete(topic);
      } else {
        this.routingTable.set(topic, filtered);
      }
    }
    
    // Remove from wildcard routes
    this.wildcardRoutes = this.wildcardRoutes.filter(
      r => r.clientId !== clientId
    );
    
    // Clear queue
    this.messageQueue.delete(clientId);
    
    this.emit('client-removed', { clientId });
  }
}
