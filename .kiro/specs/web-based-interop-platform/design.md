# Design Document - Web-Based Interop Platform

## Overview

The Web-Based Interop Platform provides a browser-native implementation of the Desktop Interop Platform, enabling FDC3-compliant application interoperability without requiring desktop installation. The design follows interop.io's Glue42 Core architecture: a single-page application that hosts multiple application iframes within a managed container, providing window management, FDC3 messaging, and workspace orchestration entirely in the browser.

**Key Design Principles:**
- **Container-First**: Single browser tab hosts all applications
- **iframe Isolation**: Each application runs in a sandboxed iframe
- **Progressive Enhancement**: Graceful degradation for unsupported features
- **Zero Installation**: Pure web technologies, no plugins required
- **Mobile Responsive**: Adapts to different screen sizes

## Architecture

### FDC3 Communication Mechanism

**postMessage is the Standard for Browser-Based FDC3:**
- ✅ **interop.io/Glue42 Core** uses postMessage for iframe communication
- ✅ **Finsemble** (ChartIQ) uses postMessage
- ✅ **FDC3 Specification** recommends postMessage for web implementations
- ✅ **Browser Security Model** requires postMessage for cross-origin iframe communication

**Why postMessage:**
```typescript
// Platform (parent window) sends to app (iframe)
iframe.contentWindow.postMessage({
  type: 'fdc3.context',
  context: { type: 'fdc3.instrument', id: { ticker: 'AAPL' } }
}, 'https://app-origin.com');

// App (iframe) sends to platform (parent)
window.parent.postMessage({
  type: 'fdc3.raiseIntent',
  intent: 'ViewChart',
  context: { type: 'fdc3.instrument', id: { ticker: 'AAPL' } }
}, 'https://platform-origin.com');
```

**Alternative Approaches (Not Used):**
- ❌ **SharedWorker**: Doesn't work across origins, limited browser support
- ❌ **BroadcastChannel**: Doesn't work across origins
- ❌ **localStorage events**: Unreliable, same-origin only
- ❌ **WebSockets**: Requires server, adds latency

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Tab (Container)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Platform Shell (React/Vue/Vanilla)          │  │
│  │  - Window Manager UI                                  │  │
│  │  - Launcher/Dock                                      │  │
│  │  - Workspace Controls                                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  App iframe  │  │  App iframe  │  │  App iframe  │     │
│  │  (Gmail)     │  │  (Ticker)    │  │  (Charts)    │     │
│  │              │  │              │  │              │     │
│  │  FDC3 Bridge │  │  FDC3 Bridge │  │  FDC3 Bridge │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Platform Core (JavaScript)               │  │
│  │  - FDC3 Message Router                                │  │
│  │  - Window Manager                                     │  │
│  │  - Workspace Manager                                  │  │
│  │  - Application Lifecycle                              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Browser Storage Layer                    │  │
│  │  - IndexedDB (workspaces, app state)                 │  │
│  │  - localStorage (preferences, fallback)              │  │
│  │  - SessionStorage (temporary state)                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Code Organization Strategy

**Shared Packages** (used by both desktop and web):
```
packages/
├── fdc3/                    # ✅ Already exists - FDC3 types and interfaces
├── sdk/                     # ✅ Already exists - Common SDK types
└── fdc3-core/              # 🆕 NEW - Shared FDC3 logic
    ├── ChannelManager.ts   # Channel management (platform-agnostic)
    ├── IntentResolver.ts   # Intent resolution logic
    └── ContextRouter.ts    # Context routing logic
```

**Desktop-Specific** (Electron):
```
packages/runtime/           # ✅ Existing - Electron-specific runtime
```

