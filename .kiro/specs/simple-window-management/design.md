# Design Document - Simple Window Management

## Overview

This design focuses on implementing simple, reliable window management features using straightforward approaches. No complex event systems, no fancy overlays - just basic functionality that works.

## Architecture

### Core Components

1. **Window Position Tracker** - Simple Map storing last window position
2. **Context Menu Handler** - Adds snap/link options to right-click menu
3. **Window Link Manager** - Tracks which windows are linked together
4. **Workspace Storage** - Simple JSON file storage
5. **Launcher State Manager** - Tracks running apps

### Data Flow

```
User Action → IPC Handler → Simple Function → Direct Window API Call → Done
```

No complex state management, no event buses, just direct calls.

## Components and Interfaces

### 1. Window Position Tracker

```javascript
// Simple global variable
let lastWindowPosition = { x: 100, y: 100 };

function getNextWindowPosition(width, height) {
  const pos = { ...lastWindowPosition };
  lastWindowPosition.x += 50;
  lastWindowPosition.y += 50;
  
  // Wrap if off-screen
  if (lastWindowPosition.x + width > screenWidth) {
    lastWindowPosition.x = 100;
    lastWindowPosition.y = 100;
  }
  
  return pos;
}
```

### 2. Context Menu with Snap Options

```javascript
function showWindowContextMenu(window, appId) {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Snap Left',
      click: () => snapWindowLeft(window)
    },
    {
      label: 'Snap Right',
      click: () => snapWindowRight(window)
    },
    { type: 'separator' },
    {
      label: 'Link with...',
      submenu: getOtherWindows(appId).map(other => ({
        label: other.name,
        click: () => linkWindows(appId, other.id)
      }))
    }
  ]);
  menu.popup({ window });
}

function snapWindowLeft(window) {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  window.setBounds({
    x: 0,
    y: 0,
    width: Math.floor(width / 2),
    height: height
  });
}

function snapWindowRight(window) {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  window.setBounds({
    x: Math.floor(width / 2),
    y: 0,
    width: Math.floor(width / 2),
    height: height
  });
}
```

### 3. Window Link Manager

```javascript
// Simple Map: windowId -> linkedWindowId
const windowLinks = new Map();

function linkWindows(appId1, appId2) {
  windowLinks.set(appId1, appId2);
  windowLinks.set(appId2, appId1);
  
  // Add move listener to both
  const window1 = platform.appWindows.get(appId1);
  const window2 = platform.appWindows.get(appId2);
  
  window1.on('move', () => moveLinkedWindow(appId1, appId2));
  window2.on('move', () => moveLinkedWindow(appId2, appId1);
}

function moveLinkedWindow(movedId, linkedId) {
  // Get delta from last known position
  const movedWindow = platform.appWindows.get(movedId);
  const linkedWindow = platform.appWindows.get(linkedId);
  
  const movedBounds = movedWindow.getBounds();
  const lastBounds = windowLastBounds.get(movedId);
  
  if (lastBounds) {
    const deltaX = movedBounds.x - lastBounds.x;
    const deltaY = movedBounds.y - lastBounds.y;
    
    const linkedBounds = linkedWindow.getBounds();
    linkedWindow.setBounds({
      x: linkedBounds.x + deltaX,
      y: linkedBounds.y + deltaY,
      width: linkedBounds.width,
      height: linkedBounds.height
    });
  }
  
  windowLastBounds.set(movedId, movedBounds);
}
```

### 4. Workspace Storage

```javascript
function saveWorkspace(name) {
  const workspace = {
    name,
    apps: []
  };
  
  for (const [appId, window] of platform.appWindows.entries()) {
    workspace.apps.push({
      appId,
      bounds: window.getBounds()
    });
  }
  
  const workspacesPath = path.join(userDataPath, 'workspaces.json');
  let workspaces = {};
  
  if (fs.existsSync(workspacesPath)) {
    workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
  }
  
  workspaces[name] = workspace;
  fs.writeFileSync(workspacesPath, JSON.stringify(workspaces, null, 2));
}

function loadWorkspace(name) {
  const workspacesPath = path.join(userDataPath, 'workspaces.json');
  const workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
  const workspace = workspaces[name];
  
  // Close all windows
  for (const window of platform.appWindows.values()) {
    window.close();
  }
  
  // Launch apps
  setTimeout(() => {
    for (const app of workspace.apps) {
      const window = launchApplication(`apps/${app.appId}/manifest.json`, app.appId);
      window.setBounds(app.bounds);
    }
  }, 500);
}
```

### 5. Launcher State Updates

```javascript
// In launchApplication:
platform.launcherWindow.webContents.send('app-launched', appId);

// In window.on('closed'):
platform.launcherWindow.webContents.send('app-closed', appId);

// In launcher HTML:
window.platform.onAppLaunched((appId) => {
  runningApps.add(appId);
  renderApps();
});

window.platform.onAppClosed((appId) => {
  runningApps.delete(appId);
  renderApps();
});
```

## Data Models

### Window Position
```javascript
{
  x: number,
  y: number
}
```

### Window Link
```javascript
Map<appId: string, linkedAppId: string>
```

### Workspace
```javascript
{
  name: string,
  apps: [
    {
      appId: string,
      bounds: { x, y, width, height }
    }
  ]
}
```

## Error Handling

- If window doesn't exist: Log error, continue
- If workspace file corrupt: Show error, use empty workspaces
- If link target closed: Remove link, continue
- If snap fails: Log error, window stays where it is

## Testing Strategy

### Manual Testing (Required)

Each feature will be tested immediately after implementation:

1. **Auto-positioning:** Launch 3 apps, verify they don't overlap
2. **Snap buttons:** Right-click, snap left, snap right, verify positions
3. **Window linking:** Link 2 windows, drag one, verify other moves
4. **Workspace save:** Save, close apps, load, verify positions
5. **Running indicators:** Launch app, check green dot, close, check button changes

### Test Checklist

- [ ] Windows auto-position without overlap
- [ ] Snap left works
- [ ] Snap right works
- [ ] Link windows works
- [ ] Linked windows move together
- [ ] Unlink works
- [ ] Save workspace works
- [ ] Load workspace works
- [ ] Delete workspace works
- [ ] Running indicator shows correctly
- [ ] Focus button works

## Implementation Notes

- Use Electron's built-in window.setBounds() - no custom positioning
- Use Electron's Menu.buildFromTemplate() - no custom menus
- Use simple JSON files - no database
- Use Map for tracking - no complex state management
- Test each function immediately after writing it

## Performance Considerations

- Window movement: Direct setBounds() call, no throttling needed for simple case
- Workspace load: 500ms delay to let windows close, then launch
- File I/O: Synchronous is fine for small JSON files

## Security Considerations

- Workspace files stored in user's home directory
- No user input validation needed (just window positions)
- No network calls

## Deployment

- No build step required
- No dependencies to install
- Just restart the platform to use new features
