/**
 * Error categories
 */
export type ErrorCategory = 
  | 'runtime'
  | 'application'
  | 'communication'
  | 'security'
  | 'resource';

/**
 * Platform error class
 */
export class PlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public category: ErrorCategory,
    public recoverable: boolean,
    public context?: any
  ) {
    super(message);
    this.name = 'PlatformError';
    Object.setPrototypeOf(this, PlatformError.prototype);
  }
}

/**
 * Error codes
 */
export enum ErrorCode {
  // Runtime errors
  RUNTIME_INIT_FAILED = 'RUNTIME_INIT_FAILED',
  RUNTIME_SHUTDOWN_FAILED = 'RUNTIME_SHUTDOWN_FAILED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Application errors
  APP_LAUNCH_FAILED = 'APP_LAUNCH_FAILED',
  APP_MANIFEST_INVALID = 'APP_MANIFEST_INVALID',
  APP_CRASHED = 'APP_CRASHED',
  APP_NOT_FOUND = 'APP_NOT_FOUND',
  
  // Communication errors
  IPC_FAILED = 'IPC_FAILED',
  MESSAGE_ROUTING_FAILED = 'MESSAGE_ROUTING_FAILED',
  TIMEOUT = 'TIMEOUT',
  
  // Security errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CSP_VIOLATION = 'CSP_VIOLATION',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // Resource errors
  MEMORY_EXHAUSTED = 'MEMORY_EXHAUSTED',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR'
}
