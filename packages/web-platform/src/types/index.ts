/**
 * Web Platform Type Definitions
 */

export interface PlatformConfig {
  appDirectory: string;
  defaultWorkspace?: string;
  theme?: 'light' | 'dark';
  enableMultiTab?: boolean;
  storageQuota?: number;
  performanceMode?: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WindowConfig {
  appId: string;
  url: string;
  title: string;
  position?: Position;
  size?: Size;
  minSize?: Size;
  maxSize?: Size;
  resizable?: boolean;
  movable?: boolean;
  frame?: boolean;
  sandbox?: string[];
}

export interface WindowInstance {
  id: string;
  appId: string;
  iframe: HTMLIFrameElement;
  position: Position;
  size: Size;
  state: 'normal' | 'minimized' | 'maximized';
  zIndex: number;
  focus(): void;
  close(): void;
}

export interface BridgeMessage {
  type: 'broadcast' | 'intent' | 'channel' | 'listener' | 'response';
  payload: any;
  sourceAppId?: string;
  targetAppId?: string;
  messageId: string;
  timestamp: number;
}

export interface Workspace {
  id: string;
  name: string;
  config: WorkspaceConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceConfig {
  applications: ApplicationState[];
  layout: LayoutConfig;
}

export interface ApplicationState {
  appId: string;
  instanceId: string;
  url: string;
  windowState: {
    position: Position;
    size: Size;
    state: 'normal' | 'minimized' | 'maximized';
    zIndex: number;
  };
  channelId?: string;
}

export interface LayoutConfig {
  type: 'free' | 'grid' | 'tabs';
}
