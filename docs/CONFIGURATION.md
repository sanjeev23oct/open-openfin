# Platform Configuration Guide

## Overview

The Desktop Interoperability Platform can be configured through JSON configuration files to customize runtime behavior, security policies, logging, and more.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Runtime Configuration](#runtime-configuration)
- [Security Configuration](#security-configuration)
- [Application Configuration](#application-configuration)
- [UI Configuration](#ui-configuration)
- [Logging Configuration](#logging-configuration)
- [Deployment Options](#deployment-options)
- [Examples](#examples)

---

## Configuration Files

### Configuration File Locations

**User-level configuration:**
```
Windows: %APPDATA%\DesktopInterop\config.json
macOS: ~/Library/Application Support/DesktopInterop/config.json
Linux: ~/.config/DesktopInterop/config.json
```

**System-level configuration:**
```
Windows: %PROGRAMDATA%\DesktopInterop\config.json
macOS: /Library/Application Support/DesktopInterop/config.json
Linux: /etc/DesktopInterop/config.json
```

### Configuration Priority

1. Command-line arguments (highest priority)
2. User-level configuration
3. System-level configuration
4. Default configuration (lowest priority)

---

## Runtime Configuration

Configure runtime behavior and performance settings.

```json
{
  "runtime": {
    "autoUpdate": true,
    "crashReporting": true,
    "logLevel": "info",
    "maxApplications": 50,
    "maxWindowsPerApplication": 20,
    "ipcTimeout": 5000,
    "enableHardwareAcceleration": true
  }
}
```

### Runtime Options

#### autoUpdate
Enable automatic runtime updates.

```json
{
  "autoUpdate": true
}
```

**Default:** `true`

#### crashReporting
Enable crash reporting and diagnostics.

```json
{
  "crashReporting": true
}
```

**Default:** `true`

#### logLevel
Logging verbosity level.

```json
{
  "logLevel": "info"
}
```

**Options:** `"debug"`, `"info"`, `"warn"`, `"error"`  
**Default:** `"info"`

#### maxApplications
Maximum number of concurrent applications.

```json
{
  "maxApplications": 50
}
```

**Default:** `50`

#### maxWindowsPerApplication
Maximum windows per application.

```json
{
  "maxWindowsPerApplication": 20
}
```

**Default:** `20`

#### ipcTimeout
IPC communication timeout in milliseconds.

```json
{
  "ipcTimeout": 5000
}
```

**Default:** `5000` (5 seconds)

#### enableHardwareAcceleration
Enable GPU hardware acceleration.

```json
{
  "enableHardwareAcceleration": true
}
```

**Default:** `true`

---

## Security Configuration

Configure security policies and permissions.

```json
{
  "security": {
    "csp": {
      "defaultSrc": ["'self'"],
      "scriptSrc": ["'self'", "'unsafe-inline'"],
      "connectSrc": ["'self'", "https://api.example.com"],
      "imgSrc": ["'self'", "data:", "https:"],
      "styleSrc": ["'self'", "'unsafe-inline'"]
    },
    "urlWhitelist": [
      "https://*.example.com",
      "https://trusted-domain.com"
    ],
    "sandboxing": true,
    "contextIsolation": true,
    "nodeIntegration": false,
    "allowedProtocols": ["https", "wss"]
  }
}
```

### Security Options

#### csp (Content Security Policy)
Define Content Security Policy rules.

```json
{
  "csp": {
    "defaultSrc": ["'self'"],
    "scriptSrc": ["'self'", "https://cdn.example.com"],
    "connectSrc": ["'self'", "https://api.example.com", "wss://ws.example.com"]
  }
}
```

**CSP Directives:**
- `defaultSrc` - Default source for all content
- `scriptSrc` - JavaScript sources
- `connectSrc` - AJAX, WebSocket, EventSource
- `imgSrc` - Image sources
- `styleSrc` - CSS sources
- `fontSrc` - Font sources
- `mediaSrc` - Audio/video sources

#### urlWhitelist
Allowed URL patterns for navigation.

```json
{
  "urlWhitelist": [
    "https://*.example.com",
    "https://trusted-domain.com",
    "file:///**"
  ]
}
```

**Pattern syntax:**
- `*` - Wildcard for single level
- `**` - Wildcard for multiple levels
- Exact match: `"https://example.com"`

#### sandboxing
Enable application sandboxing.

```json
{
  "sandboxing": true
}
```

**Default:** `true`

#### contextIsolation
Enable context isolation for renderer processes.

```json
{
  "contextIsolation": true
}
```

**Default:** `true`

#### nodeIntegration
Enable Node.js integration in renderer processes.

```json
{
  "nodeIntegration": false
}
```

**Default:** `false` (recommended for security)

#### allowedProtocols
Allowed URL protocols.

```json
{
  "allowedProtocols": ["https", "wss", "file"]
}
```

**Default:** `["https", "wss"]`

---

## Application Configuration

Configure application discovery and management.

```json
{
  "applications": {
    "manifestSources": [
      "https://app-directory.example.com/manifests",
      "file:///C:/apps/manifests"
    ],
    "autoLaunch": [
      "com.example.dashboard",
      "com.example.notifications"
    ],
    "crashRecovery": true,
    "restartOnCrash": true,
    "maxRestartAttempts": 3,
    "restartDelay": 1000
  }
}
```

### Application Options

#### manifestSources
Sources for application manifests.

```json
{
  "manifestSources": [
    "https://app-directory.example.com/manifests",
    "file:///C:/apps/manifests"
  ]
}
```

#### autoLaunch
Applications to launch on platform startup.

```json
{
  "autoLaunch": [
    "com.example.dashboard",
    "com.example.notifications"
  ]
}
```

#### crashRecovery
Enable crash detection and recovery.

```json
{
  "crashRecovery": true
}
```

**Default:** `true`

#### restartOnCrash
Automatically restart crashed applications.

```json
{
  "restartOnCrash": true
}
```

**Default:** `true`

#### maxRestartAttempts
Maximum restart attempts for crashed applications.

```json
{
  "maxRestartAttempts": 3
}
```

**Default:** `3`

#### restartDelay
Delay before restarting crashed application (ms).

```json
{
  "restartDelay": 1000
}
```

**Default:** `1000` (1 second)

---

## UI Configuration

Configure platform UI appearance and behavior.

```json
{
  "ui": {
    "theme": "dark",
    "branding": {
      "logo": "https://example.com/logo.png",
      "primaryColor": "#667eea",
      "companyName": "Example Corp"
    },
    "systemTray": {
      "enabled": true,
      "icon": "https://example.com/tray-icon.png"
    },
    "notifications": {
      "enabled": true,
      "position": "bottom-right"
    }
  }
}
```

### UI Options

#### theme
UI theme.

```json
{
  "theme": "dark"
}
```

**Options:** `"light"`, `"dark"`, `"system"`  
**Default:** `"system"`

#### branding
Custom branding configuration.

```json
{
  "branding": {
    "logo": "https://example.com/logo.png",
    "primaryColor": "#667eea",
    "companyName": "Example Corp"
  }
}
```

#### systemTray
System tray configuration.

```json
{
  "systemTray": {
    "enabled": true,
    "icon": "https://example.com/tray-icon.png",
    "tooltip": "Desktop Interop Platform"
  }
}
```

#### notifications
Notification configuration.

```json
{
  "notifications": {
    "enabled": true,
    "position": "bottom-right",
    "duration": 5000
  }
}
```

**Positions:** `"top-left"`, `"top-right"`, `"bottom-left"`, `"bottom-right"`

---

## Logging Configuration

Configure logging behavior and output.

```json
{
  "logging": {
    "level": "info",
    "destination": "file",
    "maxFileSize": 10485760,
    "maxFiles": 5,
    "logDirectory": "%APPDATA%/DesktopInterop/logs",
    "console": true,
    "remote": {
      "enabled": false,
      "endpoint": "https://logs.example.com/api/logs"
    }
  }
}
```

### Logging Options

#### level
Log level.

```json
{
  "level": "info"
}
```

**Options:** `"debug"`, `"info"`, `"warn"`, `"error"`  
**Default:** `"info"`

#### destination
Log output destination.

```json
{
  "destination": "file"
}
```

**Options:** `"file"`, `"console"`, `"both"`  
**Default:** `"file"`

#### maxFileSize
Maximum log file size in bytes.

```json
{
  "maxFileSize": 10485760
}
```

**Default:** `10485760` (10 MB)

#### maxFiles
Maximum number of log files to keep.

```json
{
  "maxFiles": 5
}
```

**Default:** `5`

#### logDirectory
Directory for log files.

```json
{
  "logDirectory": "%APPDATA%/DesktopInterop/logs"
}
```

#### console
Enable console logging.

```json
{
  "console": true
}
```

**Default:** `true` (development), `false` (production)

#### remote
Remote logging configuration.

```json
{
  "remote": {
    "enabled": true,
    "endpoint": "https://logs.example.com/api/logs",
    "apiKey": "your-api-key"
  }
}
```

---

## Deployment Options

### Enterprise Deployment

#### Group Policy Configuration

**Windows:**
```
HKEY_LOCAL_MACHINE\SOFTWARE\Policies\DesktopInterop
```

**Registry values:**
- `ConfigPath` (REG_SZ) - Path to configuration file
- `AutoUpdate` (REG_DWORD) - Enable auto-update (0/1)
- `LogLevel` (REG_SZ) - Log level

#### Configuration Management

Deploy configuration via:
- Group Policy
- SCCM/Intune
- Puppet/Chef/Ansible
- Custom deployment scripts

### Cloud Configuration

Host configuration files on a web server:

```json
{
  "configUrl": "https://config.example.com/platform-config.json"
}
```

Platform will fetch and apply remote configuration on startup.

### Environment Variables

Override configuration with environment variables:

```bash
DESKTOP_INTEROP_LOG_LEVEL=debug
DESKTOP_INTEROP_AUTO_UPDATE=false
DESKTOP_INTEROP_CONFIG_PATH=/path/to/config.json
```

### Command-Line Arguments

Override configuration with command-line arguments:

```bash
DesktopInterop.exe --log-level=debug --no-auto-update --config=/path/to/config.json
```

---

## Examples

### Example 1: Development Configuration

```json
{
  "runtime": {
    "autoUpdate": false,
    "logLevel": "debug",
    "crashReporting": false
  },
  "security": {
    "allowedProtocols": ["https", "http", "ws", "wss", "file"],
    "urlWhitelist": ["*"]
  },
  "logging": {
    "level": "debug",
    "destination": "both",
    "console": true
  }
}
```

### Example 2: Production Configuration

```json
{
  "runtime": {
    "autoUpdate": true,
    "logLevel": "warn",
    "crashReporting": true,
    "enableHardwareAcceleration": true
  },
  "security": {
    "csp": {
      "defaultSrc": ["'self'"],
      "scriptSrc": ["'self'"],
      "connectSrc": ["'self'", "https://api.example.com"]
    },
    "urlWhitelist": [
      "https://*.example.com"
    ],
    "sandboxing": true,
    "contextIsolation": true,
    "nodeIntegration": false
  },
  "applications": {
    "manifestSources": [
      "https://app-directory.example.com/manifests"
    ],
    "crashRecovery": true,
    "restartOnCrash": true
  },
  "logging": {
    "level": "warn",
    "destination": "file",
    "maxFileSize": 10485760,
    "maxFiles": 10,
    "remote": {
      "enabled": true,
      "endpoint": "https://logs.example.com/api/logs"
    }
  }
}
```

### Example 3: Enterprise Configuration

```json
{
  "runtime": {
    "autoUpdate": false,
    "logLevel": "info",
    "crashReporting": true
  },
  "security": {
    "csp": {
      "defaultSrc": ["'self'"],
      "scriptSrc": ["'self'", "https://cdn.company.com"],
      "connectSrc": ["'self'", "https://api.company.com", "wss://ws.company.com"]
    },
    "urlWhitelist": [
      "https://*.company.com",
      "https://trusted-partner.com"
    ],
    "sandboxing": true,
    "contextIsolation": true
  },
  "applications": {
    "manifestSources": [
      "https://apps.company.com/manifests"
    ],
    "autoLaunch": [
      "com.company.dashboard",
      "com.company.notifications"
    ],
    "crashRecovery": true
  },
  "ui": {
    "theme": "light",
    "branding": {
      "logo": "https://assets.company.com/logo.png",
      "primaryColor": "#0066cc",
      "companyName": "Company Name"
    },
    "systemTray": {
      "enabled": true,
      "icon": "https://assets.company.com/tray-icon.png"
    }
  },
  "logging": {
    "level": "info",
    "destination": "file",
    "maxFileSize": 52428800,
    "maxFiles": 20,
    "remote": {
      "enabled": true,
      "endpoint": "https://logs.company.com/api/platform-logs"
    }
  }
}
```

### Example 4: Minimal Configuration

```json
{
  "runtime": {
    "logLevel": "info"
  },
  "security": {
    "urlWhitelist": [
      "https://*.example.com"
    ]
  }
}
```

---

## Configuration Validation

The platform validates configuration on load. Common validation errors:

### Invalid Log Level

```
Error: Invalid log level: invalid
```

**Fix:**
```json
{
  "logging": {
    "level": "info"
  }
}
```

### Invalid URL Pattern

```
Error: Invalid URL pattern: not-a-url
```

**Fix:**
```json
{
  "security": {
    "urlWhitelist": [
      "https://example.com"
    ]
  }
}
```

### Invalid CSP Directive

```
Error: Invalid CSP directive: invalidDirective
```

**Fix:**
```json
{
  "security": {
    "csp": {
      "defaultSrc": ["'self'"]
    }
  }
}
```

---

## Runtime Configuration Updates

Some configuration options can be updated at runtime:

```javascript
const config = fin.System.getConfiguration();

// Update log level
await config.set('logging.level', 'debug');

// Update theme
await config.set('ui.theme', 'dark');

// Reload configuration
await config.reload();
```

**Hot-reloadable options:**
- `logging.level`
- `ui.theme`
- `ui.branding`
- `applications.autoLaunch`

**Requires restart:**
- `security.csp`
- `security.sandboxing`
- `runtime.enableHardwareAcceleration`

---

## Best Practices

### 1. Use Strict Security in Production

✅ Good:
```json
{
  "security": {
    "sandboxing": true,
    "contextIsolation": true,
    "nodeIntegration": false
  }
}
```

### 2. Limit URL Whitelist

❌ Bad:
```json
{
  "security": {
    "urlWhitelist": ["*"]
  }
}
```

✅ Good:
```json
{
  "security": {
    "urlWhitelist": [
      "https://*.example.com"
    ]
  }
}
```

### 3. Enable Crash Reporting

✅ Good:
```json
{
  "runtime": {
    "crashReporting": true
  },
  "applications": {
    "crashRecovery": true
  }
}
```

### 4. Configure Appropriate Log Levels

Development:
```json
{
  "logging": {
    "level": "debug"
  }
}
```

Production:
```json
{
  "logging": {
    "level": "warn"
  }
}
```

### 5. Use Remote Logging in Production

✅ Good:
```json
{
  "logging": {
    "remote": {
      "enabled": true,
      "endpoint": "https://logs.example.com/api/logs"
    }
  }
}
```

---

## See Also

- [API Documentation](API.md)
- [Application Manifest Guide](MANIFEST.md)
- [Getting Started Guide](GETTING-STARTED.md)
- [Security Best Practices](SECURITY.md)
