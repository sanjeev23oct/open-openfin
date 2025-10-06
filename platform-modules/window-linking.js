/**
 * Window Linking Module - Link windows to move together
 */

// Track linked windows: appId -> linkedAppId
const links = new Map();

// Track last known positions for delta calculation
const lastBounds = new Map();

// Prevent recursion when moving linked windows
const isMoving = new Map();

/**
 * Link two windows together
 */
function linkWindows(appId1, appId2, window1, window2) {
  links.set(appId1, appId2);
  links.set(appId2, appId1);
  
  // Store initial bounds
  lastBounds.set(appId1, window1.getBounds());
  lastBounds.set(appId2, window2.getBounds());
  
  // Initialize moving flags
  isMoving.set(appId1, false);
  isMoving.set(appId2, false);
  
  // Add move listeners
  window1.on('move', () => handleMove(appId1, appId2, window1, window2));
  window2.on('move', () => handleMove(appId2, appId1, window2, window1));
  
  console.log(`[Link] Linked ${appId1} <-> ${appId2}`);
}

/**
 * Unlink windows
 */
function unlinkWindows(appId) {
  const linkedId = links.get(appId);
  if (linkedId) {
    links.delete(appId);
    links.delete(linkedId);
    lastBounds.delete(appId);
    lastBounds.delete(linkedId);
    isMoving.delete(appId);
    isMoving.delete(linkedId);
    console.log(`[Link] Unlinked ${appId} <-> ${linkedId}`);
  }
}

/**
 * Handle window move - move linked window by same delta
 */
function handleMove(movedId, linkedId, movedWindow, linkedWindow) {
  if (!links.has(movedId)) return;
  if (isMoving.get(movedId)) return; // Prevent recursion
  
  const currentBounds = movedWindow.getBounds();
  const lastKnown = lastBounds.get(movedId);
  
  if (lastKnown) {
    const deltaX = currentBounds.x - lastKnown.x;
    const deltaY = currentBounds.y - lastKnown.y;
    
    // Only move if there's actual movement
    if (deltaX !== 0 || deltaY !== 0) {
      isMoving.set(linkedId, true); // Prevent linked window from triggering move
      
      const linkedBounds = linkedWindow.getBounds();
      linkedWindow.setBounds({
        x: linkedBounds.x + deltaX,
        y: linkedBounds.y + deltaY,
        width: linkedBounds.width,
        height: linkedBounds.height
      });
      
      // Update linked window's last bounds
      lastBounds.set(linkedId, linkedWindow.getBounds());
      
      isMoving.set(linkedId, false);
    }
  }
  
  lastBounds.set(movedId, currentBounds);
}

/**
 * Check if window is linked
 */
function isLinked(appId) {
  return links.has(appId);
}

/**
 * Get linked window ID
 */
function getLinkedId(appId) {
  return links.get(appId);
}

module.exports = {
  linkWindows,
  unlinkWindows,
  isLinked,
  getLinkedId
};
