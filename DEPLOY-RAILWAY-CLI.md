# Railway CLI Deployment Guide

## Quick Deploy (Automated)

Just run the deployment script:

```bash
./deploy-to-railway.bat
```

This will:
1. ✅ Build the web platform
2. ✅ Copy dist files to deploy-package
3. ✅ Stage and commit changes
4. ✅ Push to Railway (auto-deploys)

## Manual Deploy Steps

If you prefer to do it manually:

### 1. Build the Platform
```bash
cd packages/web-platform
npm run build
cd ../..
```

### 2. Copy Build Files
```bash
# Windows
xcopy /E /I /Y packages\web-platform\dist deploy-package\dist

# Linux/Mac
cp -r packages/web-platform/dist/. deploy-package/dist/
```

### 3. Commit and Push
```bash
git add -f deploy-package/dist
git add deploy-package/
git commit -m "Deploy: Modern header design + UI fixes"
git push origin main
```

Railway will automatically detect the push and deploy!

## What Gets Deployed

The `deploy-package/` folder contains:
- **dist/** - Pre-built Vite output (your web platform)
- **server.js** - Express server for SPA routing
- **package.json** - Minimal dependencies (only Express)
- **nixpacks.toml** - Railway build config
- **railway.json** - Railway deployment settings

## Deployment URL

Your live site: **https://open-openfin-production.up.railway.app**

## Check Deployment Status

1. Go to https://railway.app
2. Select your project
3. View deployment logs and status

## What's New in This Deployment

✨ **Modern Professional Header**
- Deep blue gradient design
- Glass-morphism buttons
- Smooth hover animations
- Lightning bolt icon with glow effect

✅ **UI Fixes**
- Removed channel circles
- Renamed to "Web Interop Platform"
- Improved iframe loading for external apps
- Better error handling

## Troubleshooting

### Build Fails
```bash
cd packages/web-platform
npm install
npm run build
```

### Push Rejected
```bash
git pull origin main
# Resolve conflicts if any
git push origin main
```

### Railway Not Deploying
- Check Railway dashboard for errors
- Verify `nixpacks.toml` and `railway.json` are correct
- Check that `deploy-package/dist` has files

## Alternative: Railway CLI

If you have Railway CLI installed:

```bash
# Login
railway login

# Link project (first time only)
railway link

# Deploy directly
cd deploy-package
railway up
```

## Notes

- The `dist` folder is force-added (`-f`) because it's normally gitignored
- Railway auto-deploys on every push to `main` branch
- Build time: ~30 seconds (fast because we use pre-built files)
- No build timeouts or workspace dependency issues

## Future Updates

Every time you make changes:

1. Make your code changes
2. Run `./deploy-to-railway.bat`
3. Wait ~30 seconds
4. Refresh your live site!

That's it! 🚀
