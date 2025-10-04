import { WindowOptions } from './WindowOptions';

/**
 * Platform provider configuration
 */
export interface ProviderConfig {
  /** Provider UUID */
  uuid: string;
  /** Provider name */
  name: string;
  /** Provider URL */
  url?: string;
  /** Auto show provider window */
  autoShow?: boolean;
  /** Default window options */
  defaultWindowOptions?: Partial<WindowOptions>;
  /** Custom configuration */
  customConfig?: Record<string, any>;
}

/**
 * Workspace configuration
 */
export interface WorkspaceConfig {
  /** Workspace ID */
  id: string;
  /** Workspace name */
  name: string;
  /** Workspace description */
  description?: string;
  /** Applications in workspace */
  applications: ApplicationConfig[];
  /** Layout configuration */
  layout?: LayoutConfig;
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Application configuration within workspace
 */
export interface ApplicationConfig {
  /** Application UUID */
  uuid: string;
  /** Application manifest URL */
  manifestUrl: string;
  /** Launch configuration */
  launchConfig?: LaunchConfig;
}

/**
 * Application launch configuration
 */
export interface LaunchConfig {
  /** Auto-launch on workspace start */
  autoLaunch?: boolean;
  /** Launch delay in milliseconds */
  launchDelay?: number;
  /** Initial window options override */
  windowOptions?: Partial<WindowOptions>;
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  /** Layout ID */
  id: string;
  /** Layout name */
  name: string;
  /** Window layouts */
  windows: WindowLayout[];
}

/**
 * Window layout
 */
export interface WindowLayout {
  /** Window UUID */
  uuid: string;
  /** Window name */
  name: string;
  /** Window bounds */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Window state */
  state: 'normal' | 'minimized' | 'maximized';
  /** Monitor index */
  monitor?: number;
  /** Group ID if part of a group */
  groupId?: string;
}

/**
 * Workspace snapshot
 */
export interface WorkspaceSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Workspace configuration */
  workspace: WorkspaceConfig;
  /** Running applications */
  applications: ApplicationSnapshotInfo[];
  /** Window states */
  windows: WindowLayout[];
}

/**
 * Application snapshot information
 */
export interface ApplicationSnapshotInfo {
  uuid: string;
  name: string;
  manifestUrl: string;
  state: string;
}
