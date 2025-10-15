import { Permission, PermissionType, Identity } from '@desktop-interop/sdk';
import { IService } from './ServiceRegistry';
import { PermissionDialogManager } from './PermissionDialogManager';
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2 } from 'crypto';
import { promisify } from 'util';

const pbkdf2Async = promisify(pbkdf2);

/**
 * Permission cache entry
 */
interface PermissionCacheEntry {
  permission: Permission;
  grantedAt: Date;
  expiresAt?: Date;
  remember: boolean;
}

/**
 * Security event for audit logging
 */
export interface SecurityEvent {
  id: string;
  timestamp: number;
  type: 'permission_request' | 'permission_granted' | 'permission_denied' | 
        'security_violation' | 'encryption' | 'decryption';
  appUuid: string;
  userId?: string;
  details: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * Security manager for permission validation and enforcement
 * Now with user consent dialogs and real encryption
 */
export class SecurityManager implements IService {
  private permissions: Map<string, Map<PermissionType, PermissionCacheEntry>> = new Map();
  private dialogManager: PermissionDialogManager;
  private securityEvents: SecurityEvent[] = [];
  private appNames: Map<string, string> = new Map();
  
  // Encryption configuration
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 64;
  private readonly tagLength = 16;
  private readonly iterations = 100000;
  
  constructor() {
    this.dialogManager = new PermissionDialogManager();
  }
  
  async initialize(): Promise<void> {
    console.log('[SecurityManager] Initialized with user consent and AES-256-GCM encryption');
  }
  
  async shutdown(): Promise<void> {
    this.permissions.clear();
    this.dialogManager.closeDialog();
  }
  
  /**
   * Register application name for better UX
   */
  registerApplication(appUuid: string, appName: string): void {
    this.appNames.set(appUuid, appName);
  }
  
  /**
   * Validate if an application has a specific permission
   */
  async validatePermission(appUuid: string, permission: Permission): Promise<boolean> {
    const appPermissions = this.permissions.get(appUuid);
    
    if (!appPermissions) {
      return false;
    }
    
    const cached = appPermissions.get(permission.type);
    
    if (!cached) {
      return false;
    }
    
    // Check if permission matches scope
    if (permission.scope && cached.permission.scope !== permission.scope) {
      return false;
    }
    
    return cached.permission.granted === true;
  }
  
