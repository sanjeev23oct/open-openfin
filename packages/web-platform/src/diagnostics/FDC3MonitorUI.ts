/**
 * FDC3 Monitor UI
 * Visual component for displaying FDC3 messages
 */

import { fdc3Monitor, FDC3Message } from './FDC3Monitor';

export class FDC3MonitorUI {
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private isVisible: boolean = false;

  show(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.createUI();
    fdc3Monitor.enable();
    
    // Subscribe to updates
    this.unsubscribe = fdc3Monitor.subscribe((messages) => {
      this.updateMessages(messages);
    });

    // Initial render
    this.updateMessages(fdc3Monitor.getMessages());
  }

  hide(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private createUI(): void {
    this.container = document.createElement('div');
    this.container.id = 'fdc3-monitor';
    this.container.style.cssText = `
      position: fixed;
      bottom: 0;
      right: 0;
      width: 400px;
      height: 300px;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid #333;
      border-radius: 8px 0 0 0;
      display: flex;
      flex-direction: column;
      z-index: 10000;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #fff;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
    `;

    this.container.innerHTML = `
      <div style="padding: 8px 12px; background: #1a1a1a; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="color: #4ade80; font-weight: bold;">●</span>
          <span style="font-weight: bold;">FDC3 Monitor</span>
          <span id="fdc3-monitor-count" style="color: #888; font-size: 11px;">(0)</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button id="fdc3-monitor-clear" style="background: #333; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Clear</button>
          <button id="fdc3-monitor-export" style="background: #333; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">Export</button>
          <button id="fdc3-monitor-close" style="background: #333; border: none; color: #fff; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">✕</button>
        </div>
      </div>
      <div id="fdc3-monitor-messages" style="flex: 1; overflow-y: auto; padding: 8px;">
        <div style="color: #666; text-align: center; padding: 20px;">No messages yet...</div>
      </div>
      <div id="fdc3-monitor-stats" style="padding: 6px 12px; background: #1a1a1a; border-top: 1px solid #333; font-size: 10px; color: #888;">
        Sent: <span id="fdc3-stats-sent">0</span> | Received: <span id="fdc3-stats-received">0</span>
      </div>
    `;

    document.body.appendChild(this.container);

    // Add event listeners
    this.container.querySelector('#fdc3-monitor-clear')?.addEventListener('click', () => {
      fdc3Monitor.clearMessages();
    });

    this.container.querySelector('#fdc3-monitor-export')?.addEventListener('click', () => {
      const data = fdc3Monitor.exportMessages();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fdc3-messages-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    this.container.querySelector('#fdc3-monitor-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Make draggable
    this.makeDraggable();
  }

  private updateMessages(messages: FDC3Message[]): void {
    if (!this.container) return;

    const messagesEl = this.container.querySelector('#fdc3-monitor-messages');
    const countEl = this.container.querySelector('#fdc3-monitor-count');
    
    if (!messagesEl || !countEl) return;

    countEl.textContent = `(${messages.length})`;

    if (messages.length === 0) {
      messagesEl.innerHTML = '<div style="color: #666; text-align: center; padding: 20px;">No messages yet...</div>';
      return;
    }

    messagesEl.innerHTML = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString();
      const directionColor = msg.direction === 'sent' ? '#3b82f6' : '#10b981';
      const directionIcon = msg.direction === 'sent' ? '↑' : '↓';
      
      return `
        <div style="margin-bottom: 8px; padding: 6px; background: #1a1a1a; border-left: 3px solid ${directionColor}; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span style="color: ${directionColor}; font-weight: bold;">${directionIcon} ${msg.type}</span>
            <span style="color: #666; font-size: 10px;">${time}</span>
          </div>
          ${msg.from ? `<div style="color: #888; font-size: 10px;">From: ${msg.from}</div>` : ''}
          ${msg.to ? `<div style="color: #888; font-size: 10px;">To: ${msg.to}</div>` : ''}
          ${msg.channel ? `<div style="color: #888; font-size: 10px;">Channel: ${msg.channel}</div>` : ''}
          <div style="color: #aaa; font-size: 11px; margin-top: 4px; max-height: 60px; overflow: auto;">
            ${JSON.stringify(msg.payload, null, 2)}
          </div>
        </div>
      `;
    }).join('');

    // Update stats
    const stats = fdc3Monitor.getStats();
    const sentEl = this.container.querySelector('#fdc3-stats-sent');
    const receivedEl = this.container.querySelector('#fdc3-stats-received');
    
    if (sentEl) sentEl.textContent = stats.sent.toString();
    if (receivedEl) receivedEl.textContent = stats.received.toString();
  }

  private makeDraggable(): void {
    if (!this.container) return;

    const header = this.container.querySelector('div') as HTMLElement;
    if (!header) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startRight = 0;
    let startBottom = 0;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.container!.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging || !this.container) return;

      const deltaX = startX - e.clientX;
      const deltaY = e.clientY - startY;

      this.container.style.right = `${startRight + deltaX}px`;
      this.container.style.bottom = `${startBottom - deltaY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

// Global singleton instance
export const fdc3MonitorUI = new FDC3MonitorUI();
