import { WebSocketServer, WebSocket } from 'ws';
import { IService } from './ServiceRegistry';
import { Identity } from '@desktop-interop/sdk';
import { MessageBroker, MessageEnvelope } from './MessageBroker';
import { MessagePersistence } from './MessagePersistence';

/**
 * IAB Message types
 */
export interface IABMessage {
  type: 'publish' | 'subscribe' | 'unsubscribe' | 'send' | 'response';
  id: string;
  sender: Identity;
  topic?: string;
  target?: Identity;
  payload?: any;
  error?: string;
  correlationId?: string;
}

/**
 * Message handler function
 */
export type MessageHandler = (message: any, sender: Identity) => void | Promise<any>;

/**
 * Subscription
 */
export interface Subscription {
  id: string;
  topic: string;
  handler: MessageHandler;
  unsubscribe(): void;
}

/**
 * Client connection with health tracking
 */
interface ClientConnection {
  identity: Identity;
  socket: WebSocket;
  subscriptions: Set<string>;
  lastHeartbeat: number;
  connected: boolean;
  retryCount: number;
}

/**
 * Inter-Application Bus - Production-grade messaging infrastructure
 * Now with message broker, persistence, and reliability features
 */
export class InterApplicationBus implements IService {
  private server?: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private port: number;
  
  // New components
  private broker: MessageBroker;
  private persistence: MessagePersistence;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Configuration
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms
  private readonly heartbeatTimeout = 30000; // 30 seconds
  
  constructor(port: number = 9001) {
    this.port = port;
    this.broker = new MessageBroker();
    this.persistence = new MessagePersistence();
    
    this.setupBrokerEvents();
  }
  
  /**
   * Setup broker event handlers
   */
  private setupBrokerEvents(): void {
    this.broker.on('published', (data) => {
      console.log(`[IAB] Message published: ${data.messageId} to ${data.subscriberCount} subscribers`);
    });
    
    this.broker.on('delivery-failed', (data) => {
      console.warn(`[IAB] Delivery failed for client ${data.clientId}: ${data.error}`);
      this.handleDeliveryFailure(data.clientId, data.messageId);
    });
    
    this.broker.on('dead-letter', (data) => {
      console.warn(`[IAB] Message sent to DLQ: ${data.messageId} (topic: ${data.topic})`);
    });
  }
  
  async initialize(): Promise<void> {
    // Create WebSocket server
    this.server = new WebSocketServer({ port: this.port });
    
    this.server.on('connection', (socket: WebSocket) => {
      this.handleConnection(socket);
    });
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();
    
    console.log(`IAB initialized on port ${this.port} with message broker`);
  }
  
  async shutdown(): Promise<void> {
    // Stop heartbeat monitoring
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Flush persistence
    await this.persistence.shutdown();
    
    // Close all client connections
    for (const client of this.clients.values()) {
      client.socket.close();
    }
    
    // Close server
    if (this.server) {
      this.server.close();
    }
  }
  
  /**
   * Publish a message to a topic (now with broker and persistence)
   */
  async publish(sender: Identity, topic: string, message: any, correlationId?: string): Promise<void> {
    const envelope: MessageEnvelope = {
      id: this.generateMessageId(),
      correlationId,
      timestamp: Date.now(),
      sender,
      topic,
      payload: message,
      priority: 0
    };
    
    // Persist message
    await this.persistence.persist(envelope);
    
    // Route through broker
    await this.broker.publish(envelope);
  }
  
