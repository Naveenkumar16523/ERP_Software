# Render Deployment Guide for ERP Backend

This guide explains how to deploy the ERP backend to Render.com.

## Prerequisites

- Render account (free tier available)
- GitHub account
- Backend code pushed to GitHub repository

## Step 1: Prepare Your Repository

### 1.1 Ensure Backend Structure
```
backend/
├── app/
│   ├── main.py
│   ├── models/
│   ├── routers/
│   └── utils/
├── requirements.txt
├── render.yaml
├── .env.example
└── .gitignore
```

### 1.2 Update .gitignore
Ensure `.env` and `venv/` are in `.gitignore`:
```
.env
venv/
__pycache__/
*.pyc
erp.db
```

### 1.3 Push to GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Deploy to Render

### 2.1 Create New Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `backend` folder or root directory
5. Configure the service:
   - **Name**: erp-backend
   - **Region**: Choose nearest region
   - **Branch**: main
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.2 Add PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: erp-database
   - **Database Name**: erp_db
   - **User**: erp_user
   - **Plan**: Free (or paid for production)

### 2.3 Add Redis (Optional)
1. Click "New +" → "Redis"
2. Configure:
   - **Name**: erp-redis
   - **Plan**: Free

### 2.4 Configure Environment Variables
In your web service settings, add these environment variables:

```bash
DATABASE_URL=postgresql://erp_user:password@erp-database:5432/erp_db
REDIS_URL=redis://erp-redis:6379
NODE_ENV=production
SECRET_KEY=your-generated-secret-key
CORS_ORIGINS=https://your-frontend-domain.com
```

**Important**: For DATABASE_URL, use Render's database connection string from the PostgreSQL service page.

## Step 3: Alternative: Use render.yaml (Recommended)

If you have `render.yaml` in your repository:

1. Go to Render dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the `render.yaml` file
5. Click "Apply Blueprint"

This will automatically create all services (web, database, Redis) with the configuration specified.

## Step 4: Using TiDB Cloud Instead of Render PostgreSQL

If you want to use your existing TiDB Cloud database:

1. **Skip** creating a PostgreSQL database on Render
2. In environment variables, set:
   ```bash
   DATABASE_URL=mysql+pymysql://your-tidb-connection-string
   ```
3. Use your TiDB Cloud connection string from the TiDB dashboard

## Step 5: Update Frontend Configuration

After deployment, update your frontend to use the new backend URL:

```javascript
// In frontend API calls
const API_BASE_URL = 'https://erp-backend.onrender.com/api/v1';
```

## Step 6: Seed Production Database

After deployment, seed the production database:

1. SSH into the Render service (optional) or use Render Shell
2. Run the seed script:
   ```bash
   python seed_logistics_data.py
   ```

Or add a startup script to automatically seed on first deployment.

## Step 7: Monitor Deployment

- Check Render dashboard for deployment logs
- Monitor service health
- Set up error tracking (optional)

## Troubleshooting

### Build Fails
- Check requirements.txt has all dependencies
- Ensure Python version compatibility (3.11+)
- Review build logs in Render dashboard

### Database Connection Issues
- Verify DATABASE_URL format
- Check database service is running
- Ensure environment variables are set correctly

### CORS Errors
- Update CORS_ORIGINS with your frontend domain
- Include both http and https if needed

### Port Issues
- Render automatically sets $PORT environment variable
- Ensure start command uses $PORT

## Cost Considerations

- **Free Tier**: Limited resources, spins down after inactivity
- **Paid Tier**: Always available, better performance
- **Database**: Free PostgreSQL has limitations, consider paid for production

## Security Best Practices

1. Never commit `.env` file
2. Use Render's generated secrets for sensitive data
3. Enable HTTPS (automatic on Render)
4. Set up authentication for your API
5. Use environment variables for all configuration

## Post-Deployment Checklist

- [ ] Backend service is running
- [ ] Database connection successful
- [ ] API endpoints are accessible
- [ ] Frontend can connect to backend
- [ ] Authentication is working
- [ ] Data is seeded correctly
- [ ] Error monitoring is set up
- [ ] CORS is configured properly

## Support

- Render Documentation: [docs.render.com](https://docs.render.com)
- FastAPI Documentation: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
- Project Issues: Check GitHub repository issues
