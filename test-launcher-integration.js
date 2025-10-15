/**
 * Quick test to verify production services are integrated
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Testing Launcher Integration...\n');

// Check if platform-launcher.js has the imports
const launcherPath = 'platform-launcher.js';
const launcherContent = fs.readFileSync(launcherPath, 'utf-8');

console.log('1️⃣  Checking imports...');
const checks = [
  { name: 'MessageBroker import', pattern: /require\('\.\/packages\/runtime\/dist\/packages\/runtime\/src\/services\/MessageBroker'\)/ },
  { name: 'MessagePersistence import', pattern: /require\('\.\/packages\/runtime\/dist\/packages\/runtime\/src\/services\/MessagePersistence'\)/ },
  { name: 'initializeProductionServices', pattern: /function initializeProductionServices\(\)/ },
  { name: 'messageBroker initialization', pattern: /platform\.messageBroker = new MessageBroker\(\)/ },
  { name: 'messagePersistence initialization', pattern: /platform\.messagePersistence = new MessagePersistence\(/ },
  { name: 'Message persistence on broadcast', pattern: /await platform\.messagePersistence\.persist\(/ },
  { name: 'Shutdown handler', pattern: /await platform\.messagePersistence\.shutdown\(\)/ }
];

let allPassed = true;
checks.forEach(({ name, pattern }) => {
  if (pattern.test(launcherContent)) {
    console.log(`   ✅ ${name}`);
  } else {
    console.log(`   ❌ ${name} - NOT FOUND`);
    allPassed = false;
  }
});

console.log('\n2️⃣  Checking compiled services...');
const compiledFiles = [
  'packages/runtime/dist/packages/runtime/src/services/MessageBroker.js',
  'packages/runtime/dist/packages/runtime/src/services/MessagePersistence.js'
];

compiledFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${path.basename(file)} (${stats.size} bytes)`);
  } else {
    console.log(`   ❌ ${path.basename(file)} - NOT FOUND`);
    allPassed = false;
  }
});

console.log('\n📋 Summary:');
if (allPassed) {
  console.log('   ✅ All checks passed!');
  console.log('');
  console.log('🎉 Production features are integrated!');
  console.log('');
  console.log('When you run npm start, you will see:');
  console.log('   - [Production] Initializing MessageBroker...');
  console.log('   - [Production] Initializing MessagePersistence...');
  console.log('   - ✅ Production services initialized');
  console.log('   - 📁 IAB Storage: <path>/.iab-storage');
  console.log('');
  console.log('The .iab-storage folder will be created at:');
  console.log(`   ${path.join(require('os').homedir(), '.desktop-interop-platform', '.iab-storage')}`);
  console.log('');
  console.log('Every 30 seconds, you\'ll see statistics:');
  console.log('   - Broker stats (routes, queued messages, dead letters)');
  console.log('   - Persistence stats (file count, total size, buffered messages)');
  console.log('');
  console.log('🚀 Ready to test: npm start');
} else {
  console.log('   ❌ Some checks failed');
  console.log('   Please review the integration');
}
