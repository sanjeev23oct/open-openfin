# Installation Instructions

## ⚠️ Important: Install from Root Directory

This project uses npm workspaces. You must install from the **root directory**, not from the packages directory.

## 🚀 Quick Start

### Step 1: Go to Root Directory
```bash
cd ../..  # Go back to project root (open-openfin/)
```

### Step 2: Install All Dependencies
```bash
npm install
```

This will install dependencies for all packages including web-platform.

### Step 3: Start Web Platform
```bash
cd packages/web-platform
npm run dev
```

## 🔧 Alternative: Install Specific Package

If you want to work only on web-platform:

```bash
# From root directory
npm install --workspace=@desktop-interop/web-platform
```

## 📦 What Gets Installed

The workspace setup will:
- Install all dependencies for all packages
- Link local packages together (fdc3, fdc3-core, sdk, web-platform)
- Set up TypeScript references
- Prepare build tools

## ✅ Verify Installation

```bash
# From root
npm run dev --workspace=@desktop-interop/web-platform

# Or
cd packages/web-platform
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

## 🐛 Troubleshooting

### Error: "Unsupported URL Type workspace:"
**Solution**: You're running `npm install` from the wrong directory. Go to root:
```bash
cd ../../  # Go to open-openfin/
npm install
```

### Error: "Cannot find module @desktop-interop/fdc3"
**Solution**: Install from root first:
```bash
cd ../../
npm install
cd packages/web-platform
npm run dev
```

### Error: "ENOENT: no such file or directory"
**Solution**: Make sure you're in the correct directory structure:
```
open-openfin/
├── packages/
│   ├── fdc3/
│   ├── fdc3-core/
│   ├── web-platform/  ← You are here
│   └── ...
└── package.json  ← Install from here
```

## 🎯 Ready to Go!

Once installed, open http://localhost:3000 and enjoy the platform!
