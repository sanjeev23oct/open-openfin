import { Bounds, Rectangle } from './Identity';

/**
 * Window group with tabbing support
 */
export interface WindowGroup {
  id: string;
  windows: string[];
  activeWindow: string;
  bounds: Bounds;
  tabBarBounds?: Bounds;
  state: 'normal' | 'minimized' | 'maximized';
  monitor: number;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Dock zone types
 */
export type DockZoneType = 'edge' | 'corner' | 'custom';

/**
 * Dock edge positions
 */
export type DockEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Dock corner positions
 */
export type DockCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * Dock zone definition
 */
export interface DockZone {
  id: string;
  type: DockZoneType;
  edge?: DockEdge;
  corner?: DockCorner;
  bounds: Bounds;
  targetBounds: Bounds;
  monitor: number;
  priority: number;
}

/**
 * Docked window state
 */
export interface DockedWindow {
  windowId: string;
  zone: DockZone;
  originalBounds: Bounds;
  dockedAt: Date;
}

/**
 * Dock zone configuration
 */
export interface DockZoneConfig {
  edgeThreshold: number;
  cornerSize: number;
  showOverlays: boolean;
  animationDuration: number;
  customZones?: CustomDockZone[];
}

/**
 * Custom dock zone definition
 */
export interface CustomDockZone {
  id: string;
  bounds: Bounds;
  targetBounds: Bounds;
  monitor: number;
}

/**
 * Snap target types
 */
export type SnapTargetType = 'edge' | 'window' | 'grid';

/**
 * Snap alignment options
 */
export type SnapAlignment = 'left' | 'right' | 'top' | 'bottom' | 'center';

/**
 * Snap target definition
 */
export interface SnapTarget {
  id: string;
  type: SnapTargetType;
  position: Point;
  alignment: SnapAlignment;
  distance: number;
  targetBounds: Bounds;
  priority: number;
}

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Snap configuration
 */
export interface SnapConfig {
  enabled: boolean;
  snapDistance: number;
  snapToEdges: boolean;
  snapToWindows: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showPreview: boolean;
  animationDuration: number;
  maintainSnapOnResize: boolean;
}

/**
 * Snap relationship between windows
 */
export interface SnapRelationship {
  windowId: string;
  snappedTo: string[];
  edges: {
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  };
  createdAt: Date;
}

/**
 * Overlay configuration
 */
export interface OverlayConfig {
  dockZoneColor: string;
  dockZoneActiveColor: string;
  snapPreviewColor: string;
  groupDropZoneColor: string;
  borderWidth: number;
  borderRadius: number;
  animationDuration: number;
}

/**
 * Window management events
 */
export type WindowManagementEvent =
  | 'window-grouped'
  | 'window-ungrouped'
  | 'window-docked'
  | 'window-undocked'
  | 'window-snapped'
  | 'group-moved'
  | 'group-resized'
  | 'tab-switched'
  | 'drag-started'
  | 'drag-ended';

/**
 * Window management event data
 */
export interface WindowManagementEventData {
  windowId?: string;
  groupId?: string;
  zone?: DockZone;
  target?: SnapTarget;
  timestamp: Date;
}

/**
 * Window management configuration
 */
export interface WindowManagementConfig {
  grouping: {
    enabled: boolean;
    maxTabsPerGroup: number;
    tabBarHeight: number;
    showIcons: boolean;
  };
  docking: DockZoneConfig;
  snapping: SnapConfig;
  overlay: OverlayConfig;
  keyboard: {
    enabled: boolean;
    shortcuts: KeyboardShortcuts;
  };
}

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcuts {
  snapLeft: string;
  snapRight: string;
  snapTop: string;
  snapBottom: string;
  dockLeft: string;
  dockRight: string;
  dockTop: string;
  dockBottom: string;
  cycleTab: string;
  moveWindow: string;
}

/**
 * Window management error codes
 */
export enum WindowManagementErrorCode {
  GROUP_NOT_FOUND = 'WM_GROUP_001',
  INVALID_WINDOW_ID = 'WM_GROUP_002',
  TAB_BAR_CREATION_FAILED = 'WM_GROUP_003',
  INVALID_DOCK_ZONE = 'WM_DOCK_001',
  MONITOR_NOT_FOUND = 'WM_DOCK_002',
  SNAP_DETECTION_FAILED = 'WM_SNAP_001',
  OVERLAY_CREATION_FAILED = 'WM_OVERLAY_001',
  STATE_SAVE_FAILED = 'WM_PERSIST_001',
  STATE_LOAD_FAILED = 'WM_PERSIST_002'
}

/**
 * Window management error
 */
export class WindowManagementError extends Error {
  constructor(
    message: string,
    public code: WindowManagementErrorCode,
    public category: 'grouping' | 'docking' | 'snapping' | 'overlay' | 'persistence',
    public recoverable: boolean,
    public context?: any
  ) {
    super(message);
    this.name = 'WindowManagementError';
  }
}