**Web-Specific** (Browser):
```
packages/web-platform/      # 🆕 NEW - Browser-specific platform
├── src/
│   ├── core/
│   │   ├── WebPlatformCore.ts       # Web platform orchestrator
│   │   ├── PostMessageRouter.ts     # postMessage-based routing
│   │   ├── BrowserWindowManager.ts  # iframe window management
│   │   └── WebWorkspaceManager.ts   # Browser storage-based workspaces
│   ├── ui/
│   │   ├── Shell.tsx                # Main container UI
│   │   ├── WindowFrame.tsx          # Draggable window component
│   │   ├── Launcher.tsx             # App launcher UI
│   │   ├── Dock.tsx                 # Docked apps bar
│   │   └── WorkspaceSelector.tsx    # Workspace switcher
│   ├── bridge/
│   │   ├── FDC3Bridge.ts            # Injected into iframes
│   │   ├── PostMessageBridge.ts     # postMessage communication
│   │   └── BridgeLoader.ts          # Auto-inject bridge script
│   ├── storage/
│   │   ├── IndexedDBStore.ts        # Primary storage
│   │   ├── LocalStorageStore.ts     # Fallback storage
│   │   └── StorageManager.ts        # Unified storage API
│   ├── services/
│   │   ├── URLRouter.ts             # Deep linking support
│   │   ├── PermissionManager.ts     # iframe permissions
│   │   └── PerformanceMonitor.ts    # Resource monitoring
│   └── pwa/
│       ├── ServiceWorker.ts         # Offline support
│       ├── manifest.json            # PWA manifest
│       └── CacheStrategy.ts         # Caching logic
└── public/
    ├── index.html                   # Main container page
    ├── bridge.js                    # FDC3 bridge (standalone)
    └── assets/                      # Icons, styles
```

## Components and Interfaces

### 1. Platform Core

**Purpose:** Central orchestrator that manages all platform services.

```typescript
interface PlatformCore {
  // Initialization
  initialize(config: PlatformConfig): Promise<void>;
  shutdown(): Promise<void>;
  
  // Application Management
  launchApplication(appId: string, context?: Context): Promise<ApplicationInstance>;
  closeApplication(instanceId: string): Promise<void>;
  getRunningApplications(): ApplicationInstance[];
  
  // Window Management
  createWindow(config: WindowConfig): WindowInstance;
  moveWindow(windowId: string, position: Position): void;
  resizeWindow(windowId: string, size: Size): void;
  
  // FDC3 Messaging
  broadcast(context: Context, channelId?: string): void;
  raiseIntent(intent: string, context: Context): Promise<IntentResolution>;
  addContextListener(handler: ContextHandler): Listener;
  
  // Workspace Management
  saveWorkspace(name: string): Promise<Workspace>;
  loadWorkspace(workspaceId: string): Promise<void>;
  getWorkspaces(): Promise<Workspace[]>;
}

interface PlatformConfig {
  appDirectory: string;           // URL to app manifest directory
  defaultWorkspace?: string;       // Default workspace to load
  theme?: 'light' | 'dark';
  enableMultiTab?: boolean;        // Allow apps in separate tabs
  storageQuota?: number;           // Max storage in MB
  performanceMode?: boolean;       // Reduce animations
}
```

### 2. Window Manager

**Purpose:** Manages visual window positioning and interactions within the browser tab.

