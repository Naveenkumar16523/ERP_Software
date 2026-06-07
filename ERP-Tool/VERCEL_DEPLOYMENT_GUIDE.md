# Vercel Deployment Guide for ERP Frontend

This guide explains how to deploy the ERP frontend to Vercel.

## Important Note

**Vercel does NOT support Python backends.** This configuration deploys only the React frontend. The Python/FastAPI backend must be deployed separately to a platform that supports Python (e.g., Render, Railway, Fly.io, AWS, etc.).

## Prerequisites

- Vercel account (free tier available)
- GitHub account
- Backend deployed to a Python-compatible platform
- Backend API URL available

## Step 1: Deploy Backend First

Before deploying the frontend to Vercel, deploy your backend to a Python-compatible platform:

### Recommended Platforms for Python Backend:
- **Render.com** (Free tier available) - See `RENDER_DEPLOYMENT_GUIDE.md`
- **Railway.app** (Free tier available)
- **Fly.io** (Free tier available)
- **AWS Elastic Beanstalk**
- **Google Cloud Run**

### After Backend Deployment:
1. Note your backend API URL (e.g., `https://erp-backend.onrender.com`)
2. Ensure CORS is configured to allow your Vercel domain
3. Test that backend endpoints are accessible

## Step 2: Configure Frontend Environment Variables

In your Vercel project settings, add this environment variable:

```bash
VITE_API_URL=https://your-backend-url.com
```

**Example:**
```bash
VITE_API_URL=https://erp-backend.onrender.com
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the project root:
```bash
vercel
```

4. Follow the prompts:
   - Set project name
   - Confirm build settings (should auto-detect from vercel.json)
   - Add environment variables when prompted

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect settings from `vercel.json`
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/dist`
6. Add environment variable:
   - `VITE_API_URL` = your backend URL
7. Click "Deploy"

## Step 4: Update Frontend API Configuration

The frontend needs to use the production API URL instead of localhost proxies. Update your API calls to use the environment variable:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## Step 5: Test Deployment

1. Visit your Vercel deployment URL
2. Test login functionality
3. Verify API calls work with backend
4. Check all modules load correctly

## Troubleshooting

### Build Fails
- Check `vercel.json` exists in root
- Verify `frontend/package.json` has correct scripts
- Check build logs in Vercel dashboard

### API Connection Errors
- Verify `VITE_API_URL` is set in Vercel environment variables
- Check backend CORS settings allow your Vercel domain
- Ensure backend is running and accessible
- Test backend URL directly in browser

### 404 Errors
- Check `vercel.json` rewrites configuration
- Verify `outputDirectory` is correct (`frontend/dist`)
- Ensure build completed successfully

### Environment Variables Not Working
- Variables must start with `VITE_` to be available in frontend
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

## vercel.json Configuration

The `vercel.json` file configures:
- **Build Command**: Builds only the frontend
- **Output Directory**: Points to `frontend/dist`
- **Rewrites**: Handles client-side routing
- **Headers**: Adds security headers

## .vercelignore

The `.vercelignore` file excludes:
- Backend Python files
- Database files
- Development scripts
- Documentation
- Docker files

This reduces deployment size and speeds up builds.

## Production Considerations

### Security
- Enable HTTPS (automatic on Vercel)
- Set up authentication on backend
- Use environment variables for sensitive data
- Enable security headers (configured in vercel.json)

### Performance
- Vercel automatically optimizes static assets
- Consider enabling Vercel Analytics
- Set up custom domain for production

### Monitoring
- Enable Vercel logs
- Set up error tracking (Sentry, etc.)
- Monitor API response times

## Cost

- **Vercel Free Tier**: 
  - 100GB bandwidth/month
  - 6,000 minutes of build time/month
  - Unlimited projects
  - Automatic HTTPS
  - Global CDN

- **Backend Platform**: Depends on chosen platform (Render/Railway have free tiers)

## Next Steps

1. Deploy backend to Render/Railway
2. Get backend API URL
3. Deploy frontend to Vercel with `VITE_API_URL`
4. Test full application
5. Set up custom domain (optional)
6. Configure monitoring and analytics

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Render Deployment Guide: See `RENDER_DEPLOYMENT_GUIDE.md`
- Project Issues: Check GitHub repository
