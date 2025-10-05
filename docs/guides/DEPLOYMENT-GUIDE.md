# Deployment Guide for End Users

## 🚀 How to Distribute to End Users

There are several ways to package and distribute the Desktop Interoperability Platform to end users.

## Option 1: Electron Packager (Recommended for Quick Distribution)

### Step 1: Install Electron Packager

```bash
npm install --save-dev electron-packager
```

### Step 2: Add Build Scripts to package.json

```json
{
  "scripts": {
    "package:win": "electron-packager . DesktopInterop --platform=win32 --arch=x64 --out=dist --overwrite --icon=assets/icon.png",
    "package:mac": "electron-packager . DesktopInterop --platform=darwin --arch=x64 --out=dist --overwrite --icon=assets/icon.png",
    "package:linux": "electron-packager . DesktopInterop --platform=linux --arch=x64 --out=dist --overwrite --icon=assets/icon.png",
    "package:all": "npm run package:win && npm run package:mac && npm run package:linux"
  }
}
```

### Step 3: Build for Distribution

```bash
# For Windows
npm run package:win

# For macOS
npm run package:mac

# For Linux
npm run package:linux

# For all platforms
npm run package:all
```

### Step 4: Distribute

The packaged application will be in the `dist/` folder. Zip it and share!

**Windows:** `dist/DesktopInterop-win32-x64/DesktopInterop.exe`  
**macOS:** `dist/DesktopInterop-darwin-x64/DesktopInterop.app`  
**Linux:** `dist/DesktopInterop-linux-x64/DesktopInterop`

---

## Option 2: Electron Builder (Recommended for Professional Distribution)

### Step 1: Install Electron Builder

```bash
npm install --save-dev electron-builder
```

### Step 2: Add Build Configuration to package.json

```json
{
  "name": "desktop-interop-platform",
  "version": "1.0.0",
  "description": "Open-source desktop interoperability platform",
  "main": "platform-launcher.js",
  "author": "Your Name",
  "license": "MIT",
  "build": {
    "appId": "com.yourcompany.desktopinterop",
    "productName": "Desktop Interop Platform",
    "directories": {
      "output": "release"
    },
    "files": [
      "**/*",
      "!**/*.ts",
      "!*.md",
      "!.git",
      "!.kiro",
      "!node_modules/**/{CHANGELOG.md,README.md,README,readme.md,readme}",
      "!node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
      "!node_modules/*.d.ts",
      "!node_modules/.bin",
      "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
      "!.editorconfig",
      "!**/._*",
      "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
      "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
      "!**/{appveyor.yml,.travis.yml,circle.yml}",
      "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "mac": {
      "target": ["dmg", "zip"],
      "icon": "assets/icon.png",
      "category": "public.app-category.productivity"
    },
    "linux": {
      "target": ["AppImage", "deb", "rpm"],
      "icon": "assets/icon.png",
      "category": "Utility"
    }
  },
  "scripts": {
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux",
    "build:all": "electron-builder -mwl",
    "dist": "electron-builder"
  }
}
```

### Step 3: Build Installers

```bash
# For Windows (creates installer and portable exe)
npm run build:win

# For macOS (creates DMG and ZIP)
npm run build:mac

# For Linux (creates AppImage, DEB, and RPM)
npm run build:linux

# For all platforms
npm run build:all
```

### Step 4: Distribute

Installers will be in the `release/` folder:

**Windows:**
- `release/Desktop Interop Platform Setup 1.0.0.exe` (Installer)
- `release/Desktop Interop Platform 1.0.0.exe` (Portable)

**macOS:**
- `release/Desktop Interop Platform-1.0.0.dmg`
- `release/Desktop Interop Platform-1.0.0-mac.zip`

**Linux:**
- `release/Desktop Interop Platform-1.0.0.AppImage`
- `release/desktop-interop-platform_1.0.0_amd64.deb`
- `release/desktop-interop-platform-1.0.0.x86_64.rpm`

---

## Option 3: Simple ZIP Distribution (Easiest)

### For Quick Testing/Distribution

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Create a distribution folder:**
   ```bash
   mkdir desktop-interop-dist
   ```

3. **Copy necessary files:**
   ```bash
   # Copy all files except development files
   cp -r apps desktop-interop-dist/
   cp -r assets desktop-interop-dist/
   cp -r docs desktop-interop-dist/
   cp -r packages desktop-interop-dist/
   cp -r platform-ui desktop-interop-dist/
   cp -r workspaces desktop-interop-dist/
   cp platform-launcher.js desktop-interop-dist/
   cp platform-preload.js desktop-interop-dist/
   cp test-preload.js desktop-interop-dist/
   cp package.json desktop-interop-dist/
   cp create-icons.js desktop-interop-dist/
   cp README.md desktop-interop-dist/
   cp QUICK-START.md desktop-interop-dist/
   ```

4. **Create a startup script:**

   **Windows (start.bat):**
   ```batch
   @echo off
   echo Installing dependencies...
   call npm install
   echo Creating icons...
   call node create-icons.js
   echo Starting Desktop Interop Platform...
   call npm start
   ```

   **macOS/Linux (start.sh):**
   ```bash
   #!/bin/bash
   echo "Installing dependencies..."
   npm install
   echo "Creating icons..."
   node create-icons.js
   echo "Starting Desktop Interop Platform..."
   npm start
   ```