```typescript
interface WindowManager {
  // Window Creation
  createWindow(config: WindowConfig): WindowInstance;
  destroyWindow(windowId: string): void;
  
  // Window Manipulation
  moveWindow(windowId: string, position: Position): void;
  resizeWindow(windowId: string, size: Size): void;
  minimizeWindow(windowId: string): void;
  maximizeWindow(windowId: string): void;
  restoreWindow(windowId: string): void;
  
  // Window Grouping
  groupWindows(windowIds: string[]): WindowGroup;
  ungroupWindows(groupId: string): void;
  
  // Docking
  dockWindow(windowId: string, zone: DockZone): void;
  undockWindow(windowId: string): void;
  
  // Layout
  tileWindows(layout: 'grid' | 'horizontal' | 'vertical'): void;
  cascadeWindows(): void;
  
  // Events
  onWindowMove(handler: (event: WindowMoveEvent) => void): void;
  onWindowResize(handler: (event: WindowResizeEvent) => void): void;
  onWindowFocus(handler: (event: WindowFocusEvent) => void): void;
}

interface WindowConfig {
  appId: string;
  url: string;
  title: string;
  position?: Position;
  size?: Size;
  minSize?: Size;
  maxSize?: Size;
  resizable?: boolean;
  movable?: boolean;
  frame?: boolean;                 // Show window frame/titlebar
  sandbox?: string[];              // iframe sandbox attributes
}

interface WindowInstance {
  id: string;
  appId: string;
  iframe: HTMLIFrameElement;
  position: Position;
  size: Size;
  state: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  focus(): void;
  close(): void;
}

interface Position {
  x: number;                       // Pixels from left
  y: number;                       // Pixels from top
}

interface Size {
  width: number;                   // Pixels
  height: number;                  // Pixels
}

interface DockZone {
  position: 'left' | 'right' | 'top' | 'bottom';
  size: number;                    // Percentage of viewport
}
```

### 3. Message Router (FDC3)

**Purpose:** Routes FDC3 messages between applications using postMessage.

```typescript
interface MessageRouter {
  // Context Broadcasting
  broadcast(context: Context, channelId?: string, sourceAppId?: string): void;
  
  // Intent Handling
  raiseIntent(intent: string, context: Context, sourceAppId?: string): Promise<IntentResolution>;
  registerIntentHandler(appId: string, intent: string, handler: IntentHandler): void;
  
  // Channel Management
  joinChannel(appId: string, channelId: string): void;
  leaveChannel(appId: string): void;
  getCurrentChannel(appId: string): string | null;
  
  // Listeners
  addContextListener(appId: string, contextType: string | null, handler: ContextHandler): Listener;
  removeListener(listenerId: string): void;
  
  // Bridge Communication
  registerApplication(appId: string, iframe: HTMLIFrameElement): void;
  unregisterApplication(appId: string): void;
  sendToApplication(appId: string, message: BridgeMessage): void;
}

interface BridgeMessage {
  type: 'broadcast' | 'intent' | 'channel' | 'listener';
  payload: any;
  sourceAppId?: string;
  targetAppId?: string;
  messageId: string;
  timestamp: number;
}

interface IntentHandler {
  (context: Context, metadata: IntentMetadata): Promise<IntentResult>;
}

interface IntentMetadata {
  source: AppIdentifier;
  intent: string;
}
```

### 4. FDC3 Bridge (Injected into iframes)

**Purpose:** Provides FDC3 API to applications running in iframes.

```typescript
// This script is injected into each application iframe
class FDC3Bridge implements DesktopAgent {
  private platformOrigin: string;
  private appId: string;
  
  constructor(platformOrigin: string, appId: string) {
    this.platformOrigin = platformOrigin;
    this.appId = appId;
    this.setupMessageListener();
  }
  
  // FDC3 2.0 API Implementation
  async broadcast(context: Context): Promise<void> {
    return this.sendToPlatform({
      type: 'broadcast',
      payload: { context }
    });
  }
  
  async raiseIntent(intent: string, context: Context, app?: AppIdentifier): Promise<IntentResolution> {
    return this.sendToPlatform({
      type: 'raiseIntent',
      payload: { intent, context, app }
    });
  }
  
  addContextListener(contextType: string | null, handler: ContextHandler): Promise<Listener> {
    const listenerId = this.generateId();
    this.contextListeners.set(listenerId, handler);
    
    this.sendToPlatform({
      type: 'addContextListener',
      payload: { contextType, listenerId }
    });
    
    return Promise.resolve({
      unsubscribe: () => this.removeListener(listenerId)
    });
  }
  
  async joinUserChannel(channelId: string): Promise<void> {
    return this.sendToPlatform({
      type: 'joinChannel',
      payload: { channelId }
    });
  }
  
  // postMessage communication
  private sendToPlatform(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateId();
      this.pendingMessages.set(messageId, { resolve, reject });
      
      window.parent.postMessage({
        ...message,
        messageId,
        appId: this.appId
      }, this.platformOrigin);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingMessages.has(messageId)) {
          this.pendingMessages.delete(messageId);
          reject(new Error('Platform communication timeout'));
        }
      }, 5000);
    });
  }
  
  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.origin !== this.platformOrigin) return;
      
      const { type, payload, messageId } = event.data;
      
      // Handle responses
      if (this.pendingMessages.has(messageId)) {
        const { resolve } = this.pendingMessages.get(messageId)!;
        this.pendingMessages.delete(messageId);
        resolve(payload);
        return;
      }
      
      // Handle incoming contexts
      if (type === 'context') {
        const listener = this.contextListeners.get(payload.listenerId);
        if (listener) {
          listener(payload.context);
        }
      }
    });
  }
}

// Auto-inject into window
if (window.parent !== window) {
  // We're in an iframe
  const platformOrigin = new URLSearchParams(window.location.search).get('platformOrigin');
  const appId = new URLSearchParams(window.location.search).get('appId');
  
  if (platformOrigin && appId) {
    window.fdc3 = new FDC3Bridge(platformOrigin, appId);
  }
}
```

