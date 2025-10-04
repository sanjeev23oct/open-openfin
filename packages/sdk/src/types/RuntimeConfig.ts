/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /** Runtime version */
  version: string;
  /** Runtime port */
  port?: number;
  /** Enable auto-update */
  autoUpdate?: boolean;
  /** Enable crash reporting */
  crashReporting?: boolean;
  /** Log level */
  logLevel?: LogLevel;
  /** Security configuration */
  security?: SecurityConfig;
  /** Application configuration */
  applications?: ApplicationsConfig;
  /** UI configuration */
  ui?: UIConfig;
  /** Logging configuration */
  logging?: LoggingConfig;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Content Security Policy */
  csp?: CSPConfig;
  /** URL whitelist */
  urlWhitelist?: string[];
  /** Enable sandboxing */
  sandboxing?: boolean;
  /** Enable context isolation */
  contextIsolation?: boolean;
}

/**
 * Content Security Policy configuration
 */
export interface CSPConfig {
  defaultSrc?: string[];
  scriptSrc?: string[];
  connectSrc?: string[];
  imgSrc?: string[];
  styleSrc?: string[];
  fontSrc?: string[];
}

/**
 * Applications configuration
 */
export interface ApplicationsConfig {
  /** Manifest source URLs */
  manifestSources?: string[];
  /** Auto-launch application IDs */
  autoLaunch?: string[];
  /** Enable crash recovery */
  crashRecovery?: boolean;
}

/**
 * UI configuration
 */
export interface UIConfig {
  /** Theme */
  theme?: 'light' | 'dark' | 'system';
  /** Branding */
  branding?: BrandingConfig;
}

/**
 * Branding configuration
 */
export interface BrandingConfig {
  /** Logo URL */
  logo?: string;
  /** Primary color */
  primaryColor?: string;
  /** Company name */
  companyName?: string;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level */
  level?: LogLevel;
  /** Log destination */
  destination?: 'file' | 'console' | 'remote';
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Log file path */
  logPath?: string;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