5. **Zip the folder:**
   ```bash
   zip -r desktop-interop-platform.zip desktop-interop-dist/
   ```

6. **Distribute the ZIP file**

**End users just:**
1. Extract the ZIP
2. Run `start.bat` (Windows) or `start.sh` (macOS/Linux)
3. Done!

---

## Option 4: Auto-Update with Electron-Updater

### For Professional Deployments with Auto-Updates

1. **Install electron-updater:**
   ```bash
   npm install electron-updater
   ```

2. **Add to platform-launcher.js:**
   ```javascript
   const { autoUpdater } = require('electron-updater');
   
   app.whenReady().then(() => {
     // Check for updates
     autoUpdater.checkForUpdatesAndNotify();
     
     // Your existing code...
   });
   ```

3. **Configure in package.json:**
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

4. **Build and publish:**
   ```bash
   npm run build:all
   # Upload to GitHub Releases
   ```

---

## Distribution Checklist

### Before Distribution:

- [ ] Update version in package.json
- [ ] Test on target platforms
- [ ] Create proper icons (256x256 PNG)
- [ ] Update README with installation instructions
- [ ] Test with fresh install (no node_modules)
- [ ] Create release notes
- [ ] Sign executables (for production)

### Files to Include:

- [ ] All source files
- [ ] package.json
- [ ] README.md
- [ ] QUICK-START.md
- [ ] LICENSE
- [ ] Sample apps
- [ ] Documentation
- [ ] Icons and assets

### Files to Exclude:

- [ ] node_modules (users will install)
- [ ] .git
- [ ] .kiro
- [ ] Development files (*.ts, *.map)
- [ ] Test files
- [ ] Build artifacts

---

## End User Installation Instructions

### Windows

**Option A: Installer (Recommended)**
1. Download `Desktop Interop Platform Setup.exe`
2. Run the installer
3. Follow installation wizard
4. Launch from Start Menu or Desktop shortcut

**Option B: Portable**
1. Download `Desktop Interop Platform.exe`
2. Run directly (no installation needed)

**Option C: From Source**
1. Download and extract ZIP
2. Double-click `start.bat`
3. Wait for installation to complete
4. Platform launches automatically

### macOS

**Option A: DMG (Recommended)**
1. Download `Desktop Interop Platform.dmg`
2. Open the DMG file
3. Drag app to Applications folder
4. Launch from Applications

**Option B: From Source**
1. Download and extract ZIP
2. Open Terminal in extracted folder
3. Run: `chmod +x start.sh && ./start.sh`
4. Platform launches automatically

### Linux

**Option A: AppImage (Recommended)**
1. Download `Desktop Interop Platform.AppImage`
2. Make executable: `chmod +x Desktop*.AppImage`
3. Run: `./Desktop*.AppImage`

**Option B: DEB (Debian/Ubuntu)**
1. Download `.deb` file
2. Install: `sudo dpkg -i desktop-interop-platform*.deb`
3. Run: `desktop-interop-platform`

**Option C: RPM (Fedora/RHEL)**
1. Download `.rpm` file
2. Install: `sudo rpm -i desktop-interop-platform*.rpm`
3. Run: `desktop-interop-platform`

---

## Hosting Options

### 1. GitHub Releases (Free)
- Upload installers to GitHub Releases
- Users download from releases page
- Supports auto-updates

### 2. Website Download
- Host installers on your website
- Provide download links
- Track downloads with analytics

### 3. Enterprise Distribution
- Host on internal servers
- Use group policy for deployment
- Integrate with SCCM/Intune

### 4. App Stores
- Microsoft Store (Windows)
- Mac App Store (macOS)
- Snap Store (Linux)

---

## Quick Distribution Commands

### Complete Build Process:

```bash
# 1. Install dependencies
npm install

# 2. Install build tools
npm install --save-dev electron-builder

# 3. Build for all platforms
npm run build:all

# 4. Installers are in release/ folder
ls release/
```

### Upload to GitHub Releases:

```bash
# 1. Create a new release on GitHub
# 2. Upload files from release/ folder
# 3. Publish release
```

---

## Support and Updates

### Providing Support:

1. **Documentation:** Include comprehensive docs
2. **FAQ:** Create FAQ for common issues
3. **Issue Tracker:** Use GitHub Issues
4. **Updates:** Regular updates via GitHub Releases

### Update Process:

1. Fix bugs or add features
2. Update version in package.json
3. Build new installers
4. Upload to GitHub Releases
5. Users get auto-update notification (if configured)

---

## Summary

**Easiest for Testing:** Option 3 (ZIP distribution)  
**Best for End Users:** Option 2 (Electron Builder with installers)  
**Most Professional:** Option 4 (Auto-updates + signed installers)

**Recommended Workflow:**
1. Start with ZIP for testing
2. Move to Electron Builder for beta
3. Add auto-updates for production
4. Sign executables for enterprise

Your platform is now ready for distribution! 🚀
