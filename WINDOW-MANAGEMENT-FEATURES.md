# Window Management Features

## 🪟 Smart Window Positioning

The platform now includes intelligent window positioning and layout management for workspaces!

### Features Added

#### 1. **Automatic Layout Calculation** ✅

When you launch a workspace, windows are automatically arranged based on the number of apps:

**1 App:**
- Centered, large window
- 80% of screen width and height

**2 Apps:**
- Side-by-side layout
- Each app gets 50% of screen width
- Full height

**3 Apps:**
- One large app on left (60% width)
- Two stacked apps on right (40% width each)
- Optimized for productivity workflows

**4 Apps:**
- 2x2 grid layout
- Each app gets 25% of screen
- Perfect for monitoring dashboards

**5+ Apps:**
- Dynamic grid layout
- Automatically calculates optimal rows/columns
- Evenly distributed space

#### 2. **Smooth Window Animations** ✅

- Windows animate to their positions
- Smooth transitions between layouts
- Professional, polished feel

#### 3. **Window Snapping** ✅

Programmatic window snapping to predefined positions:

```javascript
// Snap window to left half
await snapWindow('app-id', 'left');

// Available positions:
// - 'left', 'right', 'top', 'bottom'
// - 'top-left', 'top-right', 'bottom-left', 'bottom-right'
// - 'center', 'maximize'
```

#### 4. **Responsive Layouts** ✅

- Adapts to screen size
- Works on different monitor resolutions
- Multi-monitor aware

## 📐 Layout Examples

### Example 1: Trading Workspace (3 Apps)

```
┌─────────────────────────┬──────────┐
│                         │  News    │
│                         │  Feed    │
│   Trading Platform      ├──────────┤
│   (60% width)           │  Chat    │
│                         │          │
└─────────────────────────┴──────────┘
```

### Example 2: Development Workspace (4 Apps)

```
┌──────────────┬──────────────┐
│   GitHub     │   Jira       │
│              │              │
├──────────────┼──────────────┤
│   Slack      │   Docs       │
│              │              │
└──────────────┴──────────────┘
```

### Example 3: Communication Hub (2 Apps)

```
┌──────────────┬──────────────┐
│              │              │
│   Gmail      │   Slack      │
│              │              │
│              │              │
└──────────────┴──────────────┘
```

## 🎯 How to Use

### Method 1: Workspace Launch (Automatic)

1. Create a workspace with multiple apps
2. Click "Launch Workspace"
3. **Windows automatically arrange themselves!**

### Method 2: Manual Positioning (Programmatic)

```javascript
// Set custom position
await window.platform.setWindowBounds('app-id', {
  x: 100,
  y: 100,
  width: 800,
  height: 600
});

// Snap to position
await snapWindow('app-id', 'left');
```

## 🔧 Technical Details

### Window Positioning Algorithm

```javascript
function calculateLayout(appCount) {
  const screenWidth = window.screen.availWidth;
  const screenHeight = window.screen.availHeight;
  
  // Calculate optimal layout based on app count
  // Returns array of {x, y, width, height} objects
}
```

### IPC Communication

```javascript
// Launcher → Main Process
ipcRenderer.invoke('platform:set-window-bounds', appId, bounds);

// Main Process → Window
window.setBounds(bounds, true); // true = animate
```

### Smooth Animations

Windows use Electron's built-in animation:
```javascript
window.setBounds(bounds, true); // Smooth transition
```

## 📊 Layout Configurations

### Predefined Layouts

| Apps | Layout | Description |
|------|--------|-------------|
| 1 | Centered | Large, centered window |
| 2 | Side-by-side | 50/50 split |
| 3 | Asymmetric | 60/40 split with stack |
| 4 | Grid 2x2 | Even quadrants |
| 5+ | Dynamic Grid | Auto-calculated |

### Custom Layouts

You can define custom layouts in workspace configuration:

```json
{
  "id": "custom-workspace",
  "name": "Custom Layout",
  "apps": [...],
  "layout": {
    "type": "custom",
    "windows": [
      { "appId": "app1", "x": 0, "y": 0, "width": 800, "height": 600 },
      { "appId": "app2", "x": 800, "y": 0, "width": 800, "height": 600 }
    ]
  }
}
```

