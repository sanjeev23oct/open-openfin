import { WebSocketServer, WebSocket } from 'ws';
import { IService } from './ServiceRegistry';
import { Identity } from '@desktop-interop/sdk';

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
 * Client connection
 */
interface ClientConnection {
  identity: Identity;
  socket: WebSocket;
  subscriptions: Set<string>;
}

/**
 * Inter-Application Bus - core messaging infrastructure
 */
export class InterApplicationBus implements IService {
  private server?: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> Set<clientId>
  private port: number;
  
  constructor(port: number = 9001) {
    this.port = port;
  }
  
  async initialize(): Promise<void> {
    // Create WebSocket server
    this.server = new WebSocketServer({ port: this.port });
    
    this.server.on('connection', (socket: WebSocket) => {
      this.handleConnection(socket);
    });
    
    console.log(`IAB initialized on port ${this.port}`);
  }
  
  async shutdown(): Promise<void> {
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
   * Publish a message to a topic
   */
  async publish(sender: Identity, topic: string, message: any): Promise<void> {
    const subscribers = this.subscriptions.get(topic);
    
    if (!subscribers || subscribers.size === 0) {
      return;
    }
    
    const iabMessage: IABMessage = {
      type: 'publish',
      id: this.generateMessageId(),
      sender,
      topic,
      payload: message
    };
    
    // Send to all subscribers
    for (const clientId of subscribers) {
      const client = this.clients.get(clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify(iabMessage));
      }
    }
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
            subscriptions: new Set()
          });
        }
        
        this.handleMessage(clientId, message);
      } catch (error) {
        console.error('Failed to handle message:', error);
      }
    });
    
    socket.on('close', () => {
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
   * Handle subscription
   */
  private handleSubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Add to client subscriptions
    client.subscriptions.add(topic);
    
    // Add to topic subscriptions
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    this.subscriptions.get(topic)!.add(clientId);
  }
  
  /**
   * Handle unsubscribe
   */
  private handleUnsubscribe(clientId: string, topic: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove from client subscriptions
    client.subscriptions.delete(topic);
    
    // Remove from topic subscriptions
    const subscribers = this.subscriptions.get(topic);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.subscriptions.delete(topic);
      }
    }
  }
  
  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    // Remove all subscriptions
    for (const topic of client.subscriptions) {
      this.handleUnsubscribe(clientId, topic);
    }
    
    // Remove client
    this.clients.delete(clientId);
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
