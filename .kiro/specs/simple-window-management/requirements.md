# Requirements Document - Simple Window Management

## Introduction

This spec focuses on implementing SIMPLE, WORKING window management features for the desktop platform. The goal is to have basic functionality that actually works, not complex features that don't. Each feature will be tested immediately after implementation.

## Requirements

### Requirement 1: Basic Window Positioning

**User Story:** As a user, I want windows to not overlap when I launch multiple apps, so that I can see all my applications.

#### Acceptance Criteria

1. WHEN the user launches the first app THEN it SHALL open centered on screen
2. WHEN the user launches a second app THEN it SHALL open offset by 50 pixels from the first app
3. WHEN the user launches additional apps THEN each SHALL be offset by 50 pixels from the previous
4. WHEN windows would go off-screen THEN they SHALL wrap back to the top-left with offset
5. WHEN the user manually positions a window THEN subsequent auto-positioning SHALL continue from that point

### Requirement 2: Simple Snap Buttons

**User Story:** As a user, I want buttons to quickly snap windows to left or right half of screen, so that I can easily arrange windows side-by-side.

#### Acceptance Criteria

1. WHEN the user right-clicks a window THEN they SHALL see "Snap Left" and "Snap Right" options
2. WHEN the user clicks "Snap Left" THEN the window SHALL immediately resize to fill the left half of the screen
3. WHEN the user clicks "Snap Right" THEN the window SHALL immediately resize to fill the right half of the screen
4. WHEN a window is snapped THEN it SHALL maintain that position until moved by the user
5. WHEN the user manually resizes a snapped window THEN it SHALL no longer be considered snapped

### Requirement 3: Side-by-Side Window Linking

**User Story:** As a user, I want to link two side-by-side windows so they move together, so that I can maintain my layout when repositioning.

#### Acceptance Criteria

1. WHEN the user right-clicks a window THEN they SHALL see a "Link with..." option
2. WHEN the user selects "Link with..." THEN they SHALL see a list of other open windows
3. WHEN the user selects another window to link THEN both windows SHALL remain visible in their current positions
4. WHEN the user drags a linked window THEN the other linked window SHALL move by the same amount
5. WHEN the user right-clicks a linked window THEN they SHALL see an "Unlink" option
6. WHEN the user clicks "Unlink" THEN the windows SHALL no longer move together

### Requirement 4: Basic Workspace Save/Load

**User Story:** As a user, I want to save my current window layout and restore it later, so that I can quickly return to my preferred setup.

#### Acceptance Criteria

1. WHEN the user clicks "Save Workspace" in the launcher THEN they SHALL be prompted for a name
2. WHEN the user enters a name and confirms THEN the current positions of all windows SHALL be saved
3. WHEN the user views saved workspaces THEN they SHALL see a list with workspace names
4. WHEN the user clicks "Load Workspace" THEN all current windows SHALL close
5. WHEN a workspace loads THEN all apps SHALL launch in their saved positions
6. WHEN the user clicks "Delete Workspace" THEN that workspace SHALL be removed from the list

### Requirement 5: Running App Indicators

**User Story:** As a user, I want to see which apps are currently running in the launcher, so that I can easily manage my applications.

#### Acceptance Criteria

1. WHEN an app is not running THEN the launcher SHALL show a "Launch" button
2. WHEN an app is running THEN the launcher SHALL show a "Focus" button with a green indicator
3. WHEN the user clicks "Focus" THEN that app's window SHALL come to the front
4. WHEN the user closes an app THEN the launcher SHALL update to show "Launch" button
5. WHEN the user switches to the "Running" tab THEN only running apps SHALL be displayed

## Success Criteria

- All features work on first try after implementation
- No complex overlays or animations required
- Each feature can be tested in under 30 seconds
- Code is simple enough to debug easily
- User can accomplish common tasks (side-by-side windows, save layout) quickly

## Out of Scope

- Fancy visual effects
- Drag-and-drop grouping
- Keyboard shortcuts
- Multi-monitor support (Phase 2)
- Window snapping to quarters (Phase 2)
- Tab-based window grouping
