# @desktop-interop/web-platform

Browser-based FDC3 interop platform that runs entirely in the browser without requiring desktop installation.

## Overview

This package provides a web-native implementation of the FDC3 interop platform, enabling:

- **Zero Installation**: Runs entirely in the browser
- **iframe-based Windows**: Each app runs in a sandboxed iframe
- **postMessage Communication**: Secure cross-origin messaging
- **Workspace Persistence**: Save/restore workspaces using browser storage
- **PWA Support**: Install as a Progressive Web App
- **Mobile Responsive**: Works on tablets and phones

## Architecture

```
┌─────────────────────────────────────┐
│      Browser Tab (Container)        │
│  ┌───────────────────────────────┐  │
│  │    Platform Shell (UI)        │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ App  │  │ App  │  │ App  │     │
│  │iframe│  │iframe│  │iframe│     │
│  └──────┘  └──────┘  └──────┘     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   Platform Core (JS)          │  │
│  │   - Window Manager            │  │
│  │   - Message Router            │  │
│  │   - Workspace Manager         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

### As a Standalone Application

Navigate to the hosted URL and the platform will load automatically.

### As a Library

```typescript
import { WebPlatformCore } from '@desktop-interop/web-platform';

const platform = new WebPlatformCore();

await platform.initialize({
  appDirectory: '/apps/directory.json',
  theme: 'light'
});
```

## Features

- ✅ Browser-based runtime
- ✅ iframe window management
- ✅ postMessage-based FDC3 messaging
- ✅ Workspace persistence (IndexedDB/localStorage)
- ✅ PWA support
- ✅ Mobile responsive
- ✅ Platform detection utilities

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with some limitations)
- Mobile browsers: Limited support

## Deployment

Deploy to any static hosting service:

- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## Security

- iframe sandboxing with restricted permissions
- postMessage origin validation
- Content Security Policy (CSP)
- No eval() or unsafe inline scripts
