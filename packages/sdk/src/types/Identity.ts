/**
 * Identifies an application or window in the platform
 */
export interface Identity {
  /** Unique identifier for the application */
  uuid: string;
  /** Name of the application */
  name: string;
  /** Optional window name for window-specific identity */
  windowName?: string;
}

/**
 * Information about a running application
 */
export interface ApplicationInfo {
  identity: Identity;
  manifest: any; // ApplicationManifest type - will be properly imported when needed
  parentUuid?: string;
  initialOptions?: any;
}

/**
 * Represents a running application process
 */
export interface ApplicationProcess {
  id: string;
  uuid: string;
  pid: number;
  state: ApplicationState;
  createdAt: Date;
}

/**
 * Application lifecycle states
 */
export type ApplicationState = 
  | 'initializing'
  | 'starting'
  | 'running'
  | 'suspended'
  | 'closing'
  | 'closed'
  | 'crashed'
  | 'failed';

/**
 * Window state types
 */
export type WindowState = 
  | 'normal'
  | 'minimized'
  | 'maximized'
  | 'fullscreen'
  | 'hidden';

/**
 * Rectangle bounds
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bounds with additional properties
 */
export interface Bounds extends Rectangle {
  top: number;
  left: number;
  right: number;
  bottom: number;
}
