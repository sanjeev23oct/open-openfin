# Testing Guide - Launcher Features

## 🧪 Step-by-Step Testing Instructions

### Setup
1. Run `npm start` to launch the platform
2. The modern launcher should open

---

## Test 1: Auto-Arrangement ✅

**What to test:** Windows automatically position themselves without overlapping

**Steps:**
1. Click "Launch" on **Market Watch** app
   - Should open centered on screen
2. Click "Launch" on **Ticker Details** app
   - Should open offset by 30px from Market Watch (cascade pattern)
3. Click "Launch" on **Sample App 1**
   - Should cascade further (60px offset)
4. Launch more apps
   - Should continue cascading or tile if space runs out

**Expected Result:**
- First window: Centered
- Subsequent windows: Cascaded with 30px offset each
- No windows completely overlapping

**If it fails:**
- Check console for errors
- Verify manifests don't have `defaultLeft`/`defaultTop` (I removed them)

---

## Test 2: Window Snapping with Visual Feedback ✅

**What to test:** Windows snap to edges with blue preview overlay

**Steps:**
1. Launch any app
2. Drag the window towards the LEFT edge of screen
   - **You should see a BLUE semi-transparent overlay** showing left half
3. Release the mouse
   - Window should snap to fill left half of screen
4. Try dragging to:
   - RIGHT edge → snaps to right half
   - TOP edge → snaps to top half
   - BOTTOM edge → snaps to bottom half
   - TOP-LEFT corner → snaps to top-left quarter
   - TOP-RIGHT corner → snaps to top-right quarter
   - BOTTOM-LEFT corner → snaps to bottom-left quarter
   - BOTTOM-RIGHT corner → snaps to bottom-right quarter

**Expected Result:**
- Blue overlay appears when near edges (within 20 pixels)
- Overlay shows where window will snap
- Window snaps to position on release

**If it fails:**
- Check console for "createSnapOverlay" errors
- Overlay window might not be created

---

## Test 3: Context Menu Snapping ✅

**What to test:** Right-click menu can snap windows

**Steps:**
1. Launch any app
2. **Right-click** on the window (anywhere in the app)
3. Select **"Dock to..." → "Left Half"**
   - Window should snap to left half
4. Right-click again
5. Try other dock options:
   - Right Half
   - Top Half
   - Bottom Half
   - Top Left Quarter
   - Top Right Quarter
   - Bottom Left Quarter
   - Bottom Right Quarter

**Expected Result:**
- Context menu appears on right-click
- All dock options work immediately
- Window snaps to selected position

---

## Test 4: Window Grouping ✅

**What to test:** Group two windows so they move together

**Steps:**
1. Launch **Market Watch** and **Ticker Details**
2. Position them side by side manually:
   - Drag Market Watch to left half (use snap or manual)
   - Drag Ticker Details to right half
3. **Right-click** on Market Watch
4. Select **"Group with..." → "Ticker Details"**
   - A **tab bar** should appear above Market Watch
   - Ticker Details should hide
5. **Drag Market Watch** around the screen
   - **BOTH windows should move together** (Ticker Details is hidden but moves)
   - Tab bar should move with them
6. Click the **"Ticker Details" tab** in the tab bar
   - Ticker Details should show, Market Watch should hide
7. **Drag Ticker Details** around
   - Both should move together again

**Expected Result:**
- Tab bar appears when grouped
- Windows move together maintaining relative positions
- Tab bar moves with windows
- Can switch between tabs

**If it fails:**
- Check console for "enableGroupMovement" errors
- Movement listeners might not be attached

---

## Test 5: Workspace Management ✅

**What to test:** Save and load workspace layouts

**Steps:**
1. Launch 2-3 apps and position them how you like
2. Maybe group some windows
3. Click the **"Workspaces" tab** in launcher
4. Click **"Save Current Workspace"** button
5. Enter name: "My Test Workspace"
6. Click OK
   - Should see workspace card appear
7. **Close all apps** (close each window)
8. In Workspaces tab, click **"Load Workspace"** on your saved workspace
9. Confirm the dialog
   - Apps should launch in saved positions
   - Groups should be restored

**Expected Result:**
- Workspace saves successfully
- Apps restore to exact positions
- Groups are restored
- Can delete workspaces

**If it fails:**
- Check `~/.desktop-interop-platform/workspaces.json` exists
- Check console for save/load errors

---

## Test 6: Persistent State (Optional) ✅

**What to test:** Window positions saved across sessions

**Steps:**
1. Launch apps and position them
2. **Quit the platform** (from system tray or close launcher)
3. Check file exists: `~/.desktop-interop-platform/window-state.json`
4. (Optional) Edit `platform-launcher.js` line ~1530:
   - Uncomment: `await platform.restoreWindowState();`
5. Restart platform
   - Apps should auto-launch in saved positions

**Expected Result:**
- State file created on quit
- If restore enabled, apps launch automatically

---

## Test 7: Enhanced Launcher UI ✅

**What to test:** Launcher shows app states correctly

**Steps:**
1. In launcher, note all apps show **"Launch"** button
2. Launch **Market Watch**
3. Go back to launcher
   - Market Watch should now show **"Focus"** button with green dot
4. Click **"Focus"**
   - Window should come to front
5. Click **"Running" tab** in launcher
   - Should show only Market Watch
6. Close Market Watch
7. Check launcher
   - Should show "Launch" button again

**Expected Result:**
- Running apps show "Focus" with green indicator
- Stopped apps show "Launch"
- Running tab filters correctly
- Counter updates

---

## 🐛 Common Issues and Fixes

### Issue: Windows still overlap
**Fix:** Manifests had hardcoded positions - I removed them. Restart platform.

### Issue: No blue snap overlay
**Fix:** Check console for errors. Overlay window might fail to create.

### Issue: Windows don't move together when grouped
**Fix:** Check console for "enableGroupMovement" errors. Event listeners might not attach.

### Issue: Workspace doesn't save
**Fix:** Check permissions on `~/.desktop-interop-platform/` folder.

### Issue: Right-click menu doesn't appear
**Fix:** Context menu listener might not be attached. Check console.

---

## 📊 Feature Checklist

After testing, mark what works:

- [ ] Auto-arrangement (windows cascade)
- [ ] Snap overlay appears (blue preview)
- [ ] Snap on drag release works
- [ ] Context menu "Dock to..." works
- [ ] Window grouping creates tab bar
- [ ] Grouped windows move together
- [ ] Tab switching works
- [ ] Workspace save works
- [ ] Workspace load works
- [ ] Launcher shows running state
- [ ] Focus button works

---

## 🎯 Expected Behavior Summary

1. **Launch apps** → They cascade automatically
2. **Drag near edge** → Blue overlay shows, snaps on release
3. **Right-click → Dock** → Snaps immediately
4. **Right-click → Group** → Tab bar appears, windows move together
5. **Save workspace** → Positions saved to disk
6. **Load workspace** → Apps restore to saved positions
7. **Launcher** → Shows running/stopped state correctly

---

## 💡 Tips

- **To get 2 windows side by side:**
  1. Launch 2 apps
  2. Drag first to left edge (see blue overlay, release to snap)
  3. Drag second to right edge (see blue overlay, release to snap)
  4. Right-click one → Group with → select other
  5. Now drag either one → both move together!

- **Snap threshold:** 20 pixels from edge triggers snap

- **Group movement:** Works even when window is hidden (in tab)

- **Workspaces:** Great for different work contexts (trading, development, etc.)
