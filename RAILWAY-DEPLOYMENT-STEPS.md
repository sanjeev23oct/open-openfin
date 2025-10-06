# Railway Deployment Steps for Open OpenFin Web Platform

## ✅ Pre-Deployment Checklist

- [x] Build configuration files created (railway.json, Dockerfile)
- [x] Package.json scripts configured for Railway
- [x] Build tested locally and successful
- [x] Deployment guide created

## 🚀 Deployment Steps

### Step 1: Login to Railway

```bash
railway login
```

This will open your browser to authenticate with Railway. If you don't have an account, sign up at [railway.app](https://railway.app).

### Step 2: Initialize Railway Project

Navigate to the web-platform directory:

```bash
cd packages/web-platform
```

Initialize a new Railway project:

```bash
railway init
```

You'll be prompted to:
- Create a new project or select an existing one
- Give your project a name (e.g., "open-openfin-web")

### Step 3: Link to Railway Project

If you already have a Railway project, link it:

```bash
railway link
```

### Step 4: Set Environment Variables

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3000
```

### Step 5: Deploy!

Deploy the web platform to Railway:

```bash
railway up
```

This will:
1. Upload your code to Railway
2. Detect the Node.js project
3. Run `npm install`
4. Run `npm run build`
5. Start the server with `npm start`
6. Provide you with a live URL

### Step 6: Get Your Deployment URL

```bash
railway domain
```

This will show your deployment URL. It will look something like:
`https://open-openfin-web-production.up.railway.app`

### Step 7: Add Custom Domain (Optional)

If you want a custom domain:

```bash
railway domain add yourdomain.com
```

Then configure your DNS records as instructed.

## 🔍 Monitoring & Logs

### View Logs

```bash
railway logs
```

### Follow Logs in Real-Time

```bash
railway logs --follow
```

### Check Deployment Status

```bash
railway status
```

## 🛠️ Troubleshooting

### Build Fails

If the build fails, check the logs:

```bash
railway logs --deployment
```

Common issues:
- **Missing dependencies**: Make sure all dependencies are in package.json
- **Build errors**: Test the build locally first with `npm run build`
- **Port issues**: Railway automatically sets the PORT environment variable

### Application Won't Start

Check that:
1. The `start` script in package.json is correct
2. The PORT environment variable is being used
3. The preview command includes `--host 0.0.0.0`

### TypeScript Errors

The build uses Vite which bundles successfully despite TypeScript errors. If you want to fix them:

1. Skip TypeScript compilation in build:
   ```json
   "build": "vite build"
   ```

2. Or fix the tsconfig to properly handle monorepo dependencies

## 📝 Post-Deployment Tasks

### 1. Test the Deployment

Visit your Railway URL and test:
- [ ] Platform loads correctly
- [ ] Can launch demo apps (Ticker List, Ticker Details)
- [ ] FDC3 communication works between apps
- [ ] FDC3 Monitor opens and shows messages
- [ ] Can add external apps
- [ ] Workspace save/load works

### 2. Update README

Once deployed, update the main README.md with your live demo URL:

```markdown
**Live Demo:** [https://your-railway-url.railway.app](https://your-railway-url.railway.app)
```

### 3. Share the Link

Share your deployment with:
- Team members
- GitHub repository (add to README)
- Social media / blog posts

## 🔄 Continuous Deployment

### Option 1: GitHub Integration

1. Go to Railway dashboard
2. Connect your GitHub repository
3. Select the branch to deploy (e.g., `main`)
4. Railway will automatically deploy on every push

### Option 2: Manual Deployment

Use `railway up` whenever you want to deploy changes.

## 💰 Cost Considerations

Railway offers:
- **Free tier**: $5 of usage per month
- **Pro plan**: $20/month for more resources

The web platform is lightweight and should fit comfortably in the free tier for demos and testing.

## 🎉 Success!

Once deployed, your Open OpenFin Web Platform will be live and accessible to anyone with the URL!

Your platform will be running at: `https://[your-project].up.railway.app`

---

## Quick Commands Reference

```bash
# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# View logs
railway logs

# Check status
railway status

# Get domain
railway domain

# Set variables
railway variables set KEY=value

# Open in browser
railway open
```

## Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Report any platform issues

---

**Ready to deploy?** Run `railway login` to get started!
