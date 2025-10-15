/**
 * Test script to verify production-readiness features are compiled
 */

const path = require('path');
const fs = require('fs');

console.log('🧪 Verifying Production Features Build...\n');

// Check if source files exist
console.log('1️⃣  Checking source files...');
const sourceFiles = [
  'packages/runtime/src/services/MessageBroker.ts',
  'packages/runtime/src/services/MessagePersistence.ts',
  'packages/runtime/src/services/PermissionDialogManager.ts',
  'packages/runtime/src/ui/permission-dialog.html'
];

sourceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - NOT FOUND`);
  }
});

// Check if compiled files exist
console.log('\n2️⃣  Checking compiled files...');
const compiledFiles = [
  'packages/runtime/dist/packages/runtime/src/services/MessageBroker.js',
  'packages/runtime/dist/packages/runtime/src/services/MessagePersistence.js',
  'packages/runtime/dist/packages/runtime/src/services/PermissionDialogManager.js'
];

compiledFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const stats = fs.statSync(file);
    console.log(`   ✅ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`   ❌ ${file} - NOT COMPILED`);
  }
});

// Check RuntimeCore integration
console.log('\n3️⃣  Checking RuntimeCore integration...');
const runtimeCorePath = 'packages/runtime/src/RuntimeCore.ts';
const runtimeCoreContent = fs.readFileSync(runtimeCorePath, 'utf-8');

const integrations = [
  { name: 'MessageBroker', pattern: /MessageBroker/g },
  { name: 'MessagePersistence', pattern: /MessagePersistence/g },
  { name: 'PermissionDialogManager', pattern: /PermissionDialogManager/g }
];

integrations.forEach(({ name, pattern }) => {
  if (pattern.test(runtimeCoreContent)) {
    console.log(`   ✅ ${name} integrated`);
  } else {
    console.log(`   ⚠️  ${name} NOT integrated into RuntimeCore`);
  }
});

// Summary
console.log('\n📋 Summary:');
console.log('   The production-readiness features (MessageBroker, MessagePersistence, etc.)');
console.log('   have been implemented and compiled, but they are NOT yet integrated into');
console.log('   the RuntimeCore or the platform launcher.');
console.log('');
console.log('💡 Why you don\'t see .iab folder:');
console.log('   - npm start uses platform-launcher.js (old simple launcher)');
console.log('   - platform-launcher.js does NOT use MessagePersistence');
console.log('   - MessagePersistence creates the .iab folder');
console.log('');
console.log('🔧 To test the new features:');
console.log('   Option 1: Integrate into RuntimeCore (Task 3 from production-readiness spec)');
console.log('   Option 2: Create a test launcher that uses the new services');
console.log('   Option 3: Add MessagePersistence to platform-launcher.js manually');
console.log('');
console.log('📝 Next steps:');
console.log('   Run: node test-production-features.js --integrate');
console.log('   This will show you how to integrate the features.');

if (process.argv.includes('--integrate')) {
  console.log('\n\n🔧 Integration Guide:');
  console.log('');
  console.log('To integrate MessageBroker and MessagePersistence into RuntimeCore:');
  console.log('');
  console.log('1. Update packages/runtime/src/RuntimeCore.ts:');
  console.log('   - Import MessageBroker and MessagePersistence');
  console.log('   - Initialize them in registerCoreServices()');
  console.log('   - Pass them to InterApplicationBus');
  console.log('');
  console.log('2. Update packages/runtime/src/services/InterApplicationBus.ts:');
  console.log('   - Accept MessageBroker and MessagePersistence in constructor');
  console.log('   - Use MessageBroker for routing instead of direct Map');
  console.log('   - Use MessagePersistence to persist all messages');
  console.log('');
  console.log('3. Rebuild: npm run build');
  console.log('');
  console.log('4. Test with: npm start');
}
