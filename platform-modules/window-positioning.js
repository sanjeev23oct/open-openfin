/**
 * Simple Window Positioning Module
 */

const { screen } = require('electron');

// Track last window position for auto-arrangement
let lastPosition = { x: 100, y: 100 };

/**
 * Get next window position with simple 50px offset
 */
function getNextPosition(width, height, isFirstWindow) {
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;
  
  // First window: center it
  if (isFirstWindow) {
    lastPosition = {
      x: Math.floor((screenWidth - width) / 2),
      y: Math.floor((screenHeight - height) / 2)
    };
    console.log('[Position] First window centered at', lastPosition);
    return { ...lastPosition };
  }
  
  // Subsequent windows: offset by 50px from last position
  lastPosition.x += 50;
  lastPosition.y += 50;
  
  // Wrap if THIS window would be off-screen
  if (lastPosition.x + width > screenWidth || lastPosition.y + height > screenHeight) {
    lastPosition.x = 100;
    lastPosition.y = 100;
    console.log('[Position] Wrapped to start');
  }
  
  const pos = { ...lastPosition };
  console.log('[Position] Window positioned at', pos);
  return pos;
}

/**
 * Snap window to left half of screen
 */
function snapLeft(window) {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  window.setBounds({
    x: 0,
    y: 0,
    width: Math.floor(width / 2),
    height: height
  });
  console.log('[Snap] Window snapped left');
}

/**
 * Snap window to right half of screen
 */
function snapRight(window) {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;
  window.setBounds({
    x: Math.floor(width / 2),
    y: 0,
    width: Math.floor(width / 2),
    height: height
  });
  console.log('[Snap] Window snapped right');
}

module.exports = {
  getNextPosition,
  snapLeft,
  snapRight
};
