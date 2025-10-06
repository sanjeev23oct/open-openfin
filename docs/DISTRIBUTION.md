# Distribution Guide

## 🎯 Quick Summary

**Best way to distribute:** Use **GitHub Releases** with automated builds via GitHub Actions.

## 📦 Distribution Options Comparison

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **GitHub Releases** | ✅ Professional<br>✅ Version tracking<br>✅ Download stats<br>✅ No repo bloat | ⚠️ Manual upload | Small teams |
| **GitHub Actions** | ✅ Fully automated<br>✅ Multi-platform<br>✅ CI/CD integration | ⚠️ Setup required | Production apps |
| **Direct in repo** | ✅ Simple | ❌ Bloats repo<br>❌ No versioning<br>❌ Unprofessional | Never recommended |
| **External hosting** | ✅ Fast downloads | ❌ Costs money<br>❌ Maintenance | Large enterprises |

## 🚀 Recommended Setup (GitHub Actions)

### Step 1: Enable GitHub Actions

The workflow is already created at `.github/workflows/release.yml`

### Step 2: Create a Release

```bash
# Option A: Automated (Recommended)
npm run release:patch   # 0.1.0 -> 0.1.1
npm run release:minor   # 0.1.0 -> 0.2.0
npm run release:major   # 0.1.0 -> 1.0.0

# Then push
git push origin main --tags

# Option B: Manual
npm version patch
git push origin main --tags
```

### Step 3: GitHub Actions Will:
1. ✅ Build for Windows, macOS, Linux
2. ✅ Create GitHub Release
3. ✅ Upload executables as assets
4. ✅ Generate release notes

## 📥 For End Users

### Download Links

Users can download from:
- **Latest Release:** `https://github.com/sanjeev23oct/open-openfin/releases/latest`
- **All Releases:** `https://github.com/sanjeev23oct/open-openfin/releases`

### Direct Download URLs

```markdown
Windows: https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-Setup-0.1.0.exe
macOS:   https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-0.1.0.dmg
Linux:   https://github.com/sanjeev23oct/open-openfin/releases/latest/download/OpenOpenFin-0.1.0.AppImage
```

## 🔄 Auto-Update Support

### Enable in package.json:

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

### Add to main process:

```javascript
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  console.log('Update available!');
});

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall();
});
```

## 📊 Release Checklist

Before creating a release:

- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Build tested locally
- [ ] No uncommitted changes

## 🎨 Badge for README

Add this to your README.md:

```markdown
[![Download](https://img.shields.io/github/downloads/sanjeev23oct/open-openfin/total)](https://github.com/sanjeev23oct/open-openfin/releases)
[![Latest Release](https://img.shields.io/github/v/release/sanjeev23oct/open-openfin)](https://github.com/sanjeev23oct/open-openfin/releases/latest)
```

## 🔐 Code Signing (Optional but Recommended)

### Windows:
```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/cert.pfx",
      "certificatePassword": "password"
    }
  }
}
```

### macOS:
```json
{
  "build": {
    "mac": {
      "identity": "Developer ID Application: Your Name (TEAM_ID)"
    }
  }
}
```

## 📈 Analytics

Track downloads with:
- GitHub Insights → Traffic → Releases
- Or use: `https://api.github.com/repos/sanjeev23oct/open-openfin/releases`

## 🆘 Troubleshooting

### Build fails on GitHub Actions
- Check Node.js version matches local
- Verify all dependencies in package.json
- Check electron-builder configuration

### Large file size
- Enable compression in electron-builder
- Remove unnecessary dependencies
- Use `asar` packaging

### Users can't download
- Check release is published (not draft)
- Verify file permissions
- Test download links

## 📚 Additional Resources

- [Electron Builder Docs](https://www.electron.build/)
- [GitHub Releases Guide](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
