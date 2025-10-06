# 🚀 Web Platform - Complete Setup Guide

## ❌ The Error You're Seeing

```
npm error Unsupported URL Type "workspace:": workspace:*
```

**Cause**: You ran `npm install` from `packages/` directory instead of the root directory.

## ✅ Correct Setup (3 Steps)

### Step 1: Navigate to Root Directory

```bash
# You are currently in: D:/repos-personal/repos/open-openfin/packages
# You need to go to: D:/repos-personal/repos/open-openfin

cd ..
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs everything for all packages.

### Step 3: Start Web Platform

```bash
cd packages/web-platform
npm run dev
```

## 🎯 Quick Commands (Copy & Paste)

### For Windows (Git Bash/PowerShell):
```bash
cd D:/repos-personal/repos/open-openfin
npm install
cd packages/web-platform
npm run dev
```

### Or Use the Setup Script:
```bash
cd D:/repos-personal/repos/open-openfin
./setup-web-platform.bat
```

## 📁 Directory Structure

```
D:/repos-personal/repos/open-openfin/     ← Install from HERE
├── package.json                          ← Root package.json with workspaces
├── packages/
│   ├── fdc3/
│   ├── fdc3-core/                        ← New package
│   ├── web-platform/                     ← New package
│   ├── runtime/
│   └── ...
└── node_modules/                         ← Created after npm install
```

## 🔍 What Happens During Install

1. **npm install** (from root):
   - Installs dependencies for ALL packages
   - Links local packages together
   - Creates `node_modules` in root and packages
   - Sets up TypeScript references

2. **npm run dev** (from web-platform):
   - Starts Vite dev server
   - Opens http://localhost:3000
   - Hot reload enabled

## ✅ Verification Steps

After running the commands, you should see:

```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Then open your browser to http://localhost:3000 and you'll see:
- 🚀 Platform header with channels
- 📱 "Launch Apps" button
- 💼 "Workspaces" button
- Empty workspace ready for apps

## 🎮 Using the Platform

1. **Click "📱 Launch Apps"**
2. **Select "Ticker List"** → Opens in draggable window
3. **Select "Ticker Details"** → Opens in second window
4. **Select "News Feed"** → Opens in third window
5. **Click any ticker** in Ticker List → Watch other apps update via FDC3!

## 🐛 Common Issues & Fixes

### Issue 1: "workspace:" error
**Fix**: You're in wrong directory
```bash
cd D:/repos-personal/repos/open-openfin
npm install
```

### Issue 2: "Cannot find module @desktop-interop/fdc3"
**Fix**: Dependencies not installed
```bash
cd D:/repos-personal/repos/open-openfin
npm install
```

### Issue 3: "Port 3000 already in use"
**Fix**: Kill the process or use different port
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

### Issue 4: TypeScript errors
**Fix**: Build the dependencies first
```bash
cd D:/repos-personal/repos/open-openfin
npm run build --workspace=@desktop-interop/fdc3
npm run build --workspace=@desktop-interop/fdc3-core
cd packages/web-platform
npm run dev
```

## 📦 Package Dependencies

The web-platform depends on:
- `@desktop-interop/fdc3` - FDC3 type definitions
- `@desktop-interop/fdc3-core` - Shared FDC3 logic
- `@desktop-interop/sdk` - SDK types

These are linked automatically by npm workspaces when you install from root.

## 🎯 Alternative: Manual Setup

If automated setup doesn't work:

```bash
# 1. Go to root
cd D:/repos-personal/repos/open-openfin

# 2. Install root dependencies
npm install

# 3. Install fdc3-core dependencies
cd packages/fdc3-core
npm install
cd ../..

# 4. Install web-platform dependencies
cd packages/web-platform
npm install
cd ../..

# 5. Build fdc3-core
cd packages/fdc3-core
npm run build
cd ../..

# 6. Start web-platform
cd packages/web-platform
npm run dev
```

## 🚀 You're Ready!

Once you see the Vite server running, open http://localhost:3000 and enjoy your production-ready FDC3 platform!

## 📚 Next Steps

- Read `packages/web-platform/GETTING-STARTED.md` for usage guide
- Read `packages/web-platform/PRODUCTION-READY.md` for features
- Check `.kiro/specs/web-based-interop-platform/` for implementation details

## 💡 Pro Tips

1. **Always install from root** - This is a monorepo
2. **Use workspaces commands** - `npm run dev --workspace=@desktop-interop/web-platform`
3. **Hot reload works** - Edit files and see changes instantly
4. **Check console** - Browser console shows FDC3 messages
5. **Use dev tools** - `window.platform` is globally accessible

---

**Need help?** Check the error message and match it to the "Common Issues" section above.
