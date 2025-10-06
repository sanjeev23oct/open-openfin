/**
 * FDC3 Monitor
 * Tracks and displays all FDC3 messages for debugging
 */

export interface FDC3Message {
  id: string;
  timestamp: number;
  direction: 'sent' | 'received';
  type: string;
  from?: string;
  to?: string;
  payload: any;
  channel?: string;
}

export class FDC3Monitor {
  private messages: FDC3Message[] = [];
  private maxMessages: number = 100;
  private listeners: Set<(messages: FDC3Message[]) => void> = new Set();
  private enabled: boolean = false;

  constructor(maxMessages: number = 100) {
    this.maxMessages = maxMessages;
  }

  enable(): void {
    this.enabled = true;
    console.log('[FDC3Monitor] Enabled');
  }

  disable(): void {
    this.enabled = false;
    console.log('[FDC3Monitor] Disabled');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  logMessage(message: Omit<FDC3Message, 'id' | 'timestamp'>): void {
    if (!this.enabled) return;

    const fullMessage: FDC3Message = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now()
    };

    this.messages.unshift(fullMessage);

    // Keep only the last N messages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }

    // Notify listeners
    this.notifyListeners();
  }

  getMessages(): FDC3Message[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.notifyListeners();
  }

  subscribe(listener: (messages: FDC3Message[]) => void): () => void {
    this.listeners.add(listener);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const messages = this.getMessages();
    this.listeners.forEach(listener => {
      try {
        listener(messages);
      } catch (error) {
        console.error('[FDC3Monitor] Error in listener:', error);
      }
    });
  }

  exportMessages(): string {
    return JSON.stringify(this.messages, null, 2);
  }

  getStats(): {
    total: number;
    sent: number;
    received: number;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.messages.length,
      sent: 0,
      received: 0,
      byType: {} as Record<string, number>
    };

    this.messages.forEach(msg => {
      if (msg.direction === 'sent') stats.sent++;
      if (msg.direction === 'received') stats.received++;
      
      stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;
    });

    return stats;
  }
}

// Global singleton instance
export const fdc3Monitor = new FDC3Monitor();