### 5. Workspace Manager

**Purpose:** Persists and restores workspace configurations.

```typescript
interface WorkspaceManager {
  // Workspace CRUD
  saveWorkspace(name: string, config?: WorkspaceConfig): Promise<Workspace>;
  loadWorkspace(workspaceId: string): Promise<void>;
  deleteWorkspace(workspaceId: string): Promise<void>;
  getWorkspaces(): Promise<Workspace[]>;
  
  // Current Workspace
  getCurrentWorkspace(): Workspace | null;
  captureCurrentState(): WorkspaceConfig;
  
  // Sharing
  exportWorkspace(workspaceId: string): Promise<string>; // Returns JSON
  importWorkspace(json: string): Promise<Workspace>;
  generateShareableURL(workspaceId: string): string;
  
  // Auto-save
  enableAutoSave(interval: number): void;
  disableAutoSave(): void;
}

interface Workspace {
  id: string;
  name: string;
  config: WorkspaceConfig;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceConfig {
  applications: ApplicationState[];
  layout: LayoutConfig;
  channels: ChannelState[];
}

interface ApplicationState {
  appId: string;
  instanceId: string;
  url: string;
  windowState: {
    position: Position;
    size: Size;
    state: 'normal' | 'minimized' | 'maximized';
    zIndex: number;
  };
  context?: Context;               // Last context
  channelId?: string;              // Joined channel
}

interface LayoutConfig {
  type: 'free' | 'grid' | 'tabs';
  dockZones?: DockZone[];
  groups?: WindowGroup[];
}
```

### 6. Storage Manager

**Purpose:** Unified storage API with fallback support.

```typescript
interface StorageManager {
  // Storage Operations
  set(key: string, value: any): Promise<void>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
  
  // Quota Management
  getUsage(): Promise<StorageUsage>;
  requestQuota(bytes: number): Promise<boolean>;
  
  // Export/Import
  exportAll(): Promise<string>;
  importAll(data: string): Promise<void>;
}

interface StorageUsage {
  used: number;                    // Bytes used
  quota: number;                   // Total quota
  percentage: number;              // Usage percentage
}

// Implementation uses IndexedDB with localStorage fallback
class StorageManagerImpl implements StorageManager {
  private db: IDBDatabase | null = null;
  private fallbackToLocalStorage = false;
  
  async initialize(): Promise<void> {
    try {
      this.db = await this.openIndexedDB();
    } catch (error) {
      console.warn('IndexedDB unavailable, falling back to localStorage');
      this.fallbackToLocalStorage = true;
    }
  }
  
  async set(key: string, value: any): Promise<void> {
    if (this.fallbackToLocalStorage) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      // IndexedDB implementation
      const tx = this.db!.transaction(['store'], 'readwrite');
      const store = tx.objectStore('store');
      await store.put({ key, value });
    }
  }
  
  // ... other methods
}
```

