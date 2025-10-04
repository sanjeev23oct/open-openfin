# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install and Run (1 minute)

```bash
# Clone the repository
git clone https://github.com/sanjeev23oct/open-openfin.git
cd open-openfin

# Install dependencies
npm install

# Create placeholder icons
node create-icons.js

# Start the platform
npm start
```

The platform launcher will open automatically!

### Step 2: Add Your First External App (2 minutes)

1. **Click "➕ Add App" button** in the top right

2. **Fill in the form:**
   - **Name:** Gmail
   - **URL:** https://mail.google.com
   - **App ID:** com.google.gmail
   - **Icon:** 📧
   - **Description:** Google Mail in a container
   - **Width:** 1200
   - **Height:** 800

3. **Click "Add Application"**

4. **Launch Gmail** by clicking on it in the Applications tab

That's it! Gmail is now running in a secure container! 🎉

### Step 3: Create Your First Workspace (2 minutes)

1. **Click "📁 New Workspace" button**

2. **Fill in the form:**
   - **Name:** My Workspace
   - **Description:** My daily apps

3. **Select apps** you want in the workspace:
   - ☑ Broadcaster
   - ☑ Listener
   - ☑ Gmail

4. **Click "Create Workspace"**

5. **Go to Workspaces tab** and click "Launch Workspace"

All three apps launch together! 🚀

## 📱 Popular Apps to Add

### Productivity

**Gmail**
- URL: https://mail.google.com
- ID: com.google.gmail
- Icon: 📧

**Google Calendar**
- URL: https://calendar.google.com
- ID: com.google.calendar
- Icon: 📅

**Google Drive**
- URL: https://drive.google.com
- ID: com.google.drive
- Icon: 📁

**Notion**
- URL: https://notion.so
- ID: com.notion.app
- Icon: 📝

### Communication

**Slack**
- URL: https://app.slack.com
- ID: com.slack.app
- Icon: 💬

**Microsoft Teams**
- URL: https://teams.microsoft.com
- ID: com.microsoft.teams
- Icon: 👥

**Discord**
- URL: https://discord.com/app
- ID: com.discord.app
- Icon: 🎮

### Project Management

**Trello**
- URL: https://trello.com
- ID: com.trello.app
- Icon: 📋

**Asana**
- URL: https://app.asana.com
- ID: com.asana.app
- Icon: ✅

**Jira**
- URL: https://your-domain.atlassian.net
- ID: com.atlassian.jira
- Icon: 🎯

## 🎯 Common Workflows

### Workflow 1: Trading Workspace

**Apps:**
- Market Data Dashboard
- Trading Platform
- News Feed
- Chat/Communication

**Setup:**
1. Add each app via "Add App" button
2. Create workspace "Trading"
3. Select all trading apps
4. Launch workspace daily

### Workflow 2: Development Workspace

**Apps:**
- GitHub
- Jira
- Slack
- Documentation

**Setup:**
1. Add development tools
2. Create workspace "Development"
3. Launch when starting work

### Workflow 3: Communication Hub

**Apps:**
- Gmail
- Slack
- Teams
- Calendar

**Setup:**
1. Add communication apps
2. Create workspace "Communication"
3. Keep running all day

## 🔧 Tips & Tricks

### Tip 1: Use Emojis for Icons
Make apps easy to identify:
- 📧 Email apps
- 💬 Chat apps
- 📊 Analytics
- 🎯 Project management
- 📝 Note-taking

### Tip 2: Organize with Workspaces
Create workspaces for different contexts:
- "Morning Routine" - Email, Calendar, News
- "Deep Work" - Focus apps only
- "Meetings" - Video, Chat, Calendar

### Tip 3: Window Sizes
Choose appropriate sizes:
- Email: 1200x800
- Chat: 1000x700
- Full apps: 1400x900
- Tools: 800x600

### Tip 4: Use Descriptive Names
Good names help you find apps:
- ✅ "Gmail - Personal"
- ✅ "Gmail - Work"
- ❌ "Mail"
- ❌ "App1"

## 🎨 Customization

### Custom App Icons
Use any emoji:
```
📧 📅 📁 📝 💬 👥 🎮 📋 ✅ 🎯
📊 📈 📉 💰 🏦 🏢 🏭 🏗️ 🚀 ⚡
```

### Window Positions
Set default positions:
- Left monitor: x=0
- Right monitor: x=1920 (for 1920px wide monitor)
- Center: Calculate based on screen size

### Permissions
Control what apps can do:
- `clipboard`: Copy/paste
- `notifications`: Show notifications
- `launchExternalProcess`: Open other apps

## 🐛 Troubleshooting

### App Won't Load

**Problem:** White screen or error

**Solutions:**
1. Check URL is correct
2. Try opening URL in browser first
3. Some sites block iframe embedding
4. Check browser console for errors

### Icons Not Showing

**Problem:** Missing tray icon error

**Solution:**
```bash
node create-icons.js
```

### App Not in Launcher

**Problem:** Added app doesn't appear

**Solution:**
1. Refresh the launcher (close and reopen)
2. Check localStorage in DevTools
3. Re-add the app

### Workspace Won't Launch

**Problem:** Workspace doesn't start apps

**Solution:**
1. Check all apps exist
2. Try launching apps individually first
3. Check console for errors

## 📚 Learn More

- **[Adding Apps Guide](docs/ADDING-APPS.md)** - Detailed app configuration
- **[OpenFin Compatibility](docs/OPENFIN-COMPATIBILITY.md)** - Migration guide
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Workspace Management](workspaces/README.md)** - Advanced workspaces

## 🎉 You're Ready!

You now know how to:
- ✅ Add external apps via UI
- ✅ Create workspaces
- ✅ Launch apps and workspaces
- ✅ Customize your setup

**Start building your perfect desktop environment!** 🚀

## 💡 Pro Tips

1. **Start Small:** Add 3-5 essential apps first
2. **Create Workspaces:** Group related apps together
3. **Use Shortcuts:** Learn keyboard shortcuts for efficiency
4. **Experiment:** Try different layouts and configurations
5. **Share:** Export workspace configs to share with team

## 🤝 Need Help?

- **Issues:** https://github.com/sanjeev23oct/open-openfin/issues
- **Discussions:** https://github.com/sanjeev23oct/open-openfin/discussions
- **Documentation:** https://github.com/sanjeev23oct/open-openfin/tree/main/docs

Happy containerizing! 🎊
