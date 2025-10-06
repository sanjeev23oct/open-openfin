# Release Guide

## 📦 How to Create a Release

### Automated Release (Recommended)

1. **Update version in package.json:**
   ```bash
   npm version patch  # 0.1.0 -> 0.1.1
   npm version minor  # 0.1.0 -> 0.2.0
   npm version major  # 0.1.0 -> 1.0.0
   ```

2. **Push the tag:**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions will automatically:**
   - Build for Windows, macOS, and Linux
   - Create a GitHub Release
   - Upload executables as assets

### Manual Release

1. **Build executables:**
   ```bash
   # Windows
   npm run build:exe
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
   
   # All platforms
   npm run build:all
   ```

2. **Create GitHub Release:**
   - Go to: https://github.com/sanjeev23oct/open-openfin/releases/new
   - Tag: `v0.1.0`
   - Title: `Open OpenFin v0.1.0`
   - Description: Add changelog
   - Upload files from `dist/` folder

3. **Publish the release**

## 📥 For End Users

### Download Instructions

Add this to your README.md:

```markdown
## 📥 Download

Download the latest version for your platform:

**Windows:**
- [OpenOpenFin-Setup-0.1.0.exe](https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-Setup-0.1.0.exe)

**macOS:**
- [OpenOpenFin-0.1.0.dmg](https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-0.1.0.dmg)

**Linux:**
- [OpenOpenFin-0.1.0.AppImage](https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-0.1.0.AppImage)

Or visit the [Releases page](https://github.com/sanjeev23oct/open-openfin/releases) for all versions.
```

## 🔄 Auto-Update Support

To enable auto-updates, add to your `package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "sanjeev23oct",
      "repo": "open-openfin"
    }
  }
}
```

Then in your main process:
```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

## 📊 Release Checklist

- [ ] Update version in package.json
- [ ] Update CHANGELOG.md
- [ ] Test build locally
- [ ] Create git tag
- [ ] Push tag to trigger CI
- [ ] Verify GitHub Release created
- [ ] Test download links
- [ ] Announce release

## 🏷️ Version Naming

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (0.1.0): New features, backward compatible
- **PATCH** (0.0.1): Bug fixes

## 📝 Changelog Format

```markdown
## [0.1.0] - 2025-01-06

### Added
- Workspace management with save/load/delete
- Electron-compatible dialogs
- Toast notifications

### Fixed
- prompt() not working in Electron
- Workspace rendering issues

### Changed
- Improved UI styling
```