## Data Models

### Application Manifest

```typescript
interface ApplicationManifest {
  appId: string;
  name: string;
  title: string;
  description?: string;
  version: string;
  
  // Application URLs
  url: string;                     // Main application URL
  iconUrl?: string;
  
  // Window Configuration
  window?: {
    defaultSize?: Size;
    minSize?: Size;
    maxSize?: Size;
    resizable?: boolean;
    frame?: boolean;
  };
  
  // FDC3 Configuration
  intents?: IntentMetadata[];
  interop?: {
    currentContextGroup?: string;
  };
  
  // Security
  sandbox?: string[];              // iframe sandbox attributes
  permissions?: string[];          // Requested permissions
  trustedOrigins?: string[];       // Allowed origins for postMessage
  
  // Metadata
  publisher?: string;
  categories?: string[];
  screenshots?: string[];
}

interface IntentMetadata {
  name: string;
  displayName: string;
  contexts: string[];              // Context types handled
}
```

## Error Handling

### Error Types

```typescript
enum PlatformErrorCode {
  // Initialization Errors
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED',
  STORAGE_UNAVAILABLE = 'STORAGE_UNAVAILABLE',
  
  // Application Errors
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  APP_LOAD_FAILED = 'APP_LOAD_FAILED',
  APP_CRASHED = 'APP_CRASHED',
  
  // Window Errors
  WINDOW_CREATE_FAILED = 'WINDOW_CREATE_FAILED',
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  
  // FDC3 Errors
  INTENT_NOT_FOUND = 'INTENT_NOT_FOUND',
  INTENT_TIMEOUT = 'INTENT_TIMEOUT',
  CHANNEL_ERROR = 'CHANNEL_ERROR',
  
  // Storage Errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  STORAGE_CORRUPTED = 'STORAGE_CORRUPTED',
  
  // Security Errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CORS_ERROR = 'CORS_ERROR',
  CSP_VIOLATION = 'CSP_VIOLATION'
}

class PlatformError extends Error {
  constructor(
    public code: PlatformErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PlatformError';
  }
}
```

### Error Recovery

```typescript
interface ErrorRecovery {
  // Application Recovery
  restartApplication(instanceId: string): Promise<void>;
  reloadApplication(instanceId: string): Promise<void>;
  
  // Storage Recovery
  repairStorage(): Promise<void>;
  clearCorruptedData(): Promise<void>;
  
  // Workspace Recovery
  loadLastKnownGoodWorkspace(): Promise<void>;
  resetToDefault(): Promise<void>;
}
```

## Testing Strategy

### Unit Tests
- **Core Services**: Test each service in isolation
- **Message Router**: Test FDC3 message routing logic
- **Window Manager**: Test window positioning calculations
- **Storage Manager**: Test storage operations and fallbacks

### Integration Tests
- **FDC3 Bridge**: Test postMessage communication between platform and iframes
- **Workspace Loading**: Test full workspace save/restore cycle
- **Multi-Application**: Test multiple apps communicating via FDC3

### Browser Compatibility Tests
- **Chrome/Edge**: Full feature support
- **Firefox**: Test with different security settings
- **Safari**: Test with ITP (Intelligent Tracking Prevention)
- **Mobile Browsers**: Test responsive layout and touch interactions

### Performance Tests
- **Load Time**: Platform initialization < 2 seconds
- **Memory Usage**: < 100MB with 5 applications
- **Frame Rate**: Maintain 60fps during window dragging
- **Message Latency**: FDC3 messages < 50ms

### E2E Tests (Playwright/Cypress)
```typescript
describe('Web Platform E2E', () => {
  it('should launch application and broadcast context', async () => {
    // Navigate to platform
    await page.goto('http://localhost:3000');
    
    // Launch app
    await page.click('[data-app-id="gmail"]');
    
    // Wait for iframe
    const iframe = await page.waitForSelector('iframe[data-app-id="gmail"]');
    
    // Broadcast context from platform
    await page.evaluate(() => {
      window.platform.broadcast({ type: 'fdc3.contact', name: 'John Doe' });
    });
    
    // Verify app received context
    const receivedContext = await iframe.evaluate(() => {
      return window.lastReceivedContext;
    });
    
    expect(receivedContext.name).toBe('John Doe');
  });
});
```

