# Quick Test Checklist

## 🚀 Quick Start Testing

### 1. Build & Run (5 min)
```bash
npm install
npm run build
npm start
```

### 2. Basic Smoke Test (10 min)

#### Window Grouping ✅
- [ ] Open 3 windows
- [ ] Create group → Tab bar appears
- [ ] Click tabs → Windows switch
- [ ] Drag tab → Reorders
- [ ] Drag tab out → Ungroups
- [ ] Move group → All windows move

#### Window Docking ✅
- [ ] Drag window → Dock zones appear
- [ ] Drag to left edge → Docks to left half
- [ ] Drag to right edge → Docks to right half
- [ ] Drag to top → Maximizes
- [ ] Drag to corner → Quarter screen
- [ ] Drag away → Undocks

#### Window Snapping ✅
- [ ] Drag near edge → Snap preview shows
- [ ] Release → Snaps to edge
- [ ] Drag near window → Snaps to window
- [ ] Resize snapped windows → Maintains relationship

#### Visual Feedback ✅
- [ ] Overlays fade in smoothly
- [ ] Active zone highlights
- [ ] Snap preview updates
- [ ] Overlays fade out on release

### 3. State Persistence (2 min)
- [ ] Create group
- [ ] Dock window
- [ ] Close platform
- [ ] Restart → State restored

---

## 🐛 Common Issues & Fixes

### Issue: Build Errors
```bash
# Clean and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Overlays Don't Appear
- Check console for errors
- Verify OverlayManager initialized
- Check `showOverlays` config is true

### Issue: Snapping Not Working
- Verify snapping is enabled
- Check snap distance (default: 10px)
- Ensure windows in spatial index

### Issue: Tab Bar Missing
- Verify group has 2+ windows
- Check tab-bar.html exists
- Look for TabBarWindow errors

---

## 📊 Quick Performance Check

```javascript
// In browser console
console.time('test');
await windowManager.createWindowGroup(['w1', 'w2', 'w3']);
console.timeEnd('test');
// Should be < 100ms
```

---

## 🎯 Priority Test Scenarios

### P0 - Critical (Must Work)
1. ✅ Create window group
2. ✅ Switch tabs
3. ✅ Dock to edges
4. ✅ Snap to edges
5. ✅ Overlays appear

### P1 - Important (Should Work)
6. ✅ Drag tab out
7. ✅ Undock window
8. ✅ Snap to windows
9. ✅ State persistence
10. ✅ Multi-monitor

### P2 - Nice to Have
11. ✅ Grid snapping
12. ✅ Snap relationships
13. ✅ Performance with 20+ windows

---

## 📝 Quick API Test

```javascript
// Test in browser console

// 1. Create group
const group = await wm.createWindowGroup(['w1', 'w2']);

// 2. Get zones
const zones = wm.getDockZones();

// 3. Dock window
await wm.dockWindowToZone('w1', zones[0]);

// 4. Undock
await wm.undockWindow('w1');

// 5. Enable/disable snapping
wm.enableSnapping(false);
wm.enableSnapping(true);

// 6. List groups
const groups = wm.listGroups();
```

---

## ✅ Test Results Template

```
Date: ___________
Tester: ___________

Window Grouping:     [ ] Pass  [ ] Fail
Window Docking:      [ ] Pass  [ ] Fail
Window Snapping:     [ ] Pass  [ ] Fail
Visual Overlays:     [ ] Pass  [ ] Fail
State Persistence:   [ ] Pass  [ ] Fail
Performance:         [ ] Pass  [ ] Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
```

---

## 🎬 Video Test Scenarios

Record these for demo:

1. **Window Grouping Demo** (30 sec)
   - Create group
   - Switch tabs
   - Drag tab out

2. **Window Docking Demo** (30 sec)
   - Drag to edges
   - Dock to corners
   - Undock

3. **Window Snapping Demo** (30 sec)
   - Snap to edges
   - Snap to windows
   - Show preview

4. **Complete Workflow** (60 sec)
   - Open 3 windows
   - Group them
   - Dock one
   - Snap another
   - Show overlays

---

## 🔍 Debug Commands

```javascript
// Check manager status
console.log('Group Manager:', wm.groupManager);
console.log('Docking Manager:', wm.dockingManager);
console.log('Snapping Manager:', wm.snappingManager);
console.log('Overlay Manager:', wm.overlayManager);

// Check windows
console.log('Windows:', wm.listWindows());

// Check groups
console.log('Groups:', wm.listGroups());

// Check dock zones
console.log('Dock Zones:', wm.getDockZones());

// Check snapping status
console.log('Snapping Enabled:', wm.isSnappingEnabled());
```

---

## 📞 Need Help?

1. Check console for errors
2. Review TESTING-GUIDE.md for detailed steps
3. Check OPENFIN-ALIGNMENT-REVIEW.md for API reference
4. Review implementation files for logic

---

## 🎉 Success Criteria

All features working = **READY FOR PRODUCTION** ✅

- [x] Core features implemented
- [ ] All tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Documentation complete

---

**Estimated Testing Time: 30-45 minutes**

Good luck! 🚀
