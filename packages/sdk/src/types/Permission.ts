/**
 * Permission types
 */
export type PermissionType = 
  | 'clipboard'
  | 'notifications'
  | 'filesystem'
  | 'network'
  | 'messaging'
  | 'launchExternalProcess'
  | 'systemTray'
  | 'globalShortcuts';

/**
 * Permission definition
 */
export interface Permission {
  /** Permission type */
  type: PermissionType;
  /** Permission scope (optional) */
  scope?: string;
  /** Whether permission is granted */
  granted?: boolean;
  /** Timestamp when granted */
  grantedAt?: Date;
}

/**
 * Permission request
 */
export interface PermissionRequest {
  /** Application UUID requesting permission */
  appUuid: string;
  /** Permission being requested */
  permission: Permission;
  /** Reason for request */
  reason?: string;
}

/**
 * Permission result
 */
export interface PermissionResult {
  /** Whether permission was granted */
  granted: boolean;
  /** Permission details */
  permission: Permission;
  /** Timestamp of decision */
  decidedAt: Date;
}
