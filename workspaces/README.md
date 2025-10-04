# Sample Workspace

This directory contains workspace configurations for the Desktop Interoperability Platform.

## Sample Workspace

**File:** `sample-workspace.json`

### Description
A demonstration workspace that launches two FDC3-enabled sample applications side-by-side to showcase context sharing and intent resolution.

### Applications Included

1. **Sample App 1 - Broadcaster**
   - Broadcasts FDC3 instrument context
   - Handles ViewChart and ViewNews intents
   - Allows joining user channels (red, blue, green)
   - Position: Left side (100, 100)

2. **Sample App 2 - Listener**
   - Listens for FDC3 instrument context
   - Raises ViewChart and ViewNews intents
   - Supports channel switching
   - Handles ViewNews intent
   - Position: Right side (850, 100)

### Layout
The workspace uses a side-by-side layout with both applications positioned to be visible simultaneously:
- Sample App 1: 700x500 at (100, 100)
- Sample App 2: 700x500 at (850, 100)

### Usage

#### Loading the Workspace
```javascript
// Using Platform Provider API
const workspace = await fin.Platform.getCurrentSync()
  .getWorkspaceManager()
  .getWorkspace('sample-workspace-1');

await workspace.launch();
```

#### Testing FDC3 Workflows

1. **Context Broadcasting:**
   - In Sample App 1, join a channel (e.g., Red)
   - In Sample App 2, join the same channel
   - In Sample App 1, enter a ticker symbol and broadcast
   - Sample App 2 should receive the context

2. **Intent Resolution:**
   - In Sample App 2, receive a context first
   - Click "Raise ViewChart Intent" or "Raise ViewNews Intent"
   - The platform should resolve the intent to Sample App 1
   - Sample App 1 should receive and handle the intent

3. **Channel Switching:**
   - Both apps can switch between red, blue, and green channels
   - Context is only shared between apps on the same channel
   - Apps can leave channels to stop receiving context

### Workspace Configuration Schema

```json
{
  "id": "string (unique workspace identifier)",
  "name": "string (display name)",
  "description": "string (workspace description)",
  "version": "string (semantic version)",
  "applications": [
    {
      "appId": "string (application identifier)",
      "manifestUrl": "string (path to manifest)",
      "autoLaunch": "boolean (launch on workspace load)",
      "windowOptions": {
        "defaultLeft": "number",
        "defaultTop": "number",
        "defaultWidth": "number",
        "defaultHeight": "number"
      }
    }
  ],
  "layout": {
    "type": "string (layout type)",
    "windows": [
      {
        "appId": "string",
        "bounds": {
          "x": "number",
          "y": "number",
          "width": "number",
          "height": "number"
        },
        "state": "string (normal|minimized|maximized)"
      }
    ]
  },
  "channels": {
    "default": "string (default channel to join)"
  },
  "metadata": {
    "created": "string (ISO date)",
    "author": "string",
    "tags": ["string"]
  }
}
```

## Creating Custom Workspaces

To create your own workspace:

1. Create a new JSON file in this directory
2. Follow the schema above
3. Define your applications and layout
4. Load the workspace using the Platform Provider API

### Example: Custom Workspace

```json
{
  "id": "my-custom-workspace",
  "name": "My Custom Workspace",
  "description": "A custom workspace for my applications",
  "version": "1.0.0",
  "applications": [
    {
      "appId": "my-app-1",
      "manifestUrl": "https://example.com/manifests/app1.json",
      "autoLaunch": true
    },
    {
      "appId": "my-app-2",
      "manifestUrl": "https://example.com/manifests/app2.json",
      "autoLaunch": true
    }
  ],
  "layout": {
    "type": "grid",
    "windows": [
      {
        "appId": "my-app-1",
        "bounds": { "x": 0, "y": 0, "width": 800, "height": 600 },
        "state": "normal"
      },
      {
        "appId": "my-app-2",
        "bounds": { "x": 800, "y": 0, "width": 800, "height": 600 },
        "state": "normal"
      }
    ]
  }
}
```

## Workspace Management

### Saving Current State
```javascript
const workspace = await fin.Platform.getCurrentSync()
  .getWorkspaceManager()
  .getWorkspace('sample-workspace-1');

await workspace.save();
```

### Listing Workspaces
```javascript
const workspaces = await fin.Platform.getCurrentSync()
  .getWorkspaceManager()
  .listWorkspaces();

console.log('Available workspaces:', workspaces);
```

### Creating New Workspace
```javascript
const newWorkspace = await fin.Platform.getCurrentSync()
  .getWorkspaceManager()
  .createWorkspace({
    id: 'new-workspace',
    name: 'New Workspace',
    applications: [...]
  });
```

## Best Practices

1. **Unique IDs:** Always use unique workspace IDs
2. **Window Positioning:** Consider multi-monitor setups
3. **Auto-Launch:** Only auto-launch essential applications
4. **Layout Types:** Choose appropriate layout types (side-by-side, grid, stacked)
5. **Metadata:** Include descriptive metadata for workspace discovery
6. **Version Control:** Use semantic versioning for workspace configurations
