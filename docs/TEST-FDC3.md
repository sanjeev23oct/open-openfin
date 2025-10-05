# FDC3 Testing Guide

This guide shows how to test FDC3 messaging between two sample applications.

## What's Implemented

We have a minimal working implementation that includes:

1. **Two Sample Apps**:
   - **App 1 (Broadcaster)**: Sends FDC3 instrument contexts
   - **App 2 (Listener)**: Receives and displays FDC3 contexts

2. **FDC3 Features**:
   - Context broadcasting
   - Context listeners
   - User channels (Red, Blue)
   - Channel-based context isolation

## Running the Test

### Prerequisites

Make sure you have the dependencies installed:

```bash
npm install
```

### Launch the Test

Run the test launcher:

```bash
npm run test:fdc3
```

This will launch both sample applications side by side.

## Test Steps

1. **Join the Same Channel**:
   - In both App 1 and App 2, click "Join Red Channel"
   - Both apps should show they've joined the red channel

2. **Broadcast a Context**:
   - In App 1 (Broadcaster):
     - Enter a ticker symbol (e.g., "AAPL")
     - Enter a company name (e.g., "Apple Inc.")
     - Click "Broadcast Instrument"

3. **Verify Reception**:
   - App 2 (Listener) should immediately display the received context
   - You'll see the ticker, name, and timestamp

4. **Test Channel Isolation**:
   - In App 1, click "Join Blue Channel"
   - In App 2, stay on "Red Channel"
   - Try broadcasting from App 1
   - App 2 should NOT receive the context (different channels)

5. **Test Multiple Contexts**:
   - Join both apps to the same channel again
   - Broadcast different instruments from App 1
   - App 2 should display all received contexts in a list

## What's Happening Behind the Scenes

1. **Preload Script**: Exposes `window.fdc3` API to both apps
2. **IPC Communication**: Apps communicate with main process via IPC
3. **FDC3 Bus**: Main process routes contexts between apps on same channel
4. **Channel Isolation**: Contexts only delivered to apps on matching channels

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   App 1         │         │   App 2         │
│  (Broadcaster)  │         │   (Listener)    │
│                 │         │                 │
│  window.fdc3    │         │  window.fdc3    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ IPC                  IPC  │
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │  FDC3 Bus   │
              │ (Main Proc) │
              │             │
              │  Channels:  │
              │  - Red      │
              │  - Blue     │
              └─────────────┘
```

## Expected Behavior

✅ **Success Indicators**:
- Both apps show "FDC3 API available"
- Channel join shows success message
- Broadcast shows success message
- Listener displays received contexts with correct data
- Channel isolation works (no cross-channel messages)

❌ **Failure Indicators**:
- "FDC3 API not available" message
- Contexts not received in App 2
- Contexts received on wrong channel

## Limitations

This is a minimal test implementation. The full platform will include:
- WebSocket-based IAB (instead of IPC)
- Intent resolution with UI
- Private channels
- App channels
- Full security validation
- Multiple window support per app
- Workspace management

## Next Steps

After successful testing, we'll continue implementing:
- Full FDC3 service with IAB integration
- Window Manager
- Application Directory
- Platform Provider
- And more...
