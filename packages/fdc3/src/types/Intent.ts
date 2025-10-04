import { Context } from './Context';

/**
 * FDC3 Intent resolution result
 */
export interface IntentResolution {
  /** Source application that handled the intent */
  source: string;
  /** Optional version of the handling application */
  version?: string;
  /** Optional data returned by the intent handler */
  data?: any;
}

/**
 * Intent handler function
 */
export type IntentHandler = (context: Context) => IntentResolution | Promise<IntentResolution>;

/**
 * App intent metadata
 */
export interface AppIntent {
  /** Intent name */
  intent: string;
  /** Display name */
  displayName?: string;
  /** Applications that handle this intent */
  apps: AppMetadata[];
}

/**
 * Application metadata
 */
export interface AppMetadata {
  /** Application name */
  name: string;
  /** Application ID */
  appId: string;
  /** Application version */
  version?: string;
  /** Application title */
  title?: string;
  /** Application tooltip */
  tooltip?: string;
  /** Application description */
  description?: string;
  /** Application icons */
  icons?: AppIcon[];
  /** Application images */
  images?: AppImage[];
}

/**
 * Application icon
 */
export interface AppIcon {
  /** Icon URL */
  src: string;
  /** Icon size */
  size?: string;
  /** Icon type */
  type?: string;
}

/**
 * Application image
 */
export interface AppImage {
  /** Image URL */
  src: string;
  /** Image label */
  label?: string;
  /** Image type */
  type?: string;
}

/**
 * Target app identifier for intent
 */
export interface TargetApp {
  /** Application ID */
  appId: string;
  /** Optional instance ID */
  instanceId?: string;
}
