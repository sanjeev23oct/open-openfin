/**
 * Web Platform Entry Point
 * Initializes the browser-based FDC3 interop platform with full UI
 */

import { WebPlatformCore } from './core/WebPlatformCore';
import { StorageManager } from './storage/StorageManager';
import { 
  detectPlatform, 
  getCompatibilityReport, 
  displayCompatibilityWarning 
} from './utils/platformDetection';
import { fdc3MonitorUI } from './diagnostics/FDC3MonitorUI';

let platform: WebPlatformCore;
let storage: StorageManager;

// Initialize platform when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Web Platform] Initializing...');
  
  // Check browser compatibility
  const compatReport = getCompatibilityReport();
  console.log('[Web Platform] Compatibility Report:', compatReport);
  
  if (!compatReport.supported) {
    displayCompatibilityWarning();
    return;
  }
  
  // Detect platform type
  const platformType = detectPlatform();
  console.log('[Web Platform] Platform Type:', platformType);
  
  try {
    // Initialize storage
    storage = new StorageManager();
    await storage.initialize();
    
    // Initialize platform
    platform = new WebPlatformCore(storage);
    
    await platform.initialize({
      appDirectory: '/apps/directory.json',
      theme: 'light',
      enableMultiTab: false,
      performanceMode: false
    });
    
    // Make platform globally accessible
    (window as any).platform = platform;
    (window as any).platformType = platformType;
    (window as any).platformCapabilities = compatReport.capabilities;
    
    // Hide loading indicator
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
    
    // Setup UI
    setupUI();
    
    // Auto-launch demo apps in split-screen layout
    await autoLaunchDemoApps();
    
    console.log('[Web Platform] Ready!');
  } catch (error) {
    console.error('[Web Platform] Initialization failed:', error);
    
    // Show error message
    const loading = document.getElementById('loading');
    if (loading) {
      loading.innerHTML = `
        <div style="color: #d32f2f;">
          <h2>Platform Failed to Load</h2>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }
});

function setupUI() {
  // Populate app grid
  refreshAppGrid();
  
  // Setup channel selector
  document.querySelectorAll('.channel-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const channelId = btn.getAttribute('data-channel');
      if (channelId) {
        // Remove active from all
        document.querySelectorAll('.channel-btn').forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');
        
        // TODO: Join channel for focused window
        console.log('Switched to channel:', channelId);
      }
    });
  });
  
  // Setup FDC3 Monitor toggle
  document.getElementById('fdc3-monitor-toggle')?.addEventListener('click', () => {
    fdc3MonitorUI.toggle();
  });
  
  // Setup workspace actions
  document.getElementById('save-workspace')?.addEventListener('click', async () => {
    const name = prompt('Enter workspace name:');
    if (name) {
      try {
        await platform.saveWorkspace(name);
        alert(`Workspace "${name}" saved!`);
      } catch (error) {
        alert(`Failed to save workspace: ${error}`);
      }
    }
    document.getElementById('workspace-dropdown')?.classList.remove('visible');
  });
  
  document.getElementById('load-workspace')?.addEventListener('click', async () => {
    try {
      const workspaces = await platform.getWorkspaces();
      if (workspaces.length === 0) {
        alert('No saved workspaces');
        return;
      }
      
      const names = workspaces.map((w, i) => `${i + 1}. ${w.name}`).join('\n');
      const choice = prompt(`Select workspace:\n${names}\n\nEnter number:`);
      
      if (choice) {
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < workspaces.length) {
          await platform.loadWorkspace(workspaces[index].id);
          alert(`Loaded workspace "${workspaces[index].name}"`);
        }
      }
    } catch (error) {
      alert(`Failed to load workspace: ${error}`);
    }
    document.getElementById('workspace-dropdown')?.classList.remove('visible');
  });
  
  // Update dock periodically
  setInterval(updateDock, 1000);
}

function refreshAppGrid() {
  const apps = platform.getApplicationDirectory();
  const appGrid = document.getElementById('app-grid');
  
  if (appGrid) {
    appGrid.innerHTML = apps.map(app => `
      <div class="app-card" data-app-id="${app.appId}">
        <div class="app-icon">${app.icon || '📱'}</div>
        <div class="app-name">${app.name}</div>
        <div class="app-description">${app.description || ''}</div>
      </div>
    `).join('') + `
      <div class="app-card app-card-add" id="add-external-app-btn">
        <div class="app-icon">➕</div>
        <div class="app-name">Add External App</div>
        <div class="app-description">Add custom web app</div>
      </div>
    `;
    
    // Add click handlers
    appGrid.querySelectorAll('.app-card:not(.app-card-add)').forEach(card => {
      card.addEventListener('click', async () => {
        const appId = card.getAttribute('data-app-id');
        if (appId) {
          await launchApp(appId);
          document.getElementById('app-launcher')?.classList.remove('visible');
        }
      });
    });
    
    // Re-attach add button handler
    document.getElementById('add-external-app-btn')?.addEventListener('click', () => {
      showAddExternalAppDialog();
    });
  }
}

function showAddExternalAppDialog() {
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3000;
  `;
  
  dialog.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; width: 90%;">
      <h2 style="margin: 0 0 20px 0; color: #333;">Add External App</h2>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #666; font-size: 14px;">App Name</label>
        <input type="text" id="ext-app-name" placeholder="My Custom App" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #666; font-size: 14px;">App URL</label>
        <input type="url" id="ext-app-url" placeholder="https://example.com/app" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      
      <div style="margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 4px; color: #666; font-size: 14px;">Icon (emoji)</label>
        <input type="text" id="ext-app-icon" placeholder="🌐" maxlength="2"
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 4px; color: #666; font-size: 14px;">Description (optional)</label>
        <input type="text" id="ext-app-desc" placeholder="A custom web application" 
               style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="cancel-add-app" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">
          Cancel
        </button>
        <button id="confirm-add-app" style="padding: 8px 16px; border: none; background: #667eea; color: white; border-radius: 6px; cursor: pointer;">
          Add App
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(dialog);
  
  // Focus first input
  setTimeout(() => {
    (document.getElementById('ext-app-name') as HTMLInputElement)?.focus();
  }, 100);
  
  // Cancel button
  dialog.querySelector('#cancel-add-app')?.addEventListener('click', () => {
    dialog.remove();
  });
  
  // Confirm button
  dialog.querySelector('#confirm-add-app')?.addEventListener('click', async () => {
    const name = (document.getElementById('ext-app-name') as HTMLInputElement)?.value;
    const url = (document.getElementById('ext-app-url') as HTMLInputElement)?.value;
    const icon = (document.getElementById('ext-app-icon') as HTMLInputElement)?.value || '🌐';
    const description = (document.getElementById('ext-app-desc') as HTMLInputElement)?.value;
    
    if (!name || !url) {
      alert('Please enter both name and URL');
      return;
    }
    
    try {
      // Validate URL
      new URL(url);
      
      // Add app to platform
      platform.addExternalApp({
        name,
        url,
        icon,
        description
      });
      
      // Refresh app grid
      refreshAppGrid();
      
      // Close dialog
      dialog.remove();
      
      // Show success message
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 4000;
      `;
      notification.textContent = `Added "${name}" to app directory`;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
      
    } catch (error) {
      alert('Invalid URL. Please enter a valid web address.');
    }
  });
  
  // Close on background click
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.remove();
    }
  });
}

async function launchApp(appId: string) {
  try {
    console.log('[UI] Launching app:', appId);
    await platform.launchApplication(appId);
    updateDock();
  } catch (error) {
    console.error('[UI] Failed to launch app:', error);
    alert(`Failed to launch app: ${error}`);
  }
}

async function autoLaunchDemoApps() {
  try {
    console.log('[Web Platform] Auto-launching demo apps...');
    
    // Launch Ticker List on the left side
    const tickerListId = await platform.launchApplication('ticker-list', {
      bounds: {
        x: 20,
        y: 80,
        width: Math.floor((window.innerWidth - 60) / 2),
        height: window.innerHeight - 180
      }
    });
    
    // Wait a moment for first app to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Launch Ticker Details on the right side
    const tickerDetailsId = await platform.launchApplication('ticker-details', {
      bounds: {
        x: Math.floor((window.innerWidth - 60) / 2) + 40,
        y: 80,
        width: Math.floor((window.innerWidth - 60) / 2),
        height: window.innerHeight - 180
      }
    });
    
    console.log('[Web Platform] Demo apps launched:', { tickerListId, tickerDetailsId });
    updateDock();
  } catch (error) {
    console.error('[Web Platform] Failed to auto-launch demo apps:', error);
  }
}

function updateDock() {
  const runningApps = platform.getRunningApplications();
  const dock = document.getElementById('platform-dock');
  
  if (!dock) return;
  
  // Get app directory for icons
  const appDirectory = platform.getApplicationDirectory();
  const appMap = new Map(appDirectory.map(app => [app.appId, app]));
  
  dock.innerHTML = runningApps.map(app => {
    const appInfo = appMap.get(app.appId);
    const icon = appInfo?.icon || '📱';
    
    return `
      <div class="dock-app ${app.state === 'normal' ? 'active' : ''}" data-instance-id="${app.instanceId}">
        <div class="dock-app-icon">${icon}</div>
        <div class="dock-app-close">×</div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  dock.querySelectorAll('.dock-app').forEach(dockApp => {
    const instanceId = dockApp.getAttribute('data-instance-id');
    
    // Focus on click
    dockApp.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).classList.contains('dock-app-close')) {
        const windowManager = platform.getWindowManager();
        if (windowManager && instanceId) {
          const window = windowManager.getWindow(instanceId);
          if (window) {
            if (window.state === 'minimized') {
              windowManager.maximizeWindow(instanceId);
            }
            window.focus();
          }
        }
      }
    });
    
    // Close on X click
    const closeBtn = dockApp.querySelector('.dock-app-close');
    closeBtn?.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (instanceId) {
        await platform.closeApplication(instanceId);
        updateDock();
      }
    });
  });
}
