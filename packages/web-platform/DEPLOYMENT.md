# Web Platform Deployment Guide

## Railway Deployment

### Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Code must be in a GitHub repository
3. **Node.js 18+**: Ensure compatibility

### Deployment Steps

#### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

#### Option 2: Manual Deployment

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   ```

2. **Configure Environment**
   ```bash
   # Set environment variables
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   ```

3. **Deploy**
   ```bash
   # Deploy from current directory
   railway up
   
   # Or connect GitHub repo
   railway connect
   ```

### Configuration Files

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `package.json` Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0 --port $PORT",
    "start": "npm run preview"
  }
}
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3000` |
| `VITE_APP_TITLE` | Application title | `Open OpenFin Web Platform` |
| `VITE_API_BASE_URL` | API base URL | `/` |

### Build Process

1. **Install Dependencies**: `npm ci --only=production`
2. **TypeScript Compilation**: `tsc`
3. **Vite Build**: `vite build`
4. **Static File Generation**: Creates `dist/` folder
5. **Preview Server**: Serves built files

### Custom Domain

1. **Add Domain in Railway**
   - Go to your project settings
   - Add custom domain
   - Configure DNS records

2. **SSL Certificate**
   - Automatically provided by Railway
   - HTTPS enforced by default

### Monitoring

#### Health Checks
- **Endpoint**: `/`
- **Timeout**: 100 seconds
- **Restart Policy**: On failure (max 10 retries)

#### Logs
```bash
# View deployment logs
railway logs

# Follow logs in real-time
railway logs --follow
```

### Performance Optimization

#### Build Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js']
        }
      }
    },
    minify: 'terser',
    sourcemap: false
  }
});
```

#### Caching Headers
```typescript
// Add to vite.config.ts
export default defineConfig({
  preview: {
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
});
```

### Security Configuration

#### Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; 
               style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https:;">
```

#### HTTPS Redirect
```typescript
// Add to main.ts
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

### Troubleshooting

#### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   railway logs --deployment
   
   # Test build locally
   npm run build
   npm run preview
   ```

2. **Port Issues**
   ```bash
   # Ensure PORT variable is set
   railway variables set PORT=3000
   ```

3. **Memory Issues**
   ```bash
   # Increase memory limit
   railway variables set NODE_OPTIONS="--max-old-space-size=4096"
   ```

#### Debug Mode
```bash
# Enable debug logging
railway variables set DEBUG="vite:*"
railway variables set VITE_DEBUG=true
```

### Alternative Deployment Options

#### Vercel
```json
// vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "buildCommand": "npm run build",
        "outputDirectory": "dist"
      }
    }
  ]
}
```

#### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE $PORT
CMD ["npm", "start"]
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]
    paths: ['packages/web-platform/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: railway/cli@v2
        with:
          command: up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### Post-Deployment

1. **Test Functionality**
   - Open deployed URL
   - Test app launcher
   - Verify FDC3 communication
   - Check FDC3 Monitor

2. **Update Documentation**
   - Add live demo link to README
   - Update deployment status
   - Share with team

3. **Monitor Performance**
   - Check Railway metrics
   - Monitor error rates
   - Review user feedback

### Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: Report deployment issues

---

**Live Demo**: [https://open-openfin-web.railway.app](https://open-openfin-web.railway.app) *(Coming Soon)*
