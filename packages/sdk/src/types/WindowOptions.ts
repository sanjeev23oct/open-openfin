import { WindowState } from './Identity';

/**
 * Window creation and configuration options
 */
export interface WindowOptions {
  /** Window URL */
  url: string;
  /** Window name/identifier */
  name?: string;
  /** Window width in pixels */
  width?: number;
  /** Window height in pixels */
  height?: number;
  /** X position */
  x?: number;
  /** Y position */
  y?: number;
  /** Show window frame */
  frame?: boolean;
  /** Use custom chrome */
  customChrome?: boolean;
  /** Window is resizable */
  resizable?: boolean;
  /** Window is maximizable */
  maximizable?: boolean;
  /** Window is minimizable */
  minimizable?: boolean;
  /** Window is closable */
  closable?: boolean;
  /** Always on top */
  alwaysOnTop?: boolean;
  /** Auto show window */
  autoShow?: boolean;
  /** Initial window state */
  state?: WindowState;
  /** Minimum width */
  minWidth?: number;
  /** Minimum height */
  minHeight?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Maximum height */
  maxHeight?: number;
  /** Window icon */
  icon?: string;
  /** Window title */
  title?: string;
  /** Background color */
  backgroundColor?: string;
  /** Show in taskbar */
  showTaskbarIcon?: boolean;
  /** Skip taskbar */
  skipTaskbar?: boolean;
  /** Context isolation */
  contextIsolation?: boolean;
  /** Node integration */
  nodeIntegration?: boolean;
  /** Preload script path */
  preload?: string;
}


