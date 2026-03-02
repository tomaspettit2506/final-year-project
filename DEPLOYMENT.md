# Deployment Guide

This guide explains how to deploy the Guardians of the Chess Grandmaster application to production.

## Architecture Overview

- **Frontend**: React + TypeScript PWA deployed to **Vercel**
- **Backend**: Express + Socket.io server deployed to **Railway/Render** (requires WebSocket support)
- **Database**: MongoDB Atlas + Firebase (Firestore & Auth)

> ⚠️ **Important**: The backend CANNOT be deployed to Vercel because it uses Express + Socket.io with persistent WebSocket connections, which are incompatible with Vercel's serverless architecture.

## Prerequisites

1. [Vercel Account](https://vercel.com) (for frontend)
2. [Railway](https://railway.app) OR [Render](https://render.com) account (for backend)
3. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster
4. [Firebase Project](https://console.firebase.google.com) with service account credentials

## Frontend Deployment (Vercel)

### Option 1: Vercel CLI (Recommended for first deployment)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

3. Login to Vercel:
   ```bash
   vercel login
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

5. Set environment variables in Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add the following variables (for Production, Preview, and Development):

   ```
   VITE_BACKEND_URL=https://your-backend-url.railway.app
   VITE_FIREBASE_API_KEY=AIzaSyDM0Io1HIDoF4ZtlX2u8CgTraXPTZ7qn0c
   VITE_FIREBASE_APP_ID=1:784924647824:web:f277f62cde9903fdf65315
   VITE_FIREBASE_AUTH_DOMAIN=gotcg-e7c8b.firebaseapp.com
   VITE_FIREBASE_MEASUREMENT_ID=G-GT720E1EPR
   VITE_FIREBASE_MESSAGING_SENDER_ID=784924647824
   VITE_FIREBASE_PROJECT_ID=gotcg-e7c8b
   VITE_FIREBASE_STORAGE_BUCKET=gotcg-e7c8b.firebasestorage.app
   ```

### Option 2: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (same as above)
5. Deploy

### GitHub Actions Auto-Deployment

The repository is configured to auto-deploy on every push to `main`. To set this up:

1. Get your Vercel credentials:
   ```bash
   # In project root
   vercel
   # Follow prompts, then get project info:
   cat .vercel/project.json
   ```

2. Add GitHub secrets (Settings → Secrets and variables → Actions):
   - `VERCEL_TOKEN`: Get from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID`: From `.vercel/project.json`
   - `VERCEL_PROJECT_ID_FRONTEND`: From `.vercel/project.json`

## Backend Deployment

### Option A: Railway (Recommended)

Railway offers excellent support for Node.js + WebSocket applications with a generous free tier.

#### Initial Setup

1. Go to [railway.app](https://railway.app) and sign up/login
2. Create a new project → "Deploy from GitHub repo"
3. Select your repository
4. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm run build`
   - **Start Command**: `node dist/index.js`

#### Environment Variables

Add in Railway Dashboard → Variables:

```
NODE_ENV=production
PORT=${{PORT}}
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/gotcg?retryWrites=true&w=majority
CLIENT_URL=https://your-frontend-url.vercel.app
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"..."}
```

> 💡 **Tip**: Railway automatically provides `${{PORT}}` variable. Use it.

#### Auto-Deploy Hook

1. In Railway project → Settings → Deploy Trigger
2. Copy the webhook URL
3. Add to GitHub Secrets as `BACKEND_DEPLOY_HOOK_URL`

### Option B: Render

1. Go to [render.com](https://render.com) and create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: gotcg-backend
   - **Root Directory**: `backend`
   - **Runtime**: Docker (will use `Dockerfile`)
   - **Instance Type**: Free

4. Add environment variables (same as Railway above)

5. Get the deploy hook:
   - Settings → Deploy Hook → Create
   - Add to GitHub Secrets as `BACKEND_DEPLOY_HOOK_URL`

### Health Check Endpoint

Both platforms support health checks. The backend exposes:
- **Endpoint**: `/health`
- **Response**: `{"status":"ok","timestamp":"2026-03-02T..."}`

Configure health checks:
- **Railway**: Automatically detected
- **Render**: Settings → Health Check Path → `/health`

## Database Setup (MongoDB Atlas)

1. Create cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create database user
3. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
4. Get connection string → Add to backend `MONGO_URI`

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (gotcg-e7c8b)
3. Create service account:
   - Project Settings → Service Accounts
   - Generate new private key
   - Copy the JSON content to `FIREBASE_SERVICE_ACCOUNT` in backend

## Post-Deployment Checklist

### Frontend (Vercel)
- [ ] Environment variables are set
- [ ] `VITE_BACKEND_URL` points to your Railway/Render backend URL
- [ ] Deployment successful (check Vercel dashboard)
- [ ] PWA installs correctly on mobile

### Backend (Railway/Render)
- [ ] Environment variables are set
- [ ] `CLIENT_URL` points to your Vercel frontend URL
- [ ] Health check endpoint responding
- [ ] WebSocket connections working
- [ ] Database connection successful

### Cross-Origin Configuration
- [ ] Backend CORS allows frontend domain
- [ ] Frontend can connect to backend API
- [ ] Socket.io connections established

## Testing Production Deployment

1. Visit your Vercel frontend URL
2. Open browser DevTools → Network tab
3. Try to login/register
4. Check for:
   - ✅ API calls to backend succeed
   - ✅ WebSocket connection established (look for `ws://` or `wss://`)
   - ✅ No CORS errors
   - ✅ Firebase auth working

## Troubleshooting

### "Failed to fetch" or CORS errors
- Verify `CLIENT_URL` in backend includes your Vercel URL
- Check backend CORS configuration in `backend/src/index.ts`

### WebSocket connection failed
- Ensure backend is on Railway/Render (NOT Vercel)
- Check if backend is running (visit `/health` endpoint)

### Firebase auth not working
- Verify all `VITE_FIREBASE_*` variables in Vercel
- Check Firebase project settings match

### Backend deployment fails on Vercel
- **This is expected!** Backend must be deployed to Railway/Render
- Delete the "backend" project from Vercel dashboard if it exists

## Monitoring

### Vercel
- Dashboard → Your Project → Deployments
- Check build logs and runtime logs

### Railway
- Dashboard → Your Project → Deployments
- View deployment logs and metrics

### Render
- Dashboard → Your Service → Logs
- Monitor memory/CPU usage

## Cost Breakdown

### Free Tier Limits
- **Vercel**: Unlimited deployments, 100GB bandwidth/month
- **Railway**: $5 credit/month (enough for hobby projects)
- **Render**: 750 hours/month free tier
- **MongoDB Atlas**: 512MB storage free
- **Firebase**: Generous free tier for auth/Firestore

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)
- [GitHub Actions Workflow](.github/workflows/frontend_and_backend-deploy.yml)
