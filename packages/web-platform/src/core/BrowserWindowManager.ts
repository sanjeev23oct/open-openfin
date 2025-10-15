/**
 * Browser Window Manager
 * Manages iframe-based windows within the browser tab
 */

import { WindowConfig, WindowInstance, Position, Size } from '../types';

export class BrowserWindowManager {
  private windows: Map<string, WindowInstance> = new Map();
  private nextZIndex: number = 1000;
  private container: HTMLElement;
  private focusedWindowId: string | null = null;
  
  constructor(containerId: string = 'platform-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }
    this.container = container;
  }
  
  createWindow(config: WindowConfig): WindowInstance {
    console.log('[BrowserWindowManager] Creating window:', config.appId);
    
    const windowId = this.generateWindowId();
    
    // Create window wrapper
    const windowWrapper = document.createElement('div');
    windowWrapper.id = windowId;
    windowWrapper.className = 'platform-window';
    windowWrapper.style.cssText = `
      position: absolute;
      left: ${config.position?.x || 100}px;
      top: ${config.position?.y || 100}px;
      width: ${config.size?.width || 800}px;
      height: ${config.size?.height || 600}px;
      z-index: ${this.nextZIndex++};
      background: white;
      border: 1px solid #ccc;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    
    // Create title bar if frame is enabled
    if (config.frame !== false) {
      const titleBar = this.createTitleBar(windowId, config.title);
      windowWrapper.appendChild(titleBar);
    }
    
    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src = config.url;
    iframe.style.cssText = `
      flex: 1;
      border: none;
      width: 100%;
      height: 100%;
    `;
    
    // Set sandbox attributes - SECURE configuration
    if (config.sandbox) {
      iframe.sandbox.add(...config.sandbox);
    } else {
      // SECURITY FIX: Removed dangerous 'allow-same-origin' + 'allow-scripts' combination
      // This combination allows scripts to access parent window and other iframes
      // 
      // For trusted internal apps: use separate origin or postMessage API
      // For external apps: they run in isolated sandbox
      iframe.sandbox.add(
        'allow-scripts',
        // REMOVED: 'allow-same-origin' - dangerous with allow-scripts!
        'allow-forms',
        'allow-popups',
        // REMOVED: 'allow-popups-to-escape-sandbox' - breaks isolation!
        'allow-top-navigation-by-user-activation',
        'allow-modals'
        // REMOVED: 'allow-downloads' - security risk
      );
    }
    
    // Feature policy for additional security
    iframe.setAttribute('allow', 'camera; microphone; geolocation; payment');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    
    // Add CSP via meta tag injection (for apps we control)
    if (!config.sandbox || config.sandbox.length === 0) {
      iframe.setAttribute('csp', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
    }
    
    // Add error handling for blocked iframes
    iframe.addEventListener('error', () => {
      console.error('[BrowserWindowManager] Failed to load:', config.url);
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 40px;
        text-align: center;
        background: #f5f5f5;
        color: #666;
      `;
      errorDiv.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin-bottom: 8px; color: #333;">Cannot Load Application</h3>
        <p style="margin-bottom: 16px;">This website blocks iframe embedding for security reasons.</p>
        <a href="${config.url}" target="_blank" style="color: #667eea; text-decoration: none; padding: 8px 16px; border: 1px solid #667eea; border-radius: 6px;">
          Open in New Tab →
        </a>
      `;
      windowWrapper.appendChild(errorDiv);
    });
    
    windowWrapper.appendChild(iframe);
    this.container.appendChild(windowWrapper);
    
    // Create window instance
    const windowInstance: WindowInstance = {
      id: windowId,
      appId: config.appId,
      iframe,
      position: config.position || { x: 100, y: 100 },
      size: config.size || { width: 800, height: 600 },
      state: 'normal',
      zIndex: this.nextZIndex - 1,
      focus: () => this.focusWindow(windowId),
      close: () => this.destroyWindow(windowId)
    };
    
    this.windows.set(windowId, windowInstance);
    
    // Setup window interactions
    this.setupWindowInteractions(windowId, windowWrapper, config);
    
    // Focus the new window
    this.focusWindow(windowId);
    
    return windowInstance;
  }
  
  private createTitleBar(windowId: string, title: string): HTMLElement {
    const titleBar = document.createElement('div');
    titleBar.className = 'window-titlebar';
    titleBar.style.cssText = `
      height: 32px;
      background: #f5f5f5;
      border-bottom: 1px solid #ddd;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 8px;
      cursor: move;
      user-select: none;
    `;
    
    const titleText = document.createElement('span');
    titleText.textContent = title;
    titleText.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      color: #333;
    `;
    
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 8px;
    `;
    
    // Minimize button
    const minimizeBtn = this.createControlButton('−', () => this.minimizeWindow(windowId));
    controls.appendChild(minimizeBtn);
    
    // Maximize button
    const maximizeBtn = this.createControlButton('□', () => this.maximizeWindow(windowId));
    controls.appendChild(maximizeBtn);
    
    // Close button
    const closeBtn = this.createControlButton('×', () => this.destroyWindow(windowId));
    closeBtn.style.color = '#d32f2f';
    controls.appendChild(closeBtn);
    
    titleBar.appendChild(titleText);
    titleBar.appendChild(controls);
    
    return titleBar;
  }
  
  private createControlButton(text: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.background = '#e0e0e0';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.background = 'transparent';
    });
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    
    return button;
  }
  
  private setupWindowInteractions(windowId: string, wrapper: HTMLElement, config: WindowConfig): void {
    const titleBar = wrapper.querySelector('.window-titlebar') as HTMLElement;
    if (!titleBar) return;
    
    // Add resize handles if resizable
    if (config.resizable !== false) {
      this.addResizeHandles(windowId, wrapper, config);
    }
    
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let windowStartX = 0;
    let windowStartY = 0;
    
    titleBar.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).tagName === 'BUTTON') return;
      
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      
      const window = this.windows.get(windowId);
      if (window) {
        windowStartX = window.position.x;
        windowStartY = window.position.y;
      }
      
      this.focusWindow(windowId);
      
      e.preventDefault();
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      
      this.moveWindow(windowId, {
        x: windowStartX + deltaX,
        y: windowStartY + deltaY
      });
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
    
    // Focus on click
    wrapper.addEventListener('mousedown', () => {
      this.focusWindow(windowId);
    });
  }
  
  private addResizeHandles(windowId: string, wrapper: HTMLElement, config: WindowConfig): void {
    const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    
    handles.forEach(direction => {
      const handle = document.createElement('div');
      handle.className = `resize-handle resize-${direction}`;
      handle.style.cssText = this.getResizeHandleStyle(direction);
      
      let isResizing = false;
      let startX = 0;
      let startY = 0;
      let startWidth = 0;
      let startHeight = 0;
      let startLeft = 0;
      let startTop = 0;
      
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const window = this.windows.get(windowId);
        if (window) {
          startWidth = window.size.width;
          startHeight = window.size.height;
          startLeft = window.position.x;
          startTop = window.position.y;
        }
        
        this.focusWindow(windowId);
      });
      
      document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        const window = this.windows.get(windowId);
        if (!window) return;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newLeft = startLeft;
        let newTop = startTop;
        
        // Calculate new dimensions based on direction
        if (direction.includes('e')) {
          newWidth = Math.max(config.minSize?.width || 200, startWidth + deltaX);
        }
        if (direction.includes('w')) {
          newWidth = Math.max(config.minSize?.width || 200, startWidth - deltaX);
          newLeft = startLeft + (startWidth - newWidth);
        }
        if (direction.includes('s')) {
          newHeight = Math.max(config.minSize?.height || 150, startHeight + deltaY);
        }
        if (direction.includes('n')) {
          newHeight = Math.max(config.minSize?.height || 150, startHeight - deltaY);
          newTop = startTop + (startHeight - newHeight);
        }
        
        // Apply max size constraints
        if (config.maxSize) {
          if (config.maxSize.width) newWidth = Math.min(newWidth, config.maxSize.width);
          if (config.maxSize.height) newHeight = Math.min(newHeight, config.maxSize.height);
        }
        
        this.resizeWindow(windowId, { width: newWidth, height: newHeight });
        if (newLeft !== startLeft || newTop !== startTop) {
          this.moveWindow(windowId, { x: newLeft, y: newTop });
        }
      });
      
      document.addEventListener('mouseup', () => {
        isResizing = false;
      });
      
      wrapper.appendChild(handle);
    });
  }
  
  private getResizeHandleStyle(direction: string): string {
    const baseStyle = `
      position: absolute;
      z-index: 10;
    `;
    
    const cursors: Record<string, string> = {
      'n': 'ns-resize',
      'ne': 'nesw-resize',
      'e': 'ew-resize',
      'se': 'nwse-resize',
      's': 'ns-resize',
      'sw': 'nesw-resize',
      'w': 'ew-resize',
      'nw': 'nwse-resize'
    };
    
    let positionStyle = '';
    
    switch (direction) {
      case 'n':
        positionStyle = 'top: 0; left: 8px; right: 8px; height: 4px;';
        break;
      case 'ne':
        positionStyle = 'top: 0; right: 0; width: 8px; height: 8px;';
        break;
      case 'e':
        positionStyle = 'right: 0; top: 8px; bottom: 8px; width: 4px;';
        break;
      case 'se':
        positionStyle = 'bottom: 0; right: 0; width: 8px; height: 8px;';
        break;
      case 's':
        positionStyle = 'bottom: 0; left: 8px; right: 8px; height: 4px;';
        break;
      case 'sw':
        positionStyle = 'bottom: 0; left: 0; width: 8px; height: 8px;';
        break;
      case 'w':
        positionStyle = 'left: 0; top: 8px; bottom: 8px; width: 4px;';
        break;
      case 'nw':
        positionStyle = 'top: 0; left: 0; width: 8px; height: 8px;';
        break;
    }
    
    return `${baseStyle}${positionStyle}cursor: ${cursors[direction]};`;
  }
  
  destroyWindow(windowId: string): void {
    console.log('[BrowserWindowManager] Destroying window:', windowId);
    
    const window = this.windows.get(windowId);
    if (!window) return;
    
    const wrapper = document.getElementById(windowId);
    if (wrapper) {
      wrapper.remove();
    }
    
    this.windows.delete(windowId);
    
    if (this.focusedWindowId === windowId) {
      this.focusedWindowId = null;
    }
  }
  
  moveWindow(windowId: string, position: Position): void {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.position = position;
    
    const wrapper = document.getElementById(windowId);
    if (wrapper) {
      wrapper.style.left = `${position.x}px`;
      wrapper.style.top = `${position.y}px`;
    }
  }
  
  resizeWindow(windowId: string, size: Size): void {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.size = size;
    
    const wrapper = document.getElementById(windowId);
    if (wrapper) {
      wrapper.style.width = `${size.width}px`;
      wrapper.style.height = `${size.height}px`;
    }
  }
  
  minimizeWindow(windowId: string): void {
    console.log('[BrowserWindowManager] Minimizing window:', windowId);
    
    const window = this.windows.get(windowId);
    if (!window) return;
    
    window.state = 'minimized';
    
    const wrapper = document.getElementById(windowId);
    if (wrapper) {
      wrapper.style.display = 'none';
    }
  }
  
  maximizeWindow(windowId: string): void {
    console.log('[BrowserWindowManager] Maximizing window:', windowId);
    
    const window = this.windows.get(windowId);
    if (!window) return;
    
    const wrapper = document.getElementById(windowId);
    if (!wrapper) return;
    
    if (window.state === 'maximized') {
      // Restore
      window.state = 'normal';
      wrapper.style.left = `${window.position.x}px`;
      wrapper.style.top = `${window.position.y}px`;
      wrapper.style.width = `${window.size.width}px`;
      wrapper.style.height = `${window.size.height}px`;
    } else {
      // Maximize
      window.state = 'maximized';
      wrapper.style.left = '0';
      wrapper.style.top = '0';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
    }
  }
  
  focusWindow(windowId: string): void {
    const window = this.windows.get(windowId);
    if (!window) return;
    
    // Update z-index
    window.zIndex = this.nextZIndex++;
    
    const wrapper = document.getElementById(windowId);
    if (wrapper) {
      wrapper.style.zIndex = window.zIndex.toString();
    }
    
    this.focusedWindowId = windowId;
  }
  
  getWindow(windowId: string): WindowInstance | undefined {
    return this.windows.get(windowId);
  }
  
  getAllWindows(): WindowInstance[] {
    return Array.from(this.windows.values());
  }
  
  getFocusedWindow(): WindowInstance | null {
    return this.focusedWindowId ? this.windows.get(this.focusedWindowId) || null : null;
  }
  
  private generateWindowId(): string {
    return `window-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