## Security Considerations

### iframe Sandboxing
```typescript
const defaultSandbox = [
  'allow-scripts',                 // Required for app functionality
  'allow-same-origin',             // Required for postMessage
  'allow-forms',                   // Allow form submission
  'allow-popups',                  // Allow popups (with user gesture)
];

const restrictedSandbox = [
  'allow-scripts',
  // No same-origin - more restrictive
];
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               frame-src *; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

### postMessage Validation
```typescript
function validateMessage(event: MessageEvent): boolean {
  // Validate origin
  if (!trustedOrigins.includes(event.origin)) {
    console.warn('Untrusted origin:', event.origin);
    return false;
  }
  
  // Validate message structure
  if (!event.data || typeof event.data !== 'object') {
    return false;
  }
  
  // Validate appId
  if (!event.data.appId || !registeredApps.has(event.data.appId)) {
    return false;
  }
  
  return true;
}
```

## Performance Optimization

### Lazy Loading
```typescript
// Load applications on-demand
async function launchApplication(appId: string): Promise<void> {
  const manifest = await fetchManifest(appId);
  
  // Create iframe but don't load URL yet
  const iframe = createIframe();
  
  // Load URL when window becomes visible
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      iframe.src = manifest.url;
      observer.disconnect();
    }
  });
  
  observer.observe(iframe);
}
```

### Virtual Scrolling for App List
```typescript
// Only render visible apps in launcher
function renderAppList(apps: ApplicationManifest[]): void {
  const visibleApps = apps.slice(scrollTop / itemHeight, scrollTop / itemHeight + visibleCount);
  // Render only visible apps
}
```

### Message Batching
```typescript
// Batch multiple context broadcasts
class MessageBatcher {
  private queue: BridgeMessage[] = [];
  private timer: number | null = null;
  
  enqueue(message: BridgeMessage): void {
    this.queue.push(message);
    
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), 16); // Next frame
    }
  }
  
  private flush(): void {
    const messages = this.queue.splice(0);
    this.sendBatch(messages);
    this.timer = null;
  }
}
```

## Mobile Considerations

### Responsive Layout
```typescript
interface MobileLayout {
  // Stack windows vertically on mobile
  stackWindows(): void;
  
  // Full-screen mode for focused app
  enterFullScreen(windowId: string): void;
  
  // Swipe gestures for navigation
  enableSwipeNavigation(): void;
  
  // Touch-optimized controls
  useLargeHitTargets(): void;
}
```

### Touch Gestures
```typescript
// Swipe between applications
function handleSwipe(direction: 'left' | 'right'): void {
  if (direction === 'left') {
    showNextApplication();
  } else {
    showPreviousApplication();
  }
}

// Pinch to zoom (if allowed)
function handlePinch(scale: number): void {
  if (scale > 1) {
    zoomIn();
  } else {
    zoomOut();
  }
}
```

## Progressive Web App (PWA)

### Service Worker
```typescript
// Cache platform shell for offline use
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('platform-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/app.js',
        '/app.css',
        '/bridge.js'
      ]);
    })
  );
});

// Serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

### Manifest
```json
{
  "name": "Open OpenFin Web Platform",
  "short_name": "OpenFin Web",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976d2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Deployment

### Static Hosting
- Deploy to: Netlify, Vercel, GitHub Pages, AWS S3
- CDN for global distribution
- HTTPS required for Service Workers

### Configuration
```typescript
// Environment-specific config
const config = {
  production: {
    appDirectory: 'https://apps.example.com/directory.json',
    analyticsEnabled: true,
    debugMode: false
  },
  development: {
    appDirectory: 'http://localhost:3001/directory.json',
    analyticsEnabled: false,
    debugMode: true
  }
};
```

## Dual Platform Strategy

### How Desktop and Web Coexist

**Separate Entry Points:**
```
# Desktop (Electron)
npm run start              # Launches Electron app
npm run build:exe          # Builds desktop executable

