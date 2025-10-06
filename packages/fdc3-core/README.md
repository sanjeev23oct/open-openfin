# @desktop-interop/fdc3-core

Shared FDC3 core logic for both desktop (Electron) and web (browser) platforms.

## Overview

This package contains platform-agnostic implementations of core FDC3 functionality:

- **ChannelManager**: Manages user, app, and private channels
- **IntentResolver**: Resolves intents to handler applications
- **ContextRouter**: Routes context messages to subscribers

## Usage

### Desktop Platform (Electron)

```typescript
import { ChannelManager } from '@desktop-interop/fdc3-core';

class DesktopChannelManager extends ChannelManager {
  // Add Electron-specific IPC handling
}
```

### Web Platform (Browser)

```typescript
import { ChannelManager } from '@desktop-interop/fdc3-core';

class WebChannelManager extends ChannelManager {
  // Add postMessage-specific handling
}
```

## Design Principles

- **Platform-agnostic**: No dependencies on Electron or browser-specific APIs
- **Extensible**: Designed to be extended by platform-specific implementations
- **Type-safe**: Full TypeScript support with FDC3 2.0 types
- **Tested**: Comprehensive unit tests for core logic

## Dependencies

- `@desktop-interop/fdc3`: FDC3 type definitions
