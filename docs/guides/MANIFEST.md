# Application Manifest Guide

## Overview

Application manifests define how applications are configured, launched, and integrated with the Desktop Interoperability Platform. Manifests are JSON files that specify application metadata, window options, permissions, and FDC3 capabilities.

## Table of Contents

- [Basic Structure](#basic-structure)
- [Manifest Schema](#manifest-schema)
- [Startup App Configuration](#startup-app-configuration)
- [Runtime Configuration](#runtime-configuration)
- [Permissions](#permissions)
- [FDC3 Integration](#fdc3-integration)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Basic Structure

A minimal application manifest:

```json
{
  "startup_app": {
    "uuid": "my-app",
    "name": "My Application",
    "url": "https://example.com/app"
  },
  "runtime": {
    "version": "0.1.0"
  }
}
```

---

## Manifest Schema

### Complete Manifest Structure

```json
{
  "startup_app": {
    "uuid": "string (required)",
    "name": "string (required)",
    "url": "string (required)",
    "autoShow": "boolean",
    "frame": "boolean",
    "defaultWidth": "number",
    "defaultHeight": "number",
    "defaultLeft": "number",
    "defaultTop": "number",
    "resizable": "boolean",
    "maximizable": "boolean",
    "minimizable": "boolean",
    "alwaysOnTop": "boolean",
    "icon": "string"
  },
  "runtime": {
    "version": "string (required)",
    "arguments": "string"
  },
  "shortcut": {
    "company": "string",
    "description": "string",
    "icon": "string",
    "name": "string",
    "target": ["desktop", "start-menu"]
  },
  "platform": {
    "uuid": "string",
    "autoShow": "boolean",
    "defaultWindowOptions": {}
  },
  "permissions": {
    "System": {
      "clipboard": "boolean",
      "notifications": "boolean",
      "launchExternalProcess": "boolean"
    },
    "Network": {
      "domains": ["string"]
    }
  },
  "fdc3": {
    "intents": [
      {
        "name": "string",
        "displayName": "string",
        "contexts": ["string"],
        "customConfig": {}
      }
    ]
  }
}
```

---

## Startup App Configuration

The `startup_app` section defines the main application window.

### Required Fields

#### uuid
Unique identifier for the application.

```json
{
  "uuid": "my-app-v1"
}
```

**Rules:**
- Must be unique across all applications
- Use reverse domain notation: `com.company.app`
- Include version if needed: `com.company.app-v2`

#### name
Display name of the application.

```json
{
  "name": "My Application"
}
```

#### url
Entry point URL for the application.

```json
{
  "url": "https://example.com/app/index.html"
}
```

**Supported protocols:**
- `https://` - Remote HTTPS URL
- `http://` - Remote HTTP URL (development only)
- `file://` - Local file path

### Optional Fields

#### autoShow
Whether to show the window automatically on launch.

```json
{
  "autoShow": true
}
```

**Default:** `true`

#### frame
Whether to show the window frame (title bar, borders).

```json
{
  "frame": true
}
```

**Default:** `true`

**Frameless window:**
```json
{
  "frame": false,
  "customChrome": true
}
```

#### Window Dimensions

```json
{
  "defaultWidth": 800,
  "defaultHeight": 600,
  "defaultLeft": 100,
  "defaultTop": 100
}
```

**Defaults:**
- `defaultWidth`: 800
- `defaultHeight`: 600
- `defaultLeft`: Center of screen
- `defaultTop`: Center of screen

#### Window Behavior

```json
{
  "resizable": true,
  "maximizable": true,
  "minimizable": true,
  "alwaysOnTop": false
}
```

**Defaults:** All `true` except `alwaysOnTop` (false)

#### icon
Application icon URL.

```json
{
  "icon": "https://example.com/icon.png"
}
```

---

## Runtime Configuration

The `runtime` section specifies which runtime version to use.

### version (required)
Runtime version to use.

```json
{
  "runtime": {
    "version": "0.1.0"
  }
}
```

**Version formats:**
- Exact version: `"0.1.0"`
- Minimum version: `">=0.1.0"`
- Version range: `"0.1.x"`

### arguments
Additional runtime arguments.

```json
{
  "runtime": {
    "version": "0.1.0",
    "arguments": "--enable-logging --log-level=debug"
  }
}
```

---

## Permissions

The `permissions` section defines what system resources the application can access.

### System Permissions

```json
{
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true,
      "launchExternalProcess": false
    }
  }
}
```

**Available permissions:**
- `clipboard` - Read/write clipboard
- `notifications` - Show system notifications
- `launchExternalProcess` - Launch external processes
- `fileSystem` - Access file system
- `camera` - Access camera
- `microphone` - Access microphone

### Network Permissions

```json
{
  "permissions": {
    "Network": {
      "domains": [
        "https://api.example.com",
        "https://*.example.com",
        "wss://websocket.example.com"
      ]
    }
  }
}
```

**Domain patterns:**
- Exact match: `"https://api.example.com"`
- Wildcard subdomain: `"https://*.example.com"`
- All subdomains: `"https://**example.com"`

### Permission Prompts

If a permission is not granted in the manifest, the user will be prompted:

```json
{
  "permissions": {
    "System": {
      "clipboard": false
    }
  }
}
```

When the app tries to access clipboard:
```javascript
try {
  await fin.System.clipboard.write('text');
} catch (error) {
  // User denied permission or permission not granted
}
```

---

## FDC3 Integration

The `fdc3` section defines FDC3 intents the application can handle.

### Intent Declaration

```json
{
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "displayName": "View Chart",
        "contexts": ["fdc3.instrument", "fdc3.portfolio"]
      },
      {
        "name": "ViewNews",
        "displayName": "View News",
        "contexts": ["fdc3.instrument", "fdc3.organization"]
      }
    ]
  }
}
```

### Intent Fields

#### name (required)
Intent name (standard FDC3 intent or custom).

**Standard FDC3 intents:**
- `ViewChart`
- `ViewNews`
- `ViewAnalysis`
- `ViewQuote`
- `StartCall`
- `StartChat`
- `StartEmail`

#### displayName
Human-readable intent name shown in resolver UI.

```json
{
  "name": "ViewChart",
  "displayName": "View Chart"
}
```

#### contexts
Array of context types this intent can handle.

```json
{
  "contexts": [
    "fdc3.instrument",
    "fdc3.portfolio",
    "fdc3.position"
  ]
}
```

**Standard FDC3 context types:**
- `fdc3.instrument` - Financial instrument
- `fdc3.contact` - Contact information
- `fdc3.organization` - Organization
- `fdc3.portfolio` - Portfolio
- `fdc3.position` - Position
- `fdc3.country` - Country

#### customConfig
Custom configuration for the intent.

```json
{
  "name": "ViewChart",
  "customConfig": {
    "chartType": "candlestick",
    "defaultTimeframe": "1D"
  }
}
```

---

## Examples

### Example 1: Simple Web Application

```json
{
  "startup_app": {
    "uuid": "simple-app",
    "name": "Simple Application",
    "url": "https://example.com/app",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 800,
    "defaultHeight": 600
  },
  "runtime": {
    "version": "0.1.0"
  },
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true
    }
  }
}
```

### Example 2: Frameless Application with Custom Chrome

```json
{
  "startup_app": {
    "uuid": "custom-chrome-app",
    "name": "Custom Chrome App",
    "url": "https://example.com/app",
    "frame": false,
    "defaultWidth": 1024,
    "defaultHeight": 768,
    "resizable": true,
    "alwaysOnTop": false
  },
  "runtime": {
    "version": "0.1.0"
  }
}
```

### Example 3: FDC3-Enabled Financial Application

```json
{
  "startup_app": {
    "uuid": "com.example.trading-app",
    "name": "Trading Application",
    "url": "https://trading.example.com",
    "icon": "https://trading.example.com/icon.png",
    "defaultWidth": 1200,
    "defaultHeight": 800
  },
  "runtime": {
    "version": "0.1.0"
  },
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true
    },
    "Network": {
      "domains": [
        "https://api.trading.example.com",
        "wss://stream.trading.example.com"
      ]
    }
  },
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "displayName": "View Chart",
        "contexts": ["fdc3.instrument"]
      },
      {
        "name": "ViewQuote",
        "displayName": "View Quote",
        "contexts": ["fdc3.instrument"]
      },
      {
        "name": "PlaceOrder",
        "displayName": "Place Order",
        "contexts": ["fdc3.instrument", "fdc3.order"]
      }
    ]
  }
}
```

### Example 4: Multi-Window Application

```json
{
  "startup_app": {
    "uuid": "multi-window-app",
    "name": "Multi-Window App",
    "url": "https://example.com/main",
    "defaultWidth": 800,
    "defaultHeight": 600
  },
  "runtime": {
    "version": "0.1.0"
  },
  "platform": {
    "uuid": "multi-window-platform",
    "defaultWindowOptions": {
      "frame": true,
      "resizable": true
    }
  }
}
```

### Example 5: Local Development Application

```json
{
  "startup_app": {
    "uuid": "dev-app",
    "name": "Development App",
    "url": "http://localhost:3000",
    "autoShow": true,
    "defaultWidth": 1024,
    "defaultHeight": 768
  },
  "runtime": {
    "version": "0.1.0",
    "arguments": "--enable-logging --log-level=debug"
  },
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true,
      "launchExternalProcess": true
    },
    "Network": {
      "domains": ["http://localhost:*", "ws://localhost:*"]
    }
  }
}
```

---

## Best Practices

### 1. Use Descriptive UUIDs

❌ Bad:
```json
{
  "uuid": "app1"
}
```

✅ Good:
```json
{
  "uuid": "com.company.trading-app"
}
```

### 2. Request Only Necessary Permissions

❌ Bad:
```json
{
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true,
      "launchExternalProcess": true,
      "fileSystem": true,
      "camera": true,
      "microphone": true
    }
  }
}
```

✅ Good:
```json
{
  "permissions": {
    "System": {
      "clipboard": true,
      "notifications": true
    }
  }
}
```

### 3. Specify Network Domains

❌ Bad:
```json
{
  "permissions": {
    "Network": {
      "domains": ["*"]
    }
  }
}
```

✅ Good:
```json
{
  "permissions": {
    "Network": {
      "domains": [
        "https://api.example.com",
        "https://*.example.com"
      ]
    }
  }
}
```

### 4. Provide Display Names for Intents

❌ Bad:
```json
{
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "contexts": ["fdc3.instrument"]
      }
    ]
  }
}
```

✅ Good:
```json
{
  "fdc3": {
    "intents": [
      {
        "name": "ViewChart",
        "displayName": "View Chart",
        "contexts": ["fdc3.instrument"]
      }
    ]
  }
}
```

### 5. Set Reasonable Window Sizes

❌ Bad:
```json
{
  "defaultWidth": 3840,
  "defaultHeight": 2160
}
```

✅ Good:
```json
{
  "defaultWidth": 1024,
  "defaultHeight": 768
}
```

### 6. Use HTTPS in Production

❌ Bad (production):
```json
{
  "url": "http://example.com/app"
}
```

✅ Good:
```json
{
  "url": "https://example.com/app"
}
```

### 7. Include Application Icon

✅ Good:
```json
{
  "icon": "https://example.com/icon.png"
}
```

### 8. Version Your Applications

✅ Good:
```json
{
  "uuid": "com.company.app-v2",
  "name": "My App v2.0"
}
```

---

## Manifest Validation

The platform validates manifests on load. Common validation errors:

### Missing Required Fields

```
Error: Manifest missing required field: uuid
```

**Fix:** Add the required field:
```json
{
  "startup_app": {
    "uuid": "my-app"
  }
}
```

### Invalid URL

```
Error: Invalid URL format: not-a-url
```

**Fix:** Use a valid URL:
```json
{
  "url": "https://example.com/app"
}
```

### Invalid Permission

```
Error: Unknown permission: invalidPermission
```

**Fix:** Use valid permission names:
```json
{
  "permissions": {
    "System": {
      "clipboard": true
    }
  }
}
```

---

## Manifest Hosting

### Remote Manifests

Host manifests on a web server:

```
https://example.com/manifests/my-app.json
```

Launch from URL:
```javascript
await fin.Application.create({
  manifestUrl: 'https://example.com/manifests/my-app.json'
}).run();
```

### Local Manifests

Use local file paths for development:

```
file:///C:/apps/my-app/manifest.json
```

### Manifest Updates

Update manifests without redeploying applications:

1. Update manifest on server
2. Restart application
3. New manifest is loaded automatically

---

## See Also

- [API Documentation](API.md)
- [Platform Configuration Guide](CONFIGURATION.md)
- [Getting Started Guide](GETTING-STARTED.md)
- [FDC3 Standard](https://fdc3.finos.org/)
