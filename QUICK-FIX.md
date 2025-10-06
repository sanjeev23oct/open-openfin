# ⚡ QUICK FIX - Run These Commands

You got the error because you're in the wrong directory. Here's the fix:

## 🎯 Copy & Paste These Commands:

### For Git Bash (MINGW64):
```bash
cd /d/repos-personal/repos/open-openfin
npm install
cd packages/web-platform
npm run dev
```

### For PowerShell:
```powershell
cd D:\repos-personal\repos\open-openfin
npm install
cd packages\web-platform
npm run dev
```

### For CMD:
```cmd
cd /d D:\repos-personal\repos\open-openfin
npm install
cd packages\web-platform
npm run dev
```

## ✅ Expected Output:

After `npm install`:
```
added 500+ packages in 30s
```

After `npm run dev`:
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:3000/
```

## 🎉 Then Open Browser:

http://localhost:3000

You'll see the platform with:
- Header with channel buttons
- "Launch Apps" button
- "Workspaces" button
- Empty workspace

Click "Launch Apps" and select apps to test FDC3 communication!

---

**That's it!** The issue was just being in the wrong directory. npm workspaces must be installed from the root.