  /**
   * Send a direct message to a specific application
   */
  async send(sender: Identity, target: Identity, topic: string, message: any): Promise<any> {
    const targetClient = this.findClient(target);
    
    if (!targetClient) {
      throw new Error(`Target application ${target.uuid}/${target.name} not found`);
    }
    
    const iabMessage: IABMessage = {
      type: 'send',
      id: this.generateMessageId(),
      sender,
      target,
      topic,
      payload: message
    };
    
    return new Promise((resolve, reject) => {
      // Set up response handler
      const responseHandler = (data: string) => {
        try {
          const response: IABMessage = JSON.parse(data);
          if (response.type === 'response' && response.id === iabMessage.id) {
            targetClient.socket.off('message', responseHandler);
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.payload);
            }
          }
        } catch (error) {
          // Ignore parse errors
        }
      };
      
      targetClient.socket.on('message', responseHandler);
      
      // Send message
      targetClient.socket.send(JSON.stringify(iabMessage));
      
      // Timeout after 30 seconds
      setTimeout(() => {
        targetClient.socket.off('message', responseHandler);
        reject(new Error('Message timeout'));
      }, 30000);
    });
  }
  
  /**
   * Get all connected applications
   */
  getAllApplications(): Identity[] {
    return Array.from(this.clients.values()).map(client => client.identity);
  }
  
  /**
   * Handle new client connection
   */
  private handleConnection(socket: WebSocket): void {
    let clientId: string | null = null;
    
    socket.on('message', (data: string) => {
      try {
        const message: IABMessage = JSON.parse(data.toString());
        
        // Register client on first message
        if (!clientId) {
          clientId = this.generateClientId();
          this.clients.set(clientId, {
            identity: message.sender,
            socket,
            subscriptions: new Set(),
            lastHeartbeat: Date.now(),
            connected: true,
            retryCount: 0
          });
          
          console.log(`[IAB] Client connected: ${clientId} (${message.sender.uuid}/${message.sender.name})`);
        }
        
        // Update heartbeat
        const client = this.clients.get(clientId);
        if (client) {
          client.lastHeartbeat = Date.now();
          client.connected = true;
          client.retryCount = 0; // Reset retry count on successful message
        }
        
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('[IAB] Failed to handle message:', error);
      }
    });
    
    socket.on('close', () => {
      if (clientId) {
        this.handleDisconnect(clientId);
      }
    });
    
    socket.on('error', (error) => {
      console.error('[IAB] Socket error:', error);
      if (clientId) {
        this.handleDisconnect(clientId);
      }
    });
  }
  
  /**
   * Handle incoming message from client
   */
  private handleMessage(clientId: string, message: IABMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    switch (message.type) {
      case 'subscribe':
        if (message.topic) {
          this.handleSubscribe(clientId, message.topic);
        }
        break;
        
      case 'unsubscribe':
        if (message.topic) {
          this.handleUnsubscribe(clientId, message.topic);
        }
        break;
        
      case 'publish':
        if (message.topic) {
          this.publish(message.sender, message.topic, message.payload);
        }
        break;
        
      case 'send':
        if (message.target && message.topic) {
          this.send(message.sender, message.target, message.topic, message.payload)
            .then(result => {
              const response: IABMessage = {
                type: 'response',
                id: message.id,
                sender: message.target!,
                payload: result
              };
              client.socket.send(JSON.stringify(response));
            })
            .catch(error => {
              const response: IABMessage = {
                type: 'response',
                id: message.id,
                sender: message.target!,
                error: error.message
              };
              client.socket.send(JSON.stringify(response));
            });
        }
        break;
    }
  }
  
  /**
   * Handle subscription (now with broker)
   */
  private handleSubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Add to client subscriptions
    client.subscriptions.add(topic);
    
    // Subscribe through broker
    this.broker.subscribe(clientId, topic, async (envelope: MessageEnvelope) => {
      await this.deliverToClient(clientId, envelope);
    });
    
    // Send queued messages
    this.deliverQueuedMessages(clientId);
  }
  
  /**
   * Handle unsubscribe (now with broker)
   */
  private handleUnsubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove from client subscriptions
    client.subscriptions.delete(topic);
    
    // Unsubscribe from broker
    this.broker.unsubscribe(clientId, topic);
  }
  
  /**
   * Deliver message to client with retry logic
   */
  private async deliverToClient(
    clientId: string,
    envelope: MessageEnvelope
  ): Promise<void> {
    const client = this.clients.get(clientId);
    
    if (!client) {
      throw new Error(`Client ${clientId} not found`);
    }
    
    if (client.socket.readyState !== WebSocket.OPEN) {
      throw new Error(`Client ${clientId} socket not open`);
    }
    
    const iabMessage: IABMessage = {
      type: 'publish',
      id: envelope.id,
      sender: envelope.sender,
      topic: envelope.topic,
      payload: envelope.payload,
      correlationId: envelope.correlationId
    };
    
    client.socket.send(JSON.stringify(iabMessage));
  }
  
  /**
   * Deliver queued messages to reconnected client
   */
  private async deliverQueuedMessages(clientId: string): Promise<void> {
    const queuedMessages = this.broker.getQueuedMessages(clientId);
    
    if (queuedMessages.length === 0) return;
    
    console.log(`[IAB] Delivering ${queuedMessages.length} queued messages to ${clientId}`);
    
    for (const envelope of queuedMessages) {
      try {
        await this.deliverToClient(clientId, envelope);
      } catch (error) {
        console.error(`Failed to deliver queued message:`, error);
      }
    }
    
    // Clear queue after delivery
    this.broker.clearQueue(clientId);
  }
  
  /**
   * Handle delivery failure
   */
  private handleDeliveryFailure(clientId: string, messageId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    client.retryCount++;
    
    if (client.retryCount >= this.maxRetries) {
      console.error(`[IAB] Max retries reached for client ${clientId}, marking as disconnected`);
      client.connected = false;
    }
  }
  
  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    console.log(`[IAB] Client disconnected: ${clientId}`);
    
    // Mark as disconnected but keep subscriptions for potential reconnect
    client.connected = false;
    
    // Remove from broker after grace period
    setTimeout(() => {
      const stillDisconnected = this.clients.get(clientId);
      if (stillDisconnected && !stillDisconnected.connected) {
        // Remove all subscriptions
        this.broker.removeClient(clientId);
        
        // Remove client
        this.clients.delete(clientId);
        console.log(`[IAB] Client removed after grace period: ${clientId}`);
      }
    }, 30000); // 30 second grace period for reconnection
  }
  
  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastHeartbeat > this.heartbeatTimeout) {
          console.warn(`[IAB] Client ${clientId} heartbeat timeout`);
          this.handleDisconnect(clientId);
        }
      }
    }, 10000); // Check every 10 seconds
  }
  
  /**
   * Get broker statistics
   */
  getStats(): any {
    return {
      clients: this.clients.size,
      connectedClients: Array.from(this.clients.values()).filter(c => c.connected).length,
      broker: this.broker.getStats()
    };
  }
  
  /**
   * Get message history for topic
   */
  getHistory(topic: string, limit?: number): MessageEnvelope[] {
    return this.broker.getHistory(topic, limit);
  }
  
  /**
   * Get dead letter queue
   */
  getDeadLetterQueue(): MessageEnvelope[] {
    return this.broker.getDeadLetterQueue();
  }
  
  /**
   * Find client by identity
   */
  private findClient(identity: Identity): ClientConnection | undefined {
    for (const client of this.clients.values()) {
      if (client.identity.uuid === identity.uuid && 
          client.identity.name === identity.name) {
        return client;
      }
    }
    return undefined;
  }
  
  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
  
  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
