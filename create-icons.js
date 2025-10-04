/**
 * Simple script to create placeholder icon files
 * Run with: node create-icons.js
 */

const fs = require('fs');
const path = require('path');

// Create a minimal valid PNG file (1x1 transparent pixel)
// This is a base64 encoded 1x1 transparent PNG
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create icon.png
const iconPath = path.join(assetsDir, 'icon.png');
fs.writeFileSync(iconPath, minimalPNG);
console.log('✅ Created icon.png');

// Create tray-icon.png
const trayIconPath = path.join(assetsDir, 'tray-icon.png');
fs.writeFileSync(trayIconPath, minimalPNG);
console.log('✅ Created tray-icon.png');

console.log('\n📝 Note: These are minimal placeholder icons.');
console.log('   For production, replace with proper icon files.');
