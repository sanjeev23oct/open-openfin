/**
 * Platform Detection Utilities
 * Detects which platform the application is running on
 */

export type PlatformType = 'desktop' | 'web' | 'standalone';

export interface PlatformCapabilities {
  hasDesktopAPI: boolean;
  hasWebPlatform: boolean;
  hasFDC3: boolean;
  hasServiceWorker: boolean;
  hasIndexedDB: boolean;
  hasLocalStorage: boolean;
  hasWebCrypto: boolean;
  hasSharedWorker: boolean;
  hasBroadcastChannel: boolean;
  isMobile: boolean;
  isTablet: boolean;
  browserName: string;
  browserVersion: string;
}

/**
 * Detect which platform the application is running on
 */
export function detectPlatform(): PlatformType {
  // Check for desktop platform (Electron/OpenFin)
  if (typeof (window as any).fin !== 'undefined') {
    return 'desktop';
  }
  
  // Check for web platform (iframe with FDC3 bridge)
  if (window.parent !== window && typeof (window as any).fdc3 !== 'undefined') {
    return 'web';
  }
  
  // Standalone (no platform)
  return 'standalone';
}

/**
 * Detect browser capabilities
 */
export function detectCapabilities(): PlatformCapabilities {
  const ua = navigator.userAgent;
  
  return {
    hasDesktopAPI: typeof (window as any).fin !== 'undefined',
    hasWebPlatform: window.parent !== window,
    hasFDC3: typeof (window as any).fdc3 !== 'undefined',
    hasServiceWorker: 'serviceWorker' in navigator,
    hasIndexedDB: 'indexedDB' in window,
    hasLocalStorage: typeof localStorage !== 'undefined',
    hasWebCrypto: 'crypto' in window && 'subtle' in window.crypto,
    hasSharedWorker: typeof SharedWorker !== 'undefined',
    hasBroadcastChannel: typeof BroadcastChannel !== 'undefined',
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    isTablet: /iPad|Android/i.test(ua) && !/Mobile/i.test(ua),
    browserName: detectBrowserName(),
    browserVersion: detectBrowserVersion()
  };
}

/**
 * Get unified FDC3 accessor
 */
export function getFDC3(): any {
  const platform = detectPlatform();
  
  if (platform === 'desktop') {
    // Desktop: window.fin.desktop.fdc3 or window.fdc3
    return (window as any).fin?.desktop?.fdc3 || (window as any).fdc3;
  } else if (platform === 'web') {
    // Web: window.fdc3 (injected by bridge)
    return (window as any).fdc3;
  }
  
  return null;
}

/**
 * Check if a specific capability is supported
 */
export function isCapabilitySupported(capability: keyof PlatformCapabilities): boolean {
  const capabilities = detectCapabilities();
  return capabilities[capability] as boolean;
}

/**
 * Get missing capabilities for the current browser
 */
export function getMissingCapabilities(): string[] {
  const capabilities = detectCapabilities();
  const missing: string[] = [];
  
  const requiredCapabilities: (keyof PlatformCapabilities)[] = [
    'hasIndexedDB',
    'hasLocalStorage'
  ];
  
  const recommendedCapabilities: (keyof PlatformCapabilities)[] = [
    'hasServiceWorker',
    'hasWebCrypto',
    'hasBroadcastChannel'
  ];
  
  for (const cap of requiredCapabilities) {
    if (!capabilities[cap]) {
      missing.push(`${cap} (required)`);
    }
  }
  
  for (const cap of recommendedCapabilities) {
    if (!capabilities[cap]) {
      missing.push(`${cap} (recommended)`);
    }
  }
  
  return missing;
}

/**
 * Check if the browser is supported
 */
export function isBrowserSupported(): boolean {
  const capabilities = detectCapabilities();
  
  // Minimum requirements
  return capabilities.hasIndexedDB && capabilities.hasLocalStorage;
}

/**
 * Get compatibility report
 */
export function getCompatibilityReport(): {
  supported: boolean;
  platform: PlatformType;
  capabilities: PlatformCapabilities;
  missing: string[];
  warnings: string[];
} {
  const platform = detectPlatform();
  const capabilities = detectCapabilities();
  const missing = getMissingCapabilities();
  const warnings: string[] = [];
  
  if (capabilities.isMobile) {
    warnings.push('Mobile browsers have limited window management capabilities');
  }
  
  if (!capabilities.hasServiceWorker) {
    warnings.push('Offline support unavailable without Service Worker');
  }
  
  if (!capabilities.hasWebCrypto) {
    warnings.push('Data encryption unavailable without Web Crypto API');
  }
  
  return {
    supported: isBrowserSupported(),
    platform,
    capabilities,
    missing,
    warnings
  };
}

/**
 * Detect browser name
 */
function detectBrowserName(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  
  return 'Unknown';
}

/**
 * Detect browser version
 */
function detectBrowserVersion(): string {
  const ua = navigator.userAgent;
  let match;
  
  if ((match = ua.match(/Firefox\/(\d+)/))) return match[1];
  if ((match = ua.match(/Edg\/(\d+)/))) return match[1];
  if ((match = ua.match(/Chrome\/(\d+)/))) return match[1];
  if ((match = ua.match(/Version\/(\d+).*Safari/))) return match[1];
  if ((match = ua.match(/Opera\/(\d+)/)) || (match = ua.match(/OPR\/(\d+)/))) return match[1];
  
  return 'Unknown';
}

/**
 * Display compatibility warning if needed
 */
export function displayCompatibilityWarning(): void {
  const report = getCompatibilityReport();
  
  if (!report.supported) {
    console.error('[Platform] Browser not supported!', report);
    
    const message = `
      Your browser is not supported.
      
      Missing capabilities:
      ${report.missing.join('\n')}
      
      Please use a modern browser like Chrome, Firefox, or Edge.
    `;
    
    alert(message);
  } else if (report.warnings.length > 0) {
    console.warn('[Platform] Compatibility warnings:', report.warnings);
  }
}
