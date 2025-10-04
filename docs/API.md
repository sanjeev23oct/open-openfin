# API Documentation

## Overview

The Desktop Interoperability Platform provides two main APIs for application developers:

1. **fin API** - Platform-specific APIs for window management, application lifecycle, and system integration
2. **FDC3 API** - Standards-based APIs for inter-application communication and context sharing

Both APIs are automatically injected into all application windows and are available globally.

## Table of Contents

- [fin API](#fin-api)
  - [Application API](#application-api)
  - [Window API](#window-api)
  - [InterApplicationBus API](#interapplicationbus-api)
  - [System API](#system-api)
  - [Platform API](#platform-api)
- [FDC3 API](#fdc3-api)
  - [Context Broadcasting](#context-broadcasting)
  - [Intent Resolution](#intent-resolution)
  - [Channels](#channels)
  - [Context Listeners](#context-listeners)

---

## fin API

The `fin` global object provides access to platform-specific functionality.

### Application API

Manage application lifecycle and metadata.

#### fin.Application.create(manifest)

Creates a new application instance from a manifest.

**Parameters:**
- `manifest` (ApplicationManifest): Application manifest configuration

**Returns:** `Promise<Application>`

**Example:**
```javascript
const app = await fin.Application.create({
  uuid: 'my-app',
  name: 'My Application',
  url: 'https://example.com/app',
  autoShow: true
});

await app.run();
```

#### fin.Application.getCurrent()

Gets the current application instance.

**Returns:** `Application`

**Example:**
```javascript
const currentApp = fin.Application.getCurrent();
console.log('Current app:', currentApp.identity.uuid);
```

#### fin.Application.wrap(identity)

Wraps an existing application by identity.

**Parameters:**
- `identity` (Identity): Application identity with uuid and name

**Returns:** `Application`

**Example:**
```javascript
const otherApp = fin.Application.wrap({
  uuid: 'other-app',
  name: 'Other Application'
});

const info = await otherApp.getInfo();
```

### Application Instance Methods

#### app.run()

Launches the application.

**Returns:** `Promise<void>`

**Example:**
```javascript
await app.run();
```

#### app.close()

Closes the application and all its windows.

**Returns:** `Promise<void>`

**Example:**
```javascript
await app.close();
```

#### app.getInfo()

Gets application information and metadata.

**Returns:** `Promise<ApplicationInfo>`

**Example:**
```javascript
const info = await app.getInfo();
console.log('App version:', info.version);
console.log('Manifest:', info.manifest);
```

#### app.getChildWindows()

Gets all windows belonging to this application.

**Returns:** `Promise<Window[]>`

**Example:**
```javascript
const windows = await app.getChildWindows();
console.log(`App has ${windows.length} windows`);
```

#### app.on(event, handler)

Subscribes to application events.

**Parameters:**
- `event` (string): Event name ('started', 'closed', 'crashed')
- `handler` (Function): Event handler function

**Events:**
- `started` - Application has started
- `closed` - Application has closed
- `crashed` - Application has crashed

**Example:**
```javascript
app.on('crashed', () => {
  console.log('Application crashed!');
});
```

---

### Window API

Manage windows and their properties.

#### fin.Window.create(options)

Creates a new window.

**Parameters:**
- `options` (WindowOptions): Window configuration

**Returns:** `Promise<Window>`

**Example:**
```javascript
const window = await fin.Window.create({
  url: 'https://example.com',
  width: 800,
  height: 600,
  frame: true,
  resizable: true
});

await window.show();
```

#### fin.Window.getCurrent()

Gets the current window instance.

**Returns:** `Window`

**Example:**
```javascript
const currentWindow = fin.Window.getCurrent();
await currentWindow.maximize();
```

#### fin.Window.wrap(identity)

Wraps an existing window by identity.

**Parameters:**
- `identity` (Identity): Window identity

**Returns:** `Window`

**Example:**
```javascript
const otherWindow = fin.Window.wrap({
  uuid: 'my-app',
  name: 'main-window'
});

await otherWindow.focus();
```

### Window Instance Methods

#### window.show()

Shows the window.

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.show();
```

#### window.hide()

Hides the window.

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.hide();
```

#### window.close()

Closes the window.

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.close();
```

#### window.focus()

Brings the window to front and focuses it.

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.focus();
```

#### window.getBounds()

Gets the window bounds (position and size).

**Returns:** `Promise<Bounds>`

**Example:**
```javascript
const bounds = await window.getBounds();
console.log('Position:', bounds.x, bounds.y);
console.log('Size:', bounds.width, bounds.height);
```

#### window.setBounds(bounds)

Sets the window bounds.

**Parameters:**
- `bounds` (Bounds): New bounds with x, y, width, height

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.setBounds({
  x: 100,
  y: 100,
  width: 800,
  height: 600
});
```

#### window.getState()

Gets the window state.

**Returns:** `Promise<WindowState>`

**Example:**
```javascript
const state = await window.getState();
console.log('State:', state); // 'normal', 'minimized', 'maximized', 'fullscreen'
```

#### window.setState(state)

Sets the window state.

**Parameters:**
- `state` (WindowState): 'normal', 'minimized', 'maximized', or 'fullscreen'

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.setState('maximized');
```

#### window.on(event, handler)

Subscribes to window events.

**Parameters:**
- `event` (string): Event name
- `handler` (Function): Event handler

**Events:**
- `moved` - Window has moved
- `resized` - Window has been resized
- `closed` - Window has closed
- `focused` - Window has gained focus
- `blurred` - Window has lost focus

**Example:**
```javascript
window.on('moved', (event) => {
  console.log('Window moved to:', event.x, event.y);
});
```

---

### InterApplicationBus API

Send and receive messages between applications.

#### fin.InterApplicationBus.publish(topic, message)

Publishes a message to all subscribers of a topic.

**Parameters:**
- `topic` (string): Topic name
- `message` (any): Message payload

**Returns:** `Promise<void>`

**Example:**
```javascript
await fin.InterApplicationBus.publish('market-data', {
  symbol: 'AAPL',
  price: 150.25
});
```

#### fin.InterApplicationBus.subscribe(uuid, name, topic, handler)

Subscribes to messages on a topic.

**Parameters:**
- `uuid` (string): Publisher UUID ('*' for all)
- `name` (string): Publisher name ('*' for all)
- `topic` (string): Topic name
- `handler` (Function): Message handler

**Returns:** `Promise<Subscription>`

**Example:**
```javascript
const subscription = await fin.InterApplicationBus.subscribe(
  '*',
  '*',
  'market-data',
  (message, sender) => {
    console.log('Received from', sender.uuid, ':', message);
  }
);

// Unsubscribe later
await subscription.unsubscribe();
```

#### fin.InterApplicationBus.send(uuid, name, topic, message)

Sends a direct message to a specific application.

**Parameters:**
- `uuid` (string): Target application UUID
- `name` (string): Target application name
- `topic` (string): Topic name
- `message` (any): Message payload

**Returns:** `Promise<any>` - Response from target

**Example:**
```javascript
const response = await fin.InterApplicationBus.send(
  'other-app',
  'Other Application',
  'get-data',
  { query: 'latest' }
);

console.log('Response:', response);
```

#### fin.InterApplicationBus.addReceiveListener(topic, handler)

Listens for direct messages sent to this application.

**Parameters:**
- `topic` (string): Topic name
- `handler` (Function): Message handler (can return response)

**Returns:** `Promise<Listener>`

**Example:**
```javascript
const listener = await fin.InterApplicationBus.addReceiveListener(
  'get-data',
  (message, sender) => {
    console.log('Request from', sender.uuid);
    
    // Return response
    return {
      data: 'Here is the data',
      timestamp: Date.now()
    };
  }
);
```

---

### System API

Access system-level functionality.

#### fin.System.getVersion()

Gets the platform version.

**Returns:** `Promise<string>`

**Example:**
```javascript
const version = await fin.System.getVersion();
console.log('Platform version:', version);
```

#### fin.System.getDeviceInfo()

Gets device information.

**Returns:** `Promise<DeviceInfo>`

**Example:**
```javascript
const info = await fin.System.getDeviceInfo();
console.log('OS:', info.os);
console.log('Architecture:', info.arch);
console.log('Memory:', info.memory);
```

#### fin.System.showDeveloperTools()

Opens developer tools for the current window.

**Returns:** `Promise<void>`

**Example:**
```javascript
await fin.System.showDeveloperTools();
```

#### fin.System.clipboard.write(text)

Writes text to clipboard (requires permission).

**Parameters:**
- `text` (string): Text to write

**Returns:** `Promise<void>`

**Example:**
```javascript
await fin.System.clipboard.write('Hello, clipboard!');
```

#### fin.System.clipboard.read()

Reads text from clipboard (requires permission).

**Returns:** `Promise<string>`

**Example:**
```javascript
const text = await fin.System.clipboard.read();
console.log('Clipboard:', text);
```

---

### Platform API

Access platform provider functionality.

#### fin.Platform.getCurrentSync()

Gets the current platform instance synchronously.

**Returns:** `Platform`

**Example:**
```javascript
const platform = fin.Platform.getCurrentSync();
```

#### platform.createWorkspace(config)

Creates a new workspace.

**Parameters:**
- `config` (WorkspaceConfig): Workspace configuration

**Returns:** `Promise<Workspace>`

**Example:**
```javascript
const workspace = await platform.createWorkspace({
  id: 'my-workspace',
  name: 'My Workspace',
  applications: [
    { appId: 'app1', manifestUrl: 'https://example.com/app1.json' },
    { appId: 'app2', manifestUrl: 'https://example.com/app2.json' }
  ]
});

await workspace.launch();
```

#### platform.getSnapshot()

Gets a snapshot of the current platform state.

**Returns:** `Promise<Snapshot>`

**Example:**
```javascript
const snapshot = await platform.getSnapshot();
console.log('Applications:', snapshot.applications);
console.log('Windows:', snapshot.windows);
```

#### platform.applySnapshot(snapshot)

Restores platform state from a snapshot.

**Parameters:**
- `snapshot` (Snapshot): Platform snapshot

**Returns:** `Promise<void>`

**Example:**
```javascript
await platform.applySnapshot(savedSnapshot);
```

---

## FDC3 API

The `window.fdc3` global object provides FDC3-compliant inter-application communication.

### Context Broadcasting

#### fdc3.broadcast(context)

Broadcasts context to all applications on the current channel.

**Parameters:**
- `context` (Context): FDC3 context object

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.fdc3.broadcast({
  type: 'fdc3.instrument',
  id: {
    ticker: 'AAPL'
  },
  name: 'Apple Inc.'
});
```

### Context Types

Common FDC3 context types:

**fdc3.instrument** - Financial instrument
```javascript
{
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL', ISIN: 'US0378331005' },
  name: 'Apple Inc.'
}
```

**fdc3.contact** - Contact information
```javascript
{
  type: 'fdc3.contact',
  id: { email: 'john@example.com' },
  name: 'John Doe'
}
```

**fdc3.organization** - Organization
```javascript
{
  type: 'fdc3.organization',
  id: { LEI: '123456789' },
  name: 'Example Corp'
}
```

---

### Intent Resolution

#### fdc3.raiseIntent(intent, context, target?)

Raises an intent to be handled by another application.

**Parameters:**
- `intent` (string): Intent name (e.g., 'ViewChart', 'ViewNews')
- `context` (Context): Context to pass to handler
- `target` (string, optional): Specific target application

**Returns:** `Promise<IntentResolution>`

**Example:**
```javascript
const result = await window.fdc3.raiseIntent(
  'ViewChart',
  {
    type: 'fdc3.instrument',
    id: { ticker: 'AAPL' },
    name: 'Apple Inc.'
  }
);

console.log('Intent handled by:', result.source);
```

#### fdc3.addIntentListener(intent, handler)

Registers a handler for an intent.

**Parameters:**
- `intent` (string): Intent name
- `handler` (Function): Intent handler function

**Returns:** `Promise<Listener>`

**Example:**
```javascript
const listener = await window.fdc3.addIntentListener(
  'ViewChart',
  (context) => {
    console.log('ViewChart intent received:', context);
    
    // Display chart for instrument
    displayChart(context.id.ticker);
    
    // Return result
    return {
      type: 'fdc3.nothing'
    };
  }
);
```

**Common Intents:**
- `ViewChart` - Display a chart
- `ViewNews` - Display news
- `ViewAnalysis` - Display analysis
- `ViewQuote` - Display quote
- `StartCall` - Start a call
- `StartChat` - Start a chat

---

### Channels

#### fdc3.joinUserChannel(channelId)

Joins a user channel.

**Parameters:**
- `channelId` (string): Channel ID ('red', 'blue', 'green', etc.)

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.fdc3.joinUserChannel('red');
console.log('Joined red channel');
```

#### fdc3.getCurrentChannel()

Gets the current channel.

**Returns:** `Promise<Channel | null>`

**Example:**
```javascript
const channel = await window.fdc3.getCurrentChannel();
if (channel) {
  console.log('Current channel:', channel.id);
}
```

#### fdc3.leaveCurrentChannel()

Leaves the current channel.

**Returns:** `Promise<void>`

**Example:**
```javascript
await window.fdc3.leaveCurrentChannel();
```

#### fdc3.getOrCreateChannel(channelId)

Gets or creates an app channel.

**Parameters:**
- `channelId` (string): Channel ID

**Returns:** `Promise<Channel>`

**Example:**
```javascript
const channel = await window.fdc3.getOrCreateChannel('my-app-channel');

// Broadcast on this channel
await channel.broadcast({
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL' }
});
```

---

### Context Listeners

#### fdc3.addContextListener(contextType, handler)

Listens for context broadcasts on the current channel.

**Parameters:**
- `contextType` (string | null): Context type to filter (null for all)
- `handler` (Function): Context handler function

**Returns:** `Promise<Listener>`

**Example:**
```javascript
const listener = await window.fdc3.addContextListener(
  'fdc3.instrument',
  (context) => {
    console.log('Received instrument:', context.id.ticker);
    updateUI(context);
  }
);

// Unsubscribe later
listener.unsubscribe();
```

#### Listen to all context types

```javascript
const listener = await window.fdc3.addContextListener(
  null,
  (context) => {
    console.log('Received context type:', context.type);
  }
);
```

---

## TypeScript Definitions

The platform provides full TypeScript type definitions for both APIs.

### Import Types

```typescript
import type {
  Application,
  Window,
  ApplicationManifest,
  WindowOptions,
  Identity,
  Bounds,
  WindowState
} from '@desktop-interop/sdk';

import type {
  Context,
  Intent,
  IntentResolution,
  Channel,
  Listener
} from '@desktop-interop/fdc3';
```

### Type Examples

```typescript
// Application manifest
const manifest: ApplicationManifest = {
  uuid: 'my-app',
  name: 'My Application',
  url: 'https://example.com',
  permissions: {
    System: {
      clipboard: true,
      notifications: true
    }
  }
};

// Window options
const options: WindowOptions = {
  url: 'https://example.com',
  width: 800,
  height: 600,
  frame: true,
  resizable: true
};

// FDC3 context
const context: Context = {
  type: 'fdc3.instrument',
  id: {
    ticker: 'AAPL'
  },
  name: 'Apple Inc.'
};
```

---

## Error Handling

All API methods return Promises and may throw errors. Always use try-catch blocks.

```javascript
try {
  await window.fdc3.broadcast(context);
} catch (error) {
  console.error('Failed to broadcast:', error.message);
}
```

### Common Errors

- `PermissionDenied` - Operation requires permission
- `NotFound` - Resource not found
- `InvalidArgument` - Invalid parameter
- `Timeout` - Operation timed out
- `NotSupported` - Feature not supported

---

## Best Practices

1. **Always check for API availability:**
```javascript
if (window.fdc3) {
  // Use FDC3 API
}
```

2. **Clean up listeners:**
```javascript
const listener = await window.fdc3.addContextListener('fdc3.instrument', handler);

// Later...
listener.unsubscribe();
```

3. **Handle errors gracefully:**
```javascript
try {
  await fin.Window.getCurrent().maximize();
} catch (error) {
  console.error('Failed to maximize:', error);
}
```

4. **Use TypeScript for type safety:**
```typescript
import type { Context } from '@desktop-interop/fdc3';

const context: Context = {
  type: 'fdc3.instrument',
  id: { ticker: 'AAPL' }
};
```

---

## See Also

- [Application Manifest Guide](MANIFEST.md)
- [Platform Configuration Guide](CONFIGURATION.md)
- [Getting Started Guide](GETTING-STARTED.md)
- [FDC3 Standard](https://fdc3.finos.org/)
