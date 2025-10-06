#!/usr/bin/env node

/**
 * Release Helper Script
 * Creates a new release with proper versioning and changelog
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const versionType = args[0] || 'patch'; // patch, minor, major

console.log('🚀 Creating new release...\n');

try {
  // 1. Check for uncommitted changes
  console.log('📋 Checking for uncommitted changes...');
  const status = execSync('git status --porcelain').toString();
  if (status) {
    console.error('❌ You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }
  console.log('✅ Working directory clean\n');

  // 2. Update version
  console.log(`📦 Bumping ${versionType} version...`);
  execSync(`npm version ${versionType} --no-git-tag-version`, { stdio: 'inherit' });
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const newVersion = packageJson.version;
  console.log(`✅ New version: ${newVersion}\n`);

  // 3. Update CHANGELOG
  console.log('📝 Updating CHANGELOG.md...');
  const today = new Date().toISOString().split('T')[0];
  const changelogEntry = `\n## [${newVersion}] - ${today}\n\n### Added\n- \n\n### Fixed\n- \n\n### Changed\n- \n\n`;
  
  const changelogPath = 'CHANGELOG.md';
  let changelog = '';
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, 'utf8');
    const lines = changelog.split('\n');
    const insertIndex = lines.findIndex(line => line.startsWith('## ['));
    if (insertIndex !== -1) {
      lines.splice(insertIndex, 0, changelogEntry);
      changelog = lines.join('\n');
    } else {
      changelog = changelogEntry + changelog;
    }
  } else {
    changelog = `# Changelog\n\nAll notable changes to this project will be documented in this file.\n${changelogEntry}`;
  }
  fs.writeFileSync(changelogPath, changelog);
  console.log('✅ CHANGELOG.md updated\n');

  // 4. Commit changes
  console.log('💾 Committing changes...');
  execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  console.log('✅ Changes committed\n');

  // 5. Create tag
  console.log('🏷️  Creating git tag...');
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { stdio: 'inherit' });
  console.log(`✅ Tag v${newVersion} created\n`);

  // 6. Instructions
  console.log('✨ Release prepared successfully!\n');
  console.log('Next steps:');
  console.log('1. Edit CHANGELOG.md to add release notes');
  console.log('2. Run: git push origin main --tags');
  console.log('3. GitHub Actions will automatically build and create the release\n');
  console.log(`Or manually build with: npm run build:all\n`);

} catch (error) {
  console.error('❌ Error creating release:', error.message);
  process.exit(1);
}
