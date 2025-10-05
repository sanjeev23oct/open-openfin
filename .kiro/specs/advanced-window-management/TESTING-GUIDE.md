# Advanced Window Management - Testing Guide

## Overview

This guide provides step-by-step instructions to test all implemented window management features.

---

## Prerequisites

### 1. Build the Project

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Or build specific packages
cd packages/runtime
npm run build
```

### 2. Start the Platform

```bash
# Start the platform
npm start

# Or run in development mode
npm run dev
```

---

## Testing Checklist

### ✅ Phase 1: Basic Setup
- [ ] Platform starts without errors
- [ ] Multiple windows can be created
- [ ] Windows can be moved and resized
- [ ] Console shows no errors

### ✅ Phase 2: Window Grouping
- [ ] Create window groups
- [ ] Tab bar appears
- [ ] Switch between tabs
- [ ] Drag tabs to reorder
- [ ] Drag tab out to ungroup
- [ ] Close individual tabs
- [ ] Move group moves all windows
- [ ] Resize group resizes all windows

### ✅ Phase 3: Window Docking
- [ ] Dock zones appear on drag
- [ ] Zones highlight on hover
- [ ] Dock to left edge
- [ ] Dock to right edge
- [ ] Dock to top edge (maximize)
- [ ] Dock to bottom edge
- [ ] Dock to corners (4 corners)
- [ ] Undock restores original position
- [ ] Multi-monitor docking works

### ✅ Phase 4: Window Snapping
- [ ] Snap to screen edges
- [ ] Snap to other windows
- [ ] Grid snapping (if enabled)
- [ ] Snap preview shows
- [ ] Snap relationships maintained
- [ ] Enable/disable snapping works

### ✅ Phase 5: Visual Feedback
- [ ] Overlays appear smoothly
- [ ] Overlays fade in/out
- [ ] Highlighted zones pulse
- [ ] Snap preview updates in real-time
- [ ] No visual glitches

### ✅ Phase 6: State Persistence
- [ ] Groups saved on close
- [ ] Groups restored on restart
- [ ] Docking state saved
- [ ] Docking state restored

---

## Detailed Testing Steps

## Test 1: Window Grouping

### 1.1 Create a Group

**Steps:**
1. Launch the platform
2. Open 3 application windows (e.g., sample-app-1, sample-app-2, sample-app-3)
3. Use the WindowManager API to create a group:

```javascript
// In browser console or via API
const windowManager = getWindowManager(); // Your method to access WindowManager
const windowIds = ['window-1', 'window-2', 'window-3']; // Replace with actual IDs
await windowManager.createWindowGroup(windowIds);
```

**Expected Results:**
- ✅ Tab bar appears above the windows
- ✅ All 3 windows are shown as tabs
- ✅ First window is active (highlighted)
- ✅ Tab bar shows window titles and icons

### 1.2 Switch Tabs

**Steps:**
1. Click on different tabs in the tab bar
2. Observe which window comes to front

**Expected Results:**
- ✅ Clicking a tab brings that window to front
- ✅ Active tab is highlighted
- ✅ Other windows stay in background
- ✅ Tab bar stays on top

### 1.3 Reorder Tabs

**Steps:**
1. Click and drag a tab to a different position
2. Release the mouse

**Expected Results:**
- ✅ Tab moves to new position
- ✅ Other tabs shift accordingly
- ✅ Tab order is updated
- ✅ No visual glitches

### 1.4 Drag Tab Out

**Steps:**
1. Click and drag a tab outside the tab bar
2. Release the mouse

**Expected Results:**
- ✅ Window is removed from group
- ✅ Window becomes independent
- ✅ Tab bar updates (tab removed)
- ✅ If only 1 tab remains, group is destroyed

### 1.5 Move Group

**Steps:**
1. Drag the tab bar to move the group
2. Observe all windows

**Expected Results:**
- ✅ All windows in group move together
- ✅ Relative positions maintained
- ✅ Tab bar stays with group
- ✅ Smooth movement

### 1.6 Resize Group

**Steps:**
1. Resize one window in the group
2. Observe other windows

**Expected Results:**
- ✅ All windows resize proportionally
- ✅ Tab bar width adjusts
- ✅ No windows get lost
- ✅ Smooth resizing

---

## Test 2: Window Docking

### 2.1 Dock to Left Edge

**Steps:**
1. Open a window
2. Start dragging the window
3. Move it near the left edge of the screen
4. Observe the dock zone overlay
5. Release the mouse

**Expected Results:**
- ✅ Dock zones appear when dragging starts
- ✅ Left edge zone highlights when near
- ✅ Preview shows window will take left half
- ✅ Window docks to left half on release
- ✅ Smooth animation (200ms)

### 2.2 Dock to Right Edge

**Steps:**
1. Drag window near right edge
2. Release

**Expected Results:**
- ✅ Right zone highlights
- ✅ Window takes right half
- ✅ Smooth animation

### 2.3 Dock to Top Edge

**Steps:**
1. Drag window near top edge
2. Release

**Expected Results:**
- ✅ Top zone highlights
- ✅ Window maximizes
- ✅ Smooth animation

### 2.4 Dock to Corners

**Steps:**
1. Drag window to top-left corner
2. Release
3. Repeat for other 3 corners

**Expected Results:**
- ✅ Corner zones highlight
- ✅ Window takes quarter of screen
- ✅ Works for all 4 corners
- ✅ Smooth animations

### 2.5 Undock Window

**Steps:**
1. Dock a window to any zone
2. Drag the window away from docked position
3. Release

**Expected Results:**
- ✅ Window undocks
- ✅ Original size/position restored
- ✅ Smooth animation

### 2.6 Multi-Monitor Docking

**If you have multiple monitors:**

**Steps:**
1. Drag window to second monitor
2. Dock to edge on second monitor

**Expected Results:**
- ✅ Dock zones appear on second monitor
- ✅ Docking works correctly
- ✅ Uses second monitor's dimensions

---

## Test 3: Window Snapping

### 3.1 Snap to Screen Edge

**Steps:**
1. Drag a window near the left edge of screen
2. Observe snap preview
3. Release

**Expected Results:**
- ✅ Snap preview appears when within 10px
- ✅ Window snaps to edge on release
- ✅ Smooth animation (150ms)

### 3.2 Snap to Another Window

**Steps:**
1. Open 2 windows side by side
2. Drag one window near the edge of the other
3. Observe snap preview
4. Release

**Expected Results:**
- ✅ Snap preview appears
- ✅ Windows align edge-to-edge
- ✅ No gap between windows
- ✅ Snap relationship created

### 3.3 Grid Snapping

**If grid snapping is enabled:**

**Steps:**
1. Enable grid snapping:
```javascript
windowManager.snappingManager.setSnapConfig({ snapToGrid: true, gridSize: 50 });
```
2. Drag a window
3. Observe snapping to grid

**Expected Results:**
- ✅ Window snaps to grid intersections
- ✅ Grid size is 50px (or configured value)
- ✅ Smooth snapping

### 3.4 Snap Relationships

**Steps:**
1. Snap two windows together (edge-to-edge)
2. Resize one window
3. Observe the other window

**Expected Results:**
- ✅ Both windows resize together
- ✅ Gap remains consistent
- ✅ Relationship maintained

### 3.5 Enable/Disable Snapping

**Steps:**
1. Disable snapping:
```javascript
windowManager.enableSnapping(false);
```
2. Try to snap a window
3. Enable snapping again:
```javascript
windowManager.enableSnapping(true);
```

**Expected Results:**
- ✅ When disabled, no snapping occurs
- ✅ When enabled, snapping works
- ✅ No errors in console

---

## Test 4: Visual Overlays

### 4.1 Dock Zone Overlays

**Steps:**
1. Start dragging a window
2. Observe overlays

**Expected Results:**
- ✅ Semi-transparent overlays appear on all edges
- ✅ Overlays show dock zones
- ✅ Smooth fade-in animation (150ms)
- ✅ Overlays are click-through (don't block mouse)

### 4.2 Highlight Active Zone

**Steps:**
1. While dragging, move near different zones
2. Observe highlighting

**Expected Results:**
- ✅ Zone highlights when mouse is near
- ✅ Highlight color is brighter
- ✅ Pulse animation on highlighted zone
- ✅ Only one zone highlighted at a time

### 4.3 Snap Preview

**Steps:**
1. Drag window near snap target
2. Observe preview

**Expected Results:**
- ✅ Preview overlay appears
- ✅ Shows where window will snap
- ✅ Updates in real-time as you move
- ✅ Smooth transitions

### 4.4 Overlay Cleanup

**Steps:**
1. Start dragging
2. Cancel drag (press Esc or release outside zones)
3. Observe overlays

**Expected Results:**
- ✅ Overlays fade out smoothly
- ✅ All overlays disappear
- ✅ No orphaned overlays
- ✅ No memory leaks

---

## Test 5: State Persistence

### 5.1 Save Group State

**Steps:**
1. Create a window group
2. Close the platform
3. Restart the platform

**Expected Results:**
- ✅ Group configuration is saved
- ✅ On restart, group is restored
- ✅ Tab bar reappears
- ✅ Window positions restored

### 5.2 Save Docking State

**Steps:**
1. Dock a window to an edge
2. Close the platform
3. Restart the platform

**Expected Results:**
- ✅ Docking state is saved
- ✅ On restart, window is docked
- ✅ Original bounds remembered for undocking

### 5.3 Clear State

**Steps:**
1. Clear saved state:
```javascript
await windowManager.groupManager.clearState();
await windowManager.dockingManager.clearState();
```
2. Restart platform

**Expected Results:**
- ✅ No groups restored
- ✅ No docking restored
- ✅ Clean slate

---

## Test 6: Error Handling

### 6.1 Invalid Window ID

**Steps:**
1. Try to group non-existent window:
```javascript
await windowManager.createWindowGroup(['invalid-id']);
```

**Expected Results:**
- ✅ Error is thrown
- ✅ Error message is clear
- ✅ Error code is provided
- ✅ Platform doesn't crash

### 6.2 Group with 1 Window

**Steps:**
1. Try to create group with only 1 window:
```javascript
await windowManager.createWindowGroup(['window-1']);
```

**Expected Results:**
- ✅ Error is thrown
- ✅ Message: "At least 2 windows required"
- ✅ Platform doesn't crash

### 6.3 Window Already in Group

**Steps:**
1. Create a group with window-1
2. Try to add window-1 to another group

**Expected Results:**
- ✅ Error is thrown
- ✅ Message indicates window is already grouped
- ✅ Platform doesn't crash

---

## Test 7: Performance

### 7.1 Many Windows

**Steps:**
1. Create 20+ windows
2. Try grouping, docking, snapping
3. Monitor performance

**Expected Results:**
- ✅ Operations remain smooth
- ✅ No lag or stuttering
- ✅ Animations stay at 60 FPS
- ✅ Memory usage is reasonable

### 7.2 Rapid Operations

**Steps:**
1. Rapidly drag windows
2. Quickly switch tabs
3. Fast dock/undock operations

**Expected Results:**
- ✅ No crashes
- ✅ Operations complete correctly
- ✅ No visual glitches
- ✅ Overlays don't get stuck

---

## Test 8: Multi-Monitor

**If you have multiple monitors:**

### 8.1 Drag Between Monitors

**Steps:**
1. Drag window from monitor 1 to monitor 2
2. Observe dock zones

**Expected Results:**
- ✅ Dock zones appear on both monitors
- ✅ Zones use correct monitor dimensions
- ✅ Docking works on both monitors

### 8.2 Monitor Disconnect

**Steps:**
1. Dock windows on secondary monitor
2. Disconnect secondary monitor
3. Observe windows

**Expected Results:**
- ✅ Windows move to primary monitor
- ✅ No windows lost
- ✅ Platform doesn't crash

### 8.3 Monitor Reconnect

**Steps:**
1. Reconnect secondary monitor
2. Observe windows

**Expected Results:**
- ✅ Windows restore to secondary monitor
- ✅ Positions are remembered
- ✅ Dock zones reappear

---

## Debugging Tips

### Check Console Logs

Look for these log messages:
```
WindowGroupManager initialized
DockingManager initialized
SnappingManager initialized
OverlayManager initialized
Created window group group-xxx with N windows
Docked window window-xxx to left
Snapped window window-xxx to edge
```

### Common Issues

**Issue: Overlays don't appear**
- Check: `config.showOverlays` is true
- Check: OverlayManager is initialized
- Check: No errors in console

**Issue: Snapping doesn't work**
- Check: Snapping is enabled
- Check: Snap distance is reasonable (10px)
- Check: Windows are in spatial index

**Issue: Tab bar doesn't show**
- Check: Group has 2+ windows
- Check: TabBarWindow created successfully
- Check: Tab bar HTML file exists

**Issue: State not persisting**
- Check: File permissions for userData directory
- Check: No errors during save/load
- Check: JSON files are valid

---

## API Testing Examples

### Test via Browser Console

```javascript
// Get window manager instance
const wm = getWindowManager(); // Your method

