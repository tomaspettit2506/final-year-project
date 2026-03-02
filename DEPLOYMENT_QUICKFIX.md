# Quick Fix for Vercel Deployment Failures

## Problem
You're seeing deployment failures for both "backend" and "final-year-project" (frontend) on Vercel.

## Root Cause
1. **Backend should NOT be on Vercel** - The Express + Socket.io backend requires persistent connections, which Vercel's serverless platform doesn't support.
2. **Frontend missing environment variables** - Production environment variables aren't configured in Vercel.

## Immediate Actions

### Step 1: Remove Backend from Vercel (if exists)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the "backend" project
3. Settings → General → Delete Project

### Step 2: Configure Frontend Environment Variables in Vercel
1. Go to your frontend project in Vercel Dashboard
2. Settings → Environment Variables
3. Add these variables for **Production, Preview, and Development**:

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

> ⚠️ **Important**: Replace `https://your-backend-url.railway.app` with your actual backend URL after deploying to Railway/Render.

### Step 3: Deploy Backend to Railway or Render

#### Quick Railway Setup:
1. Visit [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select this repository
4. Root Directory: `backend`
5. Add environment variables:
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   MONGO_URI=your-mongodb-connection-string
   CLIENT_URL=https://your-vercel-frontend-url.vercel.app
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```
6. Copy the Railway URL → Update `VITE_BACKEND_URL` in Vercel

### Step 4: Redeploy Frontend
1. In Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger auto-deploy

## Verification

After setup, check:
- ✅ Frontend deploys successfully on Vercel
- ✅ Backend runs on Railway/Render (visit `/health` endpoint)
- ✅ Frontend can connect to backend (check browser console)
- ✅ No CORS errors

## Need More Help?

See the full deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
