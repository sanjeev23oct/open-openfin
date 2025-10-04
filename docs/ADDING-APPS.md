# Adding External Applications

This guide explains how to add external web applications (like Gmail, Google, etc.) to the Desktop Interoperability Platform.

## Quick Start

To add any external web application, you need to:

1. Create a manifest file
2. Add the app to the launcher
3. Launch the platform

## Step-by-Step Guide

### 1. Create a Manifest File

Create a new directory in `apps/` for your application and add a `manifest.json` file:

```bash
mkdir apps/your-app-name
```

Create `apps/your-app-name/manifest.json`:

```json
{
  "startup_app": {
    "uuid": "com.company.app-name",
    "name": "Your App Name",
    "url": "https://example.com",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 1200,
    "defaultHeight": 800,
    "defaultLeft": 100,
    "defaultTop": 100,
    "resizable": true,
    "maximizable": true,
    "minimizable": true
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
        "https://example.com",
        "https://*.example.com"
      ]
    }
  }
}
```

### 2. Add to Launcher

Edit `platform-ui/launcher.html` and add your app to the `apps` array:

```javascript
const apps = [
  // ... existing apps ...
  {
    id: 'com.company.app-name',
    name: 'Your App Name',
    description: 'Description of your app',
    icon: '🚀', // Any emoji or icon
    manifest: 'apps/your-app-name/manifest.json'
  }
];
```

### 3. Launch the Platform

```bash
npm start
```

Your app will now appear in the launcher!

## Examples

### Gmail

**Manifest:** `apps/gmail/manifest.json`

```json
{
  "startup_app": {
    "uuid": "com.google.gmail",
    "name": "Gmail",
    "url": "https://mail.google.com",
    "autoShow": true,
    "frame": true,
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
        "https://*.google.com",
        "https://*.gstatic.com",
        "https://*.googleapis.com"
      ]
    }
  }
}
```

**Launcher Entry:**

```javascript
{
  id: 'com.google.gmail',
  name: 'Gmail',
  description: 'Google Mail in a container',
  icon: '📧',
  manifest: 'apps/gmail/manifest.json'
}
```

### Google Search

**Manifest:** `apps/google/manifest.json`

```json
{
  "startup_app": {
    "uuid": "com.google.search",
    "name": "Google Search",
    "url": "https://www.google.com",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 1024,
    "defaultHeight": 768
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
        "https://*.google.com",
        "https://*.gstatic.com"
      ]
    }
  }
}
```

### Slack

```json
{
  "startup_app": {
    "uuid": "com.slack.app",
    "name": "Slack",
    "url": "https://app.slack.com",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 1200,
    "defaultHeight": 900
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
        "https://*.slack.com",
        "https://*.slack-edge.com"
      ]
    }
  }
}
```

### Microsoft Teams

```json
{
  "startup_app": {
    "uuid": "com.microsoft.teams",
    "name": "Microsoft Teams",
    "url": "https://teams.microsoft.com",
    "autoShow": true,
    "frame": true,
    "defaultWidth": 1400,
    "defaultHeight": 900
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
        "https://*.microsoft.com",
        "https://*.microsoftonline.com",
        "https://*.office.com"
      ]
    }
  }
}
```

## Manifest Options

### Required Fields

- `uuid` - Unique identifier (use reverse domain notation)
- `name` - Display name
- `url` - Application URL

### Window Options

- `defaultWidth` - Initial window width (default: 800)
- `defaultHeight` - Initial window height (default: 600)
- `defaultLeft` - Initial X position
- `defaultTop` - Initial Y position
- `frame` - Show window frame (default: true)
- `resizable` - Allow resizing (default: true)
- `maximizable` - Allow maximizing (default: true)
- `minimizable` - Allow minimizing (default: true)
- `autoShow` - Show window on launch (default: true)

### Permissions

#### System Permissions

- `clipboard` - Read/write clipboard
- `notifications` - Show system notifications
- `launchExternalProcess` - Launch external processes
- `fileSystem` - Access file system

#### Network Permissions

Specify allowed domains for network access:

```json
"Network": {
  "domains": [
    "https://example.com",           // Exact domain
    "https://*.example.com",          // All subdomains
    "https://**example.com",          // All levels
    "wss://websocket.example.com"    // WebSocket
  ]
}
```

## Tips

### 1. Finding the Right URL

Some apps have specific URLs for web access:
- Gmail: `https://mail.google.com`
- Google Calendar: `https://calendar.google.com`
- Google Drive: `https://drive.google.com`
- Slack: `https://app.slack.com`
- Teams: `https://teams.microsoft.com`

### 2. Setting Window Size

Choose appropriate sizes based on the app:
- Email clients: 1200x800
- Chat apps: 1000x700
- Productivity apps: 1400x900
- Simple tools: 800x600

### 3. Network Domains

Include all domains the app needs:
- Main domain
- CDN domains (e.g., `*.gstatic.com`)
- API domains (e.g., `*.googleapis.com`)
- WebSocket domains

### 4. Testing

After adding an app:
1. Launch the platform
2. Click the app in the launcher
3. Check for any console errors
4. Verify the app loads correctly

## Troubleshooting

### App Won't Load

**Problem:** White screen or loading error

**Solutions:**
- Check the URL is correct
- Verify network domains include all required domains
- Check browser console for errors
- Some sites may block iframe embedding

### Permission Errors

**Problem:** Features don't work (clipboard, notifications)

**Solutions:**
- Add required permissions to manifest
- Check browser console for permission errors
- Some features may require user interaction first

### Network Errors

**Problem:** Resources fail to load

**Solutions:**
- Add missing domains to `Network.domains`
- Check browser console for blocked requests
- Use wildcard patterns for CDN domains

## Advanced: FDC3 Integration

To make your external app FDC3-enabled, you need to:

1. Add FDC3 intents to manifest
2. Inject FDC3 API via preload script
3. Implement intent handlers in the app

See [FDC3 Integration Guide](FDC3-INTEGRATION.md) for details.

## See Also

- [Application Manifest Guide](MANIFEST.md)
- [Platform Configuration](CONFIGURATION.md)
- [API Documentation](API.md)
