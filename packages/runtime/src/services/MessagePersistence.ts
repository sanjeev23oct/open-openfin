import { MessageEnvelope } from './MessageBroker';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  enabled: boolean;
  storageDir: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  flushInterval: number; // ms
}

/**
 * Message Persistence - Disk-based message storage
 * Provides durability for message broker
 */
export class MessagePersistence {
  private config: PersistenceConfig;
  private writeBuffer: MessageEnvelope[] = [];
  private currentFile: string | null = null;
  private currentFileSize: number = 0;
  private flushTimer: NodeJS.Timeout | null = null;
  
  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storageDir: config.storageDir ?? path.join(process.cwd(), '.iab-storage'),
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles ?? 100,
      flushInterval: config.flushInterval ?? 1000 // 1 second
    };
    
    if (this.config.enabled) {
      this.initialize();
    }
  }
  
  /**
   * Initialize storage
   */
  private async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.config.storageDir, { recursive: true });
      this.startFlushTimer();
    } catch (error) {
      console.error('Failed to initialize message persistence:', error);
      this.config.enabled = false;
    }
  }
  
  /**
   * Persist message
   */
  async persist(message: MessageEnvelope): Promise<void> {
    if (!this.config.enabled) return;
    
    this.writeBuffer.push(message);
    
    // Flush if buffer is large
    if (this.writeBuffer.length >= 100) {
      await this.flush();
    }
  }
  
  /**
   * Flush write buffer to disk
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.writeBuffer.length === 0) return;
    
    try {
      // Get or create current file
      if (!this.currentFile || this.currentFileSize >= this.config.maxFileSize) {
        await this.rotateFile();
      }
      
      // Serialize messages
      const data = this.writeBuffer.map(msg => JSON.stringify(msg)).join('\n') + '\n';
      const dataSize = Buffer.byteLength(data);
      
      // Append to file
      await fs.appendFile(this.currentFile!, data);
      this.currentFileSize += dataSize;
      
      // Clear buffer
      this.writeBuffer = [];
    } catch (error) {
      console.error('Failed to flush messages:', error);
    }
  }

  
  /**
   * Rotate to new file
   */
  private async rotateFile(): Promise<void> {
    const timestamp = Date.now();
    this.currentFile = path.join(
      this.config.storageDir,
      `messages-${timestamp}.log`
    );
    this.currentFileSize = 0;
    
    // Clean up old files
    await this.cleanupOldFiles();
  }
  
  /**
   * Clean up old files
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.storageDir);
      const messageFiles = files
        .filter(f => f.startsWith('messages-') && f.endsWith('.log'))
        .sort()
        .reverse();
      
      // Delete excess files
      if (messageFiles.length > this.config.maxFiles) {
        const toDelete = messageFiles.slice(this.config.maxFiles);
        for (const file of toDelete) {
          await fs.unlink(path.join(this.config.storageDir, file));
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }
  }
  
  /**
   * Replay messages from storage
   */
  async *replay(fromTimestamp?: number): AsyncGenerator<MessageEnvelope> {
    if (!this.config.enabled) return;
    
    try {
      const files = await fs.readdir(this.config.storageDir);
      const messageFiles = files
        .filter(f => f.startsWith('messages-') && f.endsWith('.log'))
        .sort();
      
      for (const file of messageFiles) {
        const filePath = path.join(this.config.storageDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const message: MessageEnvelope = JSON.parse(line);
            
            // Filter by timestamp if provided
            if (fromTimestamp && message.timestamp < fromTimestamp) {
              continue;
            }
            
            yield message;
          } catch (error) {
            console.error('Failed to parse message:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to replay messages:', error);
    }
  }
  
  /**
   * Get messages for topic
   */
  async getMessagesForTopic(
    topic: string,
    limit: number = 100
  ): Promise<MessageEnvelope[]> {
    const messages: MessageEnvelope[] = [];
    
    for await (const message of this.replay()) {
      if (message.topic === topic) {
        messages.push(message);
        if (messages.length >= limit) break;
      }
    }
    
    return messages;
  }
  
  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('Flush timer error:', error);
      });
    }, this.config.flushInterval);
  }
  
  /**
   * Shutdown persistence
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Final flush
    await this.flush();
  }
  
  /**
   * Get storage statistics
   */
  async getStats(): Promise<{
    enabled: boolean;
    storageDir: string;
    fileCount: number;
    totalSize: number;
    bufferedMessages: number;
  }> {
    let fileCount = 0;
    let totalSize = 0;
    
    if (this.config.enabled) {
      try {
        const files = await fs.readdir(this.config.storageDir);
        const messageFiles = files.filter(
          f => f.startsWith('messages-') && f.endsWith('.log')
        );
        
        fileCount = messageFiles.length;
        
        for (const file of messageFiles) {
          const stats = await fs.stat(path.join(this.config.storageDir, file));
          totalSize += stats.size;
        }
      } catch (error) {
        console.error('Failed to get storage stats:', error);
      }
    }
    
    return {
      enabled: this.config.enabled,
      storageDir: this.config.storageDir,
      fileCount,
      totalSize,
      bufferedMessages: this.writeBuffer.length
    };
  }
}