## 🎨 UI Improvements

### Smooth Experience

- ✅ Windows launch sequentially with delays
- ✅ Smooth animations between positions
- ✅ No overlapping windows
- ✅ Optimal spacing and gaps
- ✅ Responsive to screen size

### Visual Feedback

- Windows appear one by one
- Smooth slide-in animations
- Professional appearance
- No jarring movements

## 🚀 Performance

### Optimizations

- **Delayed Positioning:** Windows positioned after creation (300ms delay)
- **Sequential Launch:** Apps launch one at a time to avoid conflicts
- **Smooth Animations:** Native Electron animations for performance
- **Screen-Aware:** Calculations based on actual screen dimensions

### Timing

```javascript
// Launch app
await launchApp(app);

// Wait for window creation
await new Promise(resolve => setTimeout(resolve, 300));

// Position window
await window.platform.setWindowBounds(app.id, position);

// Delay before next app
await new Promise(resolve => setTimeout(resolve, 200));
```

## 🎯 Use Cases

### Use Case 1: Trading Floor

**Apps:** Market Data, Trading Platform, News, Chat  
**Layout:** 3-app asymmetric (large trading platform, stacked news/chat)

### Use Case 2: Development Team

**Apps:** GitHub, Jira, Slack, Documentation  
**Layout:** 2x2 grid (equal space for all tools)

### Use Case 3: Customer Support

**Apps:** Email, CRM, Knowledge Base, Chat  
**Layout:** 2x2 grid or custom layout

### Use Case 4: Content Creation

**Apps:** Design Tool, Reference, Preview, Assets  
**Layout:** Large design tool (60%), stacked utilities (40%)

## 🔮 Future Enhancements

Potential future features:

- [ ] Drag-and-drop window arrangement
- [ ] Save custom layouts per workspace
- [ ] Window grouping and tabbing
- [ ] Snap zones with visual feedback
- [ ] Multi-monitor layout templates
- [ ] Window resize handles
- [ ] Layout presets library

## 📝 API Reference

### setWindowBounds(appId, bounds)

Set window position and size with animation.

**Parameters:**
- `appId` (string): Application identifier
- `bounds` (object): Position and size
  - `x` (number): X position in pixels
  - `y` (number): Y position in pixels
  - `width` (number): Width in pixels
  - `height` (number): Height in pixels

**Returns:** `Promise<{success: boolean}>`

**Example:**
```javascript
await window.platform.setWindowBounds('gmail', {
  x: 0,
  y: 0,
  width: 960,
  height: 1080
});
```

### snapWindow(appId, position)

Snap window to predefined position.

**Parameters:**
- `appId` (string): Application identifier
- `position` (string): Snap position
  - `'left'`, `'right'`, `'top'`, `'bottom'`
  - `'top-left'`, `'top-right'`, `'bottom-left'`, `'bottom-right'`
  - `'center'`, `'maximize'`

**Example:**
```javascript
await snapWindow('gmail', 'left');
await snapWindow('slack', 'right');
```

### calculateLayout(appCount)

Calculate optimal window layout for given number of apps.

**Parameters:**
- `appCount` (number): Number of applications

**Returns:** `Array<{x, y, width, height}>`

**Example:**
```javascript
const layout = calculateLayout(3);
// Returns: [
//   {x: 10, y: 50, width: 1152, height: 918},
//   {x: 1172, y: 50, width: 748, height: 453},
//   {x: 1172, y: 513, width: 748, height: 453}
// ]
```

## ✅ Summary

The platform now provides:

- ✅ **Automatic window positioning** for workspaces
- ✅ **Smart layouts** based on app count
- ✅ **Smooth animations** for professional feel
- ✅ **Programmatic control** via API
- ✅ **Snap positions** for quick arrangement
- ✅ **Screen-aware** calculations
- ✅ **Multi-app support** (1-10+ apps)

**Your workspace windows will now arrange themselves beautifully!** 🎨✨