# Web (Browser)
npm run start:web          # Launches web dev server
npm run build:web          # Builds static web bundle
```

**Shared Core Logic:**
```typescript
// packages/fdc3-core/ChannelManager.ts
// Used by BOTH desktop and web
export class ChannelManager {
  private channels: Map<string, Channel> = new Map();
  
  joinChannel(appId: string, channelId: string): void {
    // Platform-agnostic logic
  }
  
  broadcast(context: Context, channelId: string): void {
    // Platform-agnostic logic
  }
}

// Desktop uses it:
// packages/runtime/src/services/DesktopChannelManager.ts
import { ChannelManager } from '@desktop-interop/fdc3-core';
export class DesktopChannelManager extends ChannelManager {
  // Electron-specific IPC
}

// Web uses it:
// packages/web-platform/src/core/WebChannelManager.ts
import { ChannelManager } from '@desktop-interop/fdc3-core';
export class WebChannelManager extends ChannelManager {
  // postMessage-specific implementation
}
```

**Platform Detection:**
```typescript
// Applications detect which platform they're running on
export function detectPlatform(): 'desktop' | 'web' | 'standalone' {
  if (typeof window.fin !== 'undefined') {
    return 'desktop';  // OpenFin/Electron
  } else if (window.parent !== window && window.fdc3) {
    return 'web';      // Web platform iframe
  } else {
    return 'standalone'; // No platform
  }
}
```

**Unified FDC3 API:**
```typescript
// Applications use the same FDC3 API regardless of platform
async function init() {
  const platform = detectPlatform();
  
  if (platform === 'desktop') {
    // Desktop: window.fin.desktop.fdc3
    const fdc3 = window.fin.desktop.fdc3;
  } else if (platform === 'web') {
    // Web: window.fdc3 (injected by bridge)
    const fdc3 = window.fdc3;
  }
  
  // Same API from here on!
  await fdc3.broadcast({ type: 'fdc3.instrument', id: { ticker: 'AAPL' } });
}
```

### Deployment Options

**Option 1: Separate Deployments**
- Desktop: Distributed as .exe/.dmg/.AppImage
- Web: Hosted at https://platform.example.com
- Applications work on both without modification

**Option 2: Hybrid Deployment**
- Desktop app includes embedded web server
- Can launch web version from desktop
- Useful for testing and development

**Option 3: Progressive Enhancement**
- Start with web version (zero install)
- Offer desktop download for advanced features
- Seamless migration of workspaces

## Migration Path from Desktop

### Dual-Mode Applications
```typescript
// Applications can detect environment
if (window.fin) {
  // Running in OpenFin desktop
  const fdc3 = window.fin.desktop.fdc3;
} else if (window.fdc3) {
  // Running in web platform
  const fdc3 = window.fdc3;
} else {
  // Standalone web app
  console.warn('No FDC3 platform detected');
}
```

### Feature Detection
```typescript
interface PlatformCapabilities {
  hasNativeWindows: boolean;       // Desktop only
  hasSystemTray: boolean;          // Desktop only
  hasNotifications: boolean;       // Both
  hasOfflineSupport: boolean;      // Web with SW
  hasMultiMonitor: boolean;        // Desktop only
  hasClipboard: boolean;           // Both (with permissions)
}

function detectCapabilities(): PlatformCapabilities {
  return {
    hasNativeWindows: !!window.fin,
    hasSystemTray: !!window.fin,
    hasNotifications: 'Notification' in window,
    hasOfflineSupport: 'serviceWorker' in navigator,
    hasMultiMonitor: !!window.fin,
    hasClipboard: 'clipboard' in navigator
  };
}
```
