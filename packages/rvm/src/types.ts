/**
 * Runtime process information
 */
export interface RuntimeProcess {
  version: string;
  pid: number;
  port: number;
  shutdown(): Promise<void>;
}

/**
 * Launch arguments for runtime
 */
export interface LaunchArgs {
  port?: number;
  config?: string;
  logLevel?: string;
  [key: string]: any;
}
