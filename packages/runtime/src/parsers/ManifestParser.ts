import { ApplicationManifest } from '@desktop-interop/sdk';
import { PlatformError, ErrorCode } from '@desktop-interop/sdk';
import { z } from 'zod';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Zod schema for application manifest validation
 */
const StartupAppSchema = z.object({
  uuid: z.string().min(1, 'uuid is required'),
  name: z.string().min(1, 'name is required'),
  url: z.string().refine((val) => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, 'url must be a valid URL'),
  autoShow: z.boolean().optional(),
  frame: z.boolean().optional(),
  defaultWidth: z.number().positive().optional(),
  defaultHeight: z.number().positive().optional(),
  defaultLeft: z.number().optional(),
  defaultTop: z.number().optional(),
  resizable: z.boolean().optional(),
  maximizable: z.boolean().optional(),
  minimizable: z.boolean().optional()
});

const RuntimeSchema = z.object({
  version: z.string().min(1, 'runtime version is required'),
  arguments: z.string().optional()
});

const ShortcutSchema = z.object({
  company: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  name: z.string().optional(),
  target: z.array(z.enum(['desktop', 'start-menu'])).optional()
});

const PlatformSchema = z.object({
  uuid: z.string().optional(),
  autoShow: z.boolean().optional(),
  defaultWindowOptions: z.object({
    frame: z.boolean().optional(),
    resizable: z.boolean().optional()
  }).optional()
});

const PermissionsSchema = z.object({
  System: z.object({
    clipboard: z.boolean().optional(),
    notifications: z.boolean().optional(),
    launchExternalProcess: z.boolean().optional()
  }).optional(),
  Network: z.object({
    domains: z.array(z.string()).optional()
  }).optional()
}).optional();

const IntentSchema = z.object({
  name: z.string().min(1, 'intent name is required'),
  displayName: z.string().optional(),
  contexts: z.array(z.string()).min(1, 'at least one context type is required'),
  customConfig: z.record(z.string(), z.any()).optional()
});

const FDC3Schema = z.object({
  intents: z.array(IntentSchema).optional()
}).optional();

const ManifestSchema = z.object({
  startup_app: StartupAppSchema,
  runtime: RuntimeSchema.optional(),
  shortcut: ShortcutSchema.optional(),
  platform: PlatformSchema.optional(),
  permissions: PermissionsSchema,
  fdc3: FDC3Schema
});

/**
 * Manifest parser and validator
 * Uses Zod for schema validation
 */
export class ManifestParser {
  /**
   * Parse and validate a manifest from JSON string
   */
  parse(json: string): ApplicationManifest {
    let data: any;
    
    try {
      data = JSON.parse(json);
    } catch (error) {
      throw new PlatformError(
        'Failed to parse manifest JSON',
        ErrorCode.APP_MANIFEST_INVALID,
        'application',
        false,
        { error }
      );
    }
    
    const validation = this.validate(data);
    
    if (!validation.valid) {
      throw new PlatformError(
        `Manifest validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
        ErrorCode.APP_MANIFEST_INVALID,
        'application',
        false,
        { errors: validation.errors }
      );
    }
    
    return data as ApplicationManifest;
  }
  
  /**
   * Parse and validate using Zod schema
   */
  parseWithSchema(json: string): ApplicationManifest {
    let data: any;
    
    try {
      data = JSON.parse(json);
    } catch (error) {
      throw new PlatformError(
        'Failed to parse manifest JSON',
        ErrorCode.APP_MANIFEST_INVALID,
        'application',
        false,
        { error }
      );
    }
    
    try {
      const validated = ManifestSchema.parse(data);
      return validated as ApplicationManifest;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        
        throw new PlatformError(
          `Manifest validation failed: ${errors.map((e: ValidationError) => `${e.field}: ${e.message}`).join(', ')}`,
          ErrorCode.APP_MANIFEST_INVALID,
          'application',
          false,
          { errors }
        );
      }
      throw error;
    }
  }
  
  /**
   * Validate a manifest object (legacy method)
   */
  validate(manifest: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate startup_app
    if (!manifest.startup_app) {
      errors.push({ field: 'startup_app', message: 'startup_app is required' });
    } else {
      if (!manifest.startup_app.uuid) {
        errors.push({ field: 'startup_app.uuid', message: 'uuid is required' });
      }
      if (!manifest.startup_app.name) {
        errors.push({ field: 'startup_app.name', message: 'name is required' });
      }
      if (!manifest.startup_app.url) {
        errors.push({ field: 'startup_app.url', message: 'url is required' });
      }
      
      // Validate URL format
      if (manifest.startup_app.url && !this.isValidUrl(manifest.startup_app.url)) {
        errors.push({ field: 'startup_app.url', message: 'url must be a valid URL' });
      }
      
      // Validate numeric fields
      if (manifest.startup_app.defaultWidth !== undefined && 
          (typeof manifest.startup_app.defaultWidth !== 'number' || manifest.startup_app.defaultWidth <= 0)) {
        errors.push({ field: 'startup_app.defaultWidth', message: 'defaultWidth must be a positive number' });
      }
      if (manifest.startup_app.defaultHeight !== undefined && 
          (typeof manifest.startup_app.defaultHeight !== 'number' || manifest.startup_app.defaultHeight <= 0)) {
        errors.push({ field: 'startup_app.defaultHeight', message: 'defaultHeight must be a positive number' });
      }
    }
    
    // Validate runtime if present
    if (manifest.runtime) {
      if (!manifest.runtime.version) {
        errors.push({ field: 'runtime.version', message: 'runtime version is required when runtime is specified' });
      }
    }
    
    // Validate permissions if present
    if (manifest.permissions) {
      if (manifest.permissions.Network?.domains) {
        if (!Array.isArray(manifest.permissions.Network.domains)) {
          errors.push({ field: 'permissions.Network.domains', message: 'domains must be an array' });
        }
      }
    }
    
    // Validate FDC3 intents if present
    if (manifest.fdc3?.intents) {
      if (!Array.isArray(manifest.fdc3.intents)) {
        errors.push({ field: 'fdc3.intents', message: 'intents must be an array' });
      } else {
        manifest.fdc3.intents.forEach((intent: any, index: number) => {
          if (!intent.name) {
            errors.push({ field: `fdc3.intents[${index}].name`, message: 'intent name is required' });
          }
          if (!intent.contexts || !Array.isArray(intent.contexts)) {
            errors.push({ field: `fdc3.intents[${index}].contexts`, message: 'intent contexts must be an array' });
          }
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate using Zod schema
   */
  validateWithSchema(manifest: any): ValidationResult {
    try {
      ManifestSchema.parse(manifest);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        return { valid: false, errors };
      }
      return {
        valid: false,
        errors: [{ field: 'unknown', message: 'Unknown validation error' }]
      };
    }
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