// Create group
const group = await wm.createWindowGroup(['window-1', 'window-2']);
console.log('Group created:', group);

// Get dock zones
const zones = wm.getDockZones();
console.log('Dock zones:', zones);

// Enable/disable snapping
wm.enableSnapping(false);
console.log('Snapping disabled');

wm.enableSnapping(true);
console.log('Snapping enabled');

// Get snap targets
const targets = wm.getSnapTargets('window-1');
console.log('Snap targets:', targets);

// Check if window is docked
const isDocked = wm.isWindowDocked('window-1');
console.log('Is docked:', isDocked);

// List all groups
const groups = wm.listGroups();
console.log('All groups:', groups);
```

---

## Automated Testing Script

Create a test script to automate basic tests:

```javascript
// test-window-management.js

async function runTests() {
  console.log('Starting window management tests...');
  
  // Test 1: Create windows
  console.log('Test 1: Creating windows...');
  const win1 = await createWindow({ title: 'Window 1' });
  const win2 = await createWindow({ title: 'Window 2' });
  const win3 = await createWindow({ title: 'Window 3' });
  console.log('✓ Windows created');
  
  // Test 2: Create group
  console.log('Test 2: Creating group...');
  const group = await windowManager.createWindowGroup([win1.id, win2.id, win3.id]);
  console.log('✓ Group created:', group.id);
  
  // Test 3: Switch tabs
  console.log('Test 3: Switching tabs...');
  await windowManager.setActiveTabInGroup(group.id, win2.id);
  console.log('✓ Tab switched');
  
  // Test 4: Dock window
  console.log('Test 4: Docking window...');
  const zones = windowManager.getDockZones();
  await windowManager.dockWindowToZone(win1.id, zones[0]);
  console.log('✓ Window docked');
  
  // Test 5: Undock window
  console.log('Test 5: Undocking window...');
  await windowManager.undockWindow(win1.id);
  console.log('✓ Window undocked');
  
  console.log('All tests passed! ✓');
}

