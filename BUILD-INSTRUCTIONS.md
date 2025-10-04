# Build Instructions

## Creating Executable Releases

### Prerequisites

```bash
npm install
```

### Build for Windows

```bash
npm run build:exe
```

This creates:
- `dist/Desktop Interop Platform Setup.exe` - Installer
- `dist/Desktop Interop Platform.exe` - Portable version

### Build for macOS

```bash
npm run build:mac
```

This creates:
- `dist/Desktop Interop Platform.dmg` - DMG installer
- `dist/Desktop Interop Platform-mac.zip` - Portable version

### Build for Linux

```bash
npm run build:linux
```

This creates:
- `dist/Desktop Interop Platform.AppImage` - AppImage
- `dist/desktop-interop-platform.deb` - Debian package

### Build for All Platforms

```bash
npm run build:all
```

## Output

All builds are created in the `dist/` folder.

## GitHub Releases

### Creating a Release

1. **Build executables:**
   ```bash
   npm run build:all
   ```

2. **Create GitHub Release:**
   - Go to https://github.com/sanjeev23oct/open-openfin/releases
   - Click "Create a new release"
   - Tag: `v0.1.0`
   - Title: `Desktop Interop Platform v0.1.0`
   - Upload files from `dist/` folder

3. **Recommended files to upload:**
   - `Desktop-Interop-Platform-Setup-0.1.0.exe` (Windows Installer)
   - `Desktop-Interop-Platform-0.1.0.exe` (Windows Portable)
   - `Desktop-Interop-Platform-0.1.0.dmg` (macOS)
   - `Desktop-Interop-Platform-0.1.0.AppImage` (Linux)
   - `desktop-interop-platform_0.1.0_amd64.deb` (Linux Debian)

### Release Notes Template

```markdown
## Desktop Interop Platform v0.1.0

### 🎉 First Release!

An open-source desktop interoperability platform with FDC3 support.

### ✨ Features

- 📱 Add external web apps via UI (Gmail, Slack, etc.)
- 📁 Workspace management with smart window positioning
- 🔄 FDC3 2.0 compliant messaging
- 🪟 Automatic window layouts (side-by-side, grid, etc.)
- 🔒 Secure app containers
- 💯 100% OpenFin compatible

### 📥 Downloads

**Windows:**
- [Desktop-Interop-Platform-Setup-0.1.0.exe](link) - Installer (Recommended)
- [Desktop-Interop-Platform-0.1.0.exe](link) - Portable

**macOS:**
- [Desktop-Interop-Platform-0.1.0.dmg](link) - DMG Installer

**Linux:**
- [Desktop-Interop-Platform-0.1.0.AppImage](link) - AppImage
- [desktop-interop-platform_0.1.0_amd64.deb](link) - Debian Package

### 🚀 Quick Start

1. Download and install for your platform
2. Launch the application
3. Click "Add App" to add external applications
4. Create workspaces to organize your apps
5. Enjoy!

### 📚 Documentation

- [Getting Started Guide](docs/GETTING-STARTED.md)
- [Adding Apps Guide](docs/ADDING-APPS.md)
- [API Documentation](docs/API.md)

### 🐛 Known Issues

None yet! Please report issues at: https://github.com/sanjeev23oct/open-openfin/issues

### 🙏 Credits

Built with ❤️ by the open-source community.
```

## Automated Builds with GitHub Actions

Create `.github/workflows/build.yml`:

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build:all
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: dist/*
```

## Manual Upload to GitHub

1. Build locally: `npm run build:all`
2. Go to GitHub Releases
3. Create new release
4. Upload files from `dist/` folder
5. Publish release

## Distribution

Users can download from:
- GitHub Releases page
- Direct download links in README
- Package managers (future: Chocolatey, Homebrew, etc.)