  /**
   * Request permission from user (now with consent dialog)
   */
  async requestPermission(appUuid: string, permission: Permission): Promise<boolean> {
    // Check if already granted and remembered
    const existing = await this.validatePermission(appUuid, permission);
    if (existing) {
      const cached = this.permissions.get(appUuid)?.get(permission.type);
      if (cached?.remember) {
        this.logSecurityEvent({
          type: 'permission_request',
          appUuid,
          details: { permission, result: 'cached_grant' },
          severity: 'info'
        });
        return true;
      }
    }
    
    // Log permission request
    this.logSecurityEvent({
      type: 'permission_request',
      appUuid,
      details: { permission },
      severity: 'info'
    });
    
    try {
      // Show permission dialog
      const appName = this.appNames.get(appUuid);
      const response = await this.dialogManager.showPermissionDialog(
        appUuid,
        permission,
        appName
      );
      
      if (response.granted) {
        // Grant permission
        this.grantPermission(appUuid, permission, response.remember);
        
        this.logSecurityEvent({
          type: 'permission_granted',
          appUuid,
          details: { permission, remember: response.remember },
          severity: 'info'
        });
        
        return true;
      } else {
        // Permission denied
        this.logSecurityEvent({
          type: 'permission_denied',
          appUuid,
          details: { permission },
          severity: 'warning'
        });
        
        return false;
      }
    } catch (error) {
      console.error('[SecurityManager] Permission request failed:', error);
      
      this.logSecurityEvent({
        type: 'permission_denied',
        appUuid,
        details: { permission, error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'error'
      });
      
      return false;
    }
  }
  
  /**
   * Grant a permission to an application
   */
  grantPermission(appUuid: string, permission: Permission, remember: boolean = false): void {
    if (!this.permissions.has(appUuid)) {
      this.permissions.set(appUuid, new Map());
    }
    
    const appPermissions = this.permissions.get(appUuid)!;
    
    const entry: PermissionCacheEntry = {
      permission: { ...permission, granted: true },
      grantedAt: new Date(),
      remember
    };
    
    // Set expiration if not remembered (1 hour)
    if (!remember) {
      entry.expiresAt = new Date(Date.now() + 3600000);
    }
    
    appPermissions.set(permission.type, entry);
  }
  
  /**
   * Revoke a permission from an application
   */
  revokePermission(appUuid: string, permissionType: PermissionType): void {
    const appPermissions = this.permissions.get(appUuid);
    
    if (appPermissions) {
      appPermissions.delete(permissionType);
    }
  }
  
  /**
   * Validate message route between applications
   */
  async validateMessageRoute(fromAppUuid: string, toAppUuid: string): Promise<boolean> {
    // Check if sender has messaging permission
    const hasPermission = await this.validatePermission(fromAppUuid, {
      type: 'messaging',
      granted: true
    });
    
    if (!hasPermission) {
      // Auto-grant messaging permission for now
      this.grantPermission(fromAppUuid, {
        type: 'messaging',
        granted: true
      });
      return true;
    }
    
    return true;
  }
  
  /**
   * Enforce Content Security Policy
   */
  async enforceCSP(appUuid: string, url: string): Promise<boolean> {
    // Simplified CSP check
    // In production, this would check against configured CSP rules
    
    try {
      const urlObj = new URL(url);
      
      // Block file:// URLs by default
      if (urlObj.protocol === 'file:') {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Encrypt data using AES-256-GCM
   */
  async encryptData(data: any, password: string): Promise<string> {
    try {
      // Generate salt and IV
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);
      
      // Derive key from password using PBKDF2
      const key = await pbkdf2Async(
        password,
        salt,
        this.iterations,
        this.keyLength,
        'sha256'
      );
      
      // Create cipher
      const cipher = createCipheriv(this.algorithm, key, iv);
      
      // Encrypt data
      const jsonData = JSON.stringify(data);
      let encrypted = cipher.update(jsonData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine salt + iv + tag + encrypted data
      const result = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
      ]).toString('base64');
      
      this.logSecurityEvent({
        type: 'encryption',
        appUuid: 'system',
        details: { dataSize: jsonData.length },
        severity: 'info'
      });
      
      return result;
    } catch (error) {
      console.error('[SecurityManager] Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }
  
  /**
   * Decrypt data using AES-256-GCM
   */
  async decryptData(encrypted: string, password: string): Promise<any> {
    try {
      // Decode base64
      const buffer = Buffer.from(encrypted, 'base64');
      
      // Extract components
      const salt = buffer.slice(0, this.saltLength);
      const iv = buffer.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = buffer.slice(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encryptedData = buffer.slice(this.saltLength + this.ivLength + this.tagLength);
      
      // Derive key from password
      const key = await pbkdf2Async(
        password,
        salt,
        this.iterations,
        this.keyLength,
        'sha256'
      );
      
      // Create decipher
      const decipher = createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt data
      let decrypted = decipher.update(encryptedData.toString('hex'), 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      this.logSecurityEvent({
        type: 'decryption',
        appUuid: 'system',
        details: { dataSize: decrypted.length },
        severity: 'info'
      });
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('[SecurityManager] Decryption failed:', error);
      
      this.logSecurityEvent({
        type: 'security_violation',
        appUuid: 'system',
        details: { error: 'Decryption failed - possible tampering' },
        severity: 'critical'
      });
      
      throw new Error('Decryption failed');
    }
  }
  
  /**
   * Log security event
   */
  private logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      ...event
    };
    
    this.securityEvents.push(fullEvent);
    
    // Keep only last 10,000 events
    if (this.securityEvents.length > 10000) {
      this.securityEvents.shift();
    }
    
    // Log to console based on severity
    const prefix = `[SecurityManager][${event.severity.toUpperCase()}]`;
    const message = `${event.type}: ${JSON.stringify(event.details)}`;
    
    switch (event.severity) {
      case 'critical':
      case 'error':
        console.error(prefix, message);
        break;
      case 'warning':
        console.warn(prefix, message);
        break;
      default:
        console.log(prefix, message);
    }
  }
  
  /**
   * Get security audit log
   */
  getAuditLog(filter?: {
    appUuid?: string;
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    fromTimestamp?: number;
    toTimestamp?: number;
  }): SecurityEvent[] {
    let events = [...this.securityEvents];
    
    if (filter) {
      if (filter.appUuid) {
        events = events.filter(e => e.appUuid === filter.appUuid);
      }
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.severity) {
        events = events.filter(e => e.severity === filter.severity);
      }
      if (filter.fromTimestamp) {
        events = events.filter(e => e.timestamp >= filter.fromTimestamp!);
      }
      if (filter.toTimestamp) {
        events = events.filter(e => e.timestamp <= filter.toTimestamp!);
      }
    }
    
    return events;
  }
  
  /**
   * Get all permissions for an application
   */
  getApplicationPermissions(appUuid: string): PermissionCacheEntry[] {
    const appPermissions = this.permissions.get(appUuid);
    if (!appPermissions) {
      return [];
    }
    
    return Array.from(appPermissions.values());
  }
  
  /**
   * Revoke all permissions for an application
   */
  revokeAllPermissions(appUuid: string): void {
    this.permissions.delete(appUuid);
    
    this.logSecurityEvent({
      type: 'permission_denied',
      appUuid,
      details: { action: 'revoke_all' },
      severity: 'warning'
    });
  }
}
