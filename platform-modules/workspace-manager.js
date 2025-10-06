/**
 * Workspace Manager - Save and load window layouts
 */

const fs = require('fs');
const path = require('path');

/**
 * Save current workspace
 */
function saveWorkspace(name, appWindows, workspacesPath) {
  const workspace = {
    name,
    apps: []
  };
  
  // Save all window positions
  for (const [appId, window] of appWindows.entries()) {
    if (!window.isDestroyed()) {
      workspace.apps.push({
        appId,
        bounds: window.getBounds()
      });
    }
  }
  
  // Load existing workspaces
  let workspaces = {};
  if (fs.existsSync(workspacesPath)) {
    try {
      workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
    } catch (err) {
      console.error('[Workspace] Error loading workspaces:', err);
    }
  }
  
  // Save new workspace
  workspaces[name] = workspace;
  fs.writeFileSync(workspacesPath, JSON.stringify(workspaces, null, 2));
  
  console.log(`[Workspace] Saved "${name}" with ${workspace.apps.length} apps`);
  return workspace;
}

/**
 * Load workspace
 */
function loadWorkspace(name, workspacesPath) {
  if (!fs.existsSync(workspacesPath)) {
    throw new Error('No workspaces file found');
  }
  
  const workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
  const workspace = workspaces[name];
  
  if (!workspace) {
    throw new Error(`Workspace "${name}" not found`);
  }
  
  console.log(`[Workspace] Loading "${name}" with ${workspace.apps.length} apps`);
  return workspace;
}

/**
 * List all workspaces
 */
function listWorkspaces(workspacesPath) {
  if (!fs.existsSync(workspacesPath)) {
    return [];
  }
  
  try {
    const workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
    return Object.keys(workspaces).map(name => ({
      name,
      appCount: workspaces[name].apps.length
    }));
  } catch (err) {
    console.error('[Workspace] Error listing workspaces:', err);
    return [];
  }
}

/**
 * Delete workspace
 */
function deleteWorkspace(name, workspacesPath) {
  if (!fs.existsSync(workspacesPath)) {
    return;
  }
  
  const workspaces = JSON.parse(fs.readFileSync(workspacesPath, 'utf-8'));
  delete workspaces[name];
  fs.writeFileSync(workspacesPath, JSON.stringify(workspaces, null, 2));
  
  console.log(`[Workspace] Deleted "${name}"`);
}

module.exports = {
  saveWorkspace,
  loadWorkspace,
  listWorkspaces,
  deleteWorkspace
};
