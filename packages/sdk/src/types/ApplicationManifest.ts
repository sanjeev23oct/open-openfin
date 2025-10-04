import { Permission } from './Permission';
import { WindowOptions } from './WindowOptions';

/**
 * Application manifest schema following OpenFin structure
 */
export interface ApplicationManifest {
  startup_app: StartupApp;
  runtime?: RuntimeRequirements;
  shortcut?: ShortcutConfig;
  platform?: PlatformConfig;
  permissions?: PermissionsConfig;
  fdc3?: FDC3Config;
}

/**
 * Startup application configuration
 */
export interface StartupApp {
  uuid: string;
  name: string;
  url: string;
  autoShow?: boolean;
  frame?: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultLeft?: number;
  defaultTop?: number;
  resizable?: boolean;
  maximizable?: boolean;
  minimizable?: boolean;
  icon?: string;
  description?: string;
  version?: string;
}

/**
 * Runtime version requirements
 */
export interface RuntimeRequirements {
  version: string;
  arguments?: string;
}

/**
 * Desktop shortcut configuration
 */
export interface ShortcutConfig {
  company?: string;
  description?: string;
  icon?: string;
  name?: string;
  target?: ('desktop' | 'start-menu')[];
}

/**
 * Platform-specific configuration
 */
export interface PlatformConfig {
  uuid?: string;
  autoShow?: boolean;
  defaultWindowOptions?: Partial<WindowOptions>;
}

/**
 * Permissions configuration
 */
export interface PermissionsConfig {
  System?: {
    clipboard?: boolean;
    notifications?: boolean;
    launchExternalProcess?: boolean;
  };
  Network?: {
    domains?: string[];
  };
}

/**
 * FDC3 configuration
 */
export interface FDC3Config {
  intents?: IntentMetadata[];
}

/**
 * Intent metadata for application directory
 */
export interface IntentMetadata {
  name: string;
  displayName?: string;
  contexts: string[];
  customConfig?: Record<string, any>;
}