runTests().catch(console.error);
```

---

## Performance Benchmarks

### Expected Performance Metrics

| Operation | Target | Acceptable |
|-----------|--------|------------|
| Group creation | < 100ms | < 200ms |
| Tab switch | < 50ms | < 100ms |
| Dock animation | 200ms | 250ms |
| Snap detection | < 5ms | < 10ms |
| Overlay fade | 150ms | 200ms |
| Spatial index query | < 2ms | < 5ms |

### Measure Performance

```javascript
// Measure group creation
console.time('createGroup');
await windowManager.createWindowGroup(windowIds);
console.timeEnd('createGroup');

// Measure snap detection
console.time('snapDetection');
const targets = windowManager.getSnapTargets('window-1');
console.timeEnd('snapDetection');
```

---

## Reporting Issues

When reporting issues, include:

1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Console errors** (if any)
5. **Screenshots/videos** (if applicable)
6. **System info** (OS, monitor setup)
7. **Performance metrics** (if relevant)

---

## Summary

This testing guide covers:
- ✅ Window Grouping (6 tests)
- ✅ Window Docking (6 tests)
- ✅ Window Snapping (5 tests)
- ✅ Visual Overlays (4 tests)
- ✅ State Persistence (3 tests)
- ✅ Error Handling (3 tests)
- ✅ Performance (2 tests)
- ✅ Multi-Monitor (3 tests)

**Total: 32 test scenarios**

Good luck with testing! 🚀

