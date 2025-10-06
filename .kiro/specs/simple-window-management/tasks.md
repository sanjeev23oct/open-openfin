# Implementation Plan - Simple Window Management

## Task List

- [x] 1. Implement basic window auto-positioning



  - Add lastWindowPosition tracker variable
  - Modify launchApplication to use getNextWindowPosition()
  - Test: Launch 3 apps, verify no overlap

  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 2. Add snap left/right to context menu
  - Create snapWindowLeft() function
  - Create snapWindowRight() function  
  - Add menu items to showWindowContextMenu()

  - Test: Right-click, snap left, snap right
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 3. Implement window linking
  - Create windowLinks Map
  - Create windowLastBounds Map
  - Create linkWindows() function
  - Create moveLinkedWindow() function
  - Add "Link with..." to context menu

  - Add "Unlink" to context menu
  - Test: Link 2 windows, drag one, verify other moves
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 4. Implement workspace save/load
  - Create saveWorkspace() function
  - Create loadWorkspace() function
  - Create deleteWorkspace() function


  - Add IPC handlers for workspace operations
  - Add workspace UI to launcher (already exists, just wire up)
  - Test: Save, close apps, load, verify positions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 5. Fix running app indicators
  - Verify app-launched event is sent
  - Verify app-closed event is sent
  - Verify launcher updates on events
  - Test: Launch app, see green dot, close, see launch button
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 6. Final integration testing
  - Test all features together
  - Verify no conflicts between features
  - Test edge cases (close linked window, load workspace with links, etc.)
  - Document any known issues
  - _Requirements: All_

## Implementation Order

Tasks will be implemented in order 1-6. Each task will be:
1. Implemented
2. Tested immediately
3. Marked complete only if working
4. Debugged if not working before moving to next task

## Testing After Each Task

### Task 1 Test:
```
1. npm start
2. Launch Market Watch
3. Launch Ticker Details  
4. Launch Sample App 1
5. Verify: No windows overlap, each offset by ~50px
```

### Task 2 Test:
```
1. Launch any app
2. Right-click window
3. Click "Snap Left"
4. Verify: Window fills left half
5. Right-click again
6. Click "Snap Right"
7. Verify: Window fills right half
```

### Task 3 Test:
```
1. Launch 2 apps
2. Snap one left, one right
3. Right-click left window
4. Click "Link with..." → select right window
5. Drag left window
6. Verify: Right window moves same amount
7. Right-click, click "Unlink"
8. Drag left window
9. Verify: Right window stays still
```

### Task 4 Test:
```
1. Launch 2-3 apps, position them
2. Go to Workspaces tab
3. Click "Save Workspace", name it "Test"
4. Close all apps
5. Click "Load Workspace" on "Test"
6. Verify: Apps launch in saved positions
```

### Task 5 Test:
```
1. In launcher, verify all apps show "Launch"
2. Launch Market Watch
3. Verify: Shows "Focus" with green dot
4. Click "Focus"
5. Verify: Window comes to front
6. Close Market Watch
7. Verify: Shows "Launch" again
```

### Task 6 Test:
```
1. Launch 3 apps (auto-positioned)
2. Snap 2 of them side-by-side
3. Link those 2
4. Drag them around (should move together)
5. Save as workspace
6. Close all
7. Load workspace
8. Verify: Apps in correct positions
9. Verify: Link still works
```

## Success Criteria

- All 6 tasks complete and tested
- All tests pass
- No console errors
- User can perform all workflows smoothly
- Code is simple and debuggable

## Notes

- If any task fails testing, STOP and debug before continuing
- Add console.log statements liberally for debugging
- Test in actual Electron app, not just in theory
- Keep functions small and simple
- No task should take more than 30 minutes to implement and test
