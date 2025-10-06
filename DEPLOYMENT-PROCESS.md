# Railway Deployment Process - IMPORTANT

## Critical: Always Deploy from External Folder

**DO NOT** deploy from the monorepo root. Always use the external deployment folder.

## Step-by-Step Deployment Process

### 1. Build the Web Platform
```bash
cd packages/web-platform
npm run build
```

### 2. Copy Built Files to Deploy Package
```bash
# From project root
cp -r packages/web-platform/dist/. deploy-package/dist/
```

### 3. Copy Deploy Package to External Folder
```bash
# From project root
cp -r deploy-package/. ../web-platform-deploy/
```

### 4. Deploy from External Folder
```bash
cd ../web-platform-deploy
railway up
```

## Why This Approach?

1. **Monorepo Complexity**: The main repo has workspace dependencies that cause build issues on Railway
2. **Build Timeouts**: Installing all dependencies (including Electron) times out on Railway
3. **Clean Deployment**: External folder only contains what's needed (dist + server.js + minimal deps)
4. **.gitignore Issues**: The monorepo has ignore rules that filter out dist folders

## Quick Reference

```bash
# Complete deployment in one go:
cd packages/web-platform && npm run build && cd ../.. && \
cp -r packages/web-platform/dist/. deploy-package/dist/ && \
cp -r deploy-package/. ../web-platform-deploy/ && \
cd ../web-platform-deploy && railway up
```

## Deployment URL
https://open-openfin-production.up.railway.app

## Files in External Deployment Folder
```
web-platform-deploy/
├── dist/              # Built Vite output
├── server.js          # Express server
├── package.json       # Only express dependency
├── nixpacks.toml      # Railway build config
└── railway.json       # Railway deployment settings
```

## Troubleshooting

If deployment fails:
1. Verify dist folder exists in ../web-platform-deploy/dist/
2. Check that dist/index.html exists
3. Ensure railway is linked: `railway link`
4. Try: `railway status` to check current deployment

## Remember
- ✅ Deploy from: `../web-platform-deploy/`
- ❌ Don't deploy from: project root
- ✅ Always copy latest dist before deploying
- ✅ Use `railway up` not `git push`
