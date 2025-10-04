# Architecture Explained - Multiple Web Apps in One Container

## What You're Running

When you run `npm run test:fdc3`, you're launching **ONE container** (Electron process) that hosts **THREE separate web applications**.

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DESKTOP INTEROP CONTAINER                         │
│                    (Single Electron Process)                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │              FDC3 MESSAGE BUS (Main Process)               │    │
│  │                                                            │    │
│  │  Red Channel:  [Context: AAPL, Apple Inc.]               │    │
│  │  Blue Channel: [Context: MSFT, Microsoft Corp.]          │    │
│  │                                                            │    │
│  │  Routes messages between apps on same channel             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              │                                      │
│                              │ IPC Communication                    │
│                              │                                      │
│  ┌───────────────┬──────────┴──────────┬───────────────┐          │
│  │               │                     │               │          │
│  ▼               ▼                     ▼               │          │
│                                                         │          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │ BrowserWindow 1 │  │ BrowserWindow 2 │  │ BrowserWindow 3 │   │
│  │   (Isolated)    │  │   (Isolated)    │  │   (Isolated)    │   │
│  │                 │  │                 │  │                 │   │
│  │ ┌─────────────┐ │  │ ┌─────────────┐ │  │ ┌─────────────┐ │   │
│  │ │  Web App 1  │ │  │ │  Web App 2  │ │  │ │  Web App 3  │ │   │
│  │ │ Broadcaster │ │  │ │   Listener  │ │  │ │ Chart Viewer│ │   │
│  │ │             │ │  │ │             │ │  │ │             │ │   │
│  │ │  HTML/CSS   │ │  │ │  HTML/CSS   │ │  │ │  HTML/CSS   │ │   │
│  │ │  JavaScript │ │  │ │  JavaScript │ │  │ │  JavaScript │ │   │
│  │ │             │ │  │ │             │ │  │ │             │ │   │
│  │ │ window.fdc3 │ │  │ │ window.fdc3 │ │  │ │ window.fdc3 │ │   │
│  │ └─────────────┘ │  │ └─────────────┘ │  │ └─────────────┘ │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. **Single Container = One Runtime Process**

Think of the container as a **building**:
- The building has **one foundation** (Electron main process)
- Inside are **multiple apartments** (BrowserWindows)
- Each apartment is **isolated** but shares utilities (FDC3 bus)

### 2. **Web Apps = Pure HTML/CSS/JavaScript**

Each app is just a web page:

```html
<!-- App 1: apps/sample-app-1/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <style>/* CSS styling */</style>
  </head>
  <body>
    <button onclick="broadcast()">Broadcast</button>
    <script>
      // JavaScript logic
      window.fdc3.broadcast({ type: 'fdc3.instrument', ... });
    </script>
  </body>
</html>
```

**No backend code!** Just front-end web technologies.

### 3. **Process Isolation**

Each BrowserWindow runs in its own process:

```
Task Manager View:
├─ electron.exe (Main Process)      - Container runtime
│  ├─ electron.exe (Renderer 1)     - App 1 (Broadcaster)
│  ├─ electron.exe (Renderer 2)     - App 2 (Listener)
│  └─ electron.exe (Renderer 3)     - App 3 (Chart Viewer)
```

**Benefits**:
- If one app crashes, others keep running
- Security: Apps can't access each other's memory
- Performance: Each app uses separate CPU/memory

### 4. **Communication Flow**

When App 1 broadcasts a context:

```
Step 1: User clicks "Broadcast" in App 1
   │
   ▼
Step 2: JavaScript calls window.fdc3.broadcast(context)
   │
   ▼
Step 3: Preload script sends IPC message to main process
   │
   ▼
Step 4: FDC3 Bus receives message
   │
   ├─ Checks which apps are on same channel
   │
   ▼
Step 5: Bus sends IPC to App 2 and App 3 (both on Red channel)
   │
   ├────────────────┬────────────────┐
   ▼                ▼                ▼
App 2 receives   App 3 receives   App 1 gets
and displays     and displays     confirmation
context          chart            
```

### 5. **Channel Isolation**

Channels create **virtual rooms**:

```
Red Channel Room:
├─ App 1 (Broadcaster) ✓
├─ App 2 (Listener) ✓
└─ App 3 (Chart Viewer) ✓
   → All can communicate

Blue Channel Room:
└─ (empty)
   → No communication with Red Channel
```

## Real-World Analogy

Think of it like a **Slack workspace**:

- **Container** = Slack application (one app running)
- **Web Apps** = Different channels (#general, #random, #dev)
- **FDC3 Channels** = Thread conversations
- **Context Broadcasting** = Posting a message
- **Context Listeners** = People reading messages

## Comparison with Traditional Apps

### Traditional Multi-App Setup:
```
Desktop:
├─ App1.exe (separate process)
├─ App2.exe (separate process)
└─ App3.exe (separate process)
   → No built-in communication
   → Each has own runtime
   → Hard to coordinate
```

### OpenFin/Our Container:
```
Desktop:
└─ Container.exe
   ├─ App 1 (web app)
   ├─ App 2 (web app)
   └─ App 3 (web app)
      → Built-in FDC3 communication
      → Shared runtime
      → Easy coordination
```

## Why This Matters

### For Developers:
- **Write once**: Use web technologies (HTML/CSS/JS)
- **Deploy anywhere**: Container handles OS differences
- **Easy updates**: Just update HTML files
- **Built-in communication**: FDC3 API provided

### For Users:
- **Seamless workflows**: Apps work together
- **Consistent UI**: All apps in same container
- **Better performance**: Shared resources
- **Reliable**: Isolated processes prevent cascading failures

### For Enterprises:
- **Security**: Sandboxed apps, controlled permissions
- **Governance**: Central deployment and updates
- **Integration**: Standard FDC3 for interop
- **Cost**: One runtime for many apps

## Try It Now!

Run the test with 3 apps:

```bash
npm run test:fdc3
```

**What to observe**:
1. **Three windows open** - all from one container
2. **Join all to Red channel** - they form a network
3. **Broadcast from App 1** - both App 2 and App 3 receive it
4. **Switch App 3 to Blue** - it stops receiving (isolation)

## This is OpenFin!

This is **exactly** how OpenFin works:
- Multiple web apps in one container ✓
- FDC3 for communication ✓
- Process isolation ✓
- Channel-based messaging ✓

The only differences in production OpenFin:
- Custom Chromium (vs Electron)
- WebSocket IAB (vs IPC)
- More features (intents, workspaces, etc.)

But the **core concept is identical**! 🎉
