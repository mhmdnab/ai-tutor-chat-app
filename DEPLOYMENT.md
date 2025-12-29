# Deployment Guide

## Deploying to Vercel

The 404 error you're experiencing is likely due to incorrect deployment settings. Follow these steps:

### Option 1: Deploy discord-app subdirectory (Recommended)

1. **Import your repository** to Vercel
2. **Configure the Root Directory**:
   - In Vercel project settings
   - Set **Root Directory** to: `discord-app`
   - This tells Vercel where your Next.js app is located

3. **Build Settings** (these should auto-detect, but verify):
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. **Environment Variables** (if needed):
   - Add any environment variables your app needs
   - For Matrix homeserver URL, etc.

5. **Deploy**

### Option 2: Deploy from repository root

If you want to deploy from the root directory:

1. Create a `vercel.json` in the **root** directory:
```json
{
  "buildCommand": "cd discord-app && npm install && npm run build",
  "devCommand": "cd discord-app && npm run dev",
  "installCommand": "cd discord-app && npm install",
  "outputDirectory": "discord-app/.next"
}
```

2. Or use Vercel CLI:
```bash
cd discord-app
vercel
```

### Troubleshooting 404 Errors

If you still get 404 after deployment:

1. **Check Build Logs**:
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the deployment → View Build Logs
   - Look for any errors during build

2. **Verify Root Directory**:
   - Settings → General → Root Directory
   - Should be `discord-app` (not `/discord-app` or `./discord-app`)

3. **Check Build Output**:
   - The build should show: "Route (app)"
   - You should see routes like `/`, `/chat`, etc.

4. **Clear Build Cache**:
   - In deployment settings
   - Try "Redeploy" with "Clear build cache" option

5. **Local Test**:
```bash
cd discord-app
npm run build
npm start
```
   - If this works locally, the issue is deployment config

### Common Issues

**Issue**: 404 on all routes
- **Cause**: Wrong root directory setting
- **Fix**: Set root directory to `discord-app`

**Issue**: Build succeeds but pages don't work
- **Cause**: Output directory misconfigured
- **Fix**: Ensure output directory is `.next`

**Issue**: "Module not found" errors
- **Cause**: Dependencies not installed in correct directory
- **Fix**: Ensure install command runs in `discord-app` folder

### Vercel CLI Deployment (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to the app
cd discord-app

# Deploy
vercel

# Follow prompts to link/create project
# Vercel will auto-detect Next.js and configure correctly
```

### After Successful Deployment

Once deployed, your app will be at:
- `https://your-project.vercel.app/` - Home/Login page
- `https://your-project.vercel.app/chat` - Chat interface

### Need Help?

If you're still seeing 404:
1. Share your build logs
2. Confirm your Root Directory setting
3. Verify the build command output shows your routes
