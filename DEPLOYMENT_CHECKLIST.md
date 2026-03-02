# Deployment Fix Checklist

## ✅ Completed (Files Created/Updated)

### Configuration Files
- [x] [`backend/railway.json`](backend/railway.json) - Railway deployment config
- [x] [`backend/render.yaml`](backend/render.yaml) - Render deployment config  
- [x] [`backend/.env.example`](backend/.env.example) - Updated with production notes
- [x] [`vercel.json`](vercel.json) - Enhanced with PWA support & routing
- [x] [`.vercelignore`](.vercelignore) - Optimized Vercel build

### Documentation
- [x] [`DEPLOYMENT.md`](DEPLOYMENT.md) - Complete deployment guide
- [x] [`DEPLOYMENT_QUICKFIX.md`](DEPLOYMENT_QUICKFIX.md) - Quick fix instructions
- [x] [`README.md`](README.md) - Updated deployment section

## 🔧 Action Items for You

### 1. Fix Vercel Projects

#### Remove Backend from Vercel (if exists)
1. Go to https://vercel.com/dashboard
2. Find any project named "backend"
3. Settings → General → Delete Project

### 2. Configure Frontend Environment Variables in Vercel

Go to your frontend project in Vercel:
1. Settings → Environment Variables
2. Add for **Production, Preview, Development**:

```bash
# UPDATE THIS with your actual backend URL after Step 3
VITE_BACKEND_URL=http://localhost:8000

VITE_FIREBASE_API_KEY=AIzaSyDM0Io1HIDoF4ZtlX2u8CgTraXPTZ7qn0c
VITE_FIREBASE_APP_ID=1:784924647824:web:f277f62cde9903fdf65315
VITE_FIREBASE_AUTH_DOMAIN=gotcg-e7c8b.firebaseapp.com
VITE_FIREBASE_MEASUREMENT_ID=G-GT720E1EPR
VITE_FIREBASE_MESSAGING_SENDER_ID=784924647824
VITE_FIREBASE_PROJECT_ID=gotcg-e7c8b
VITE_FIREBASE_STORAGE_BUCKET=gotcg-e7c8b.firebasestorage.app
```

### 3. Deploy Backend to Railway (Recommended)

#### Option A: Railway (Easier, Recommended)

1. Visit https://railway.app
2. Sign up/Login → New Project → Deploy from GitHub
3. Select this repository
4. Configure:
   - **Service Name**: gotcg-backend
   - **Root Directory**: `backend`
   - Railway will auto-detect the Dockerfile

5. Add Environment Variables in Railway:
   ```bash
   NODE_ENV=production
   PORT=${{PORT}}
   MONGO_URI=your-mongodb-atlas-connection-string
   CLIENT_URL=https://your-vercel-url.vercel.app
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...your-firebase-json...}
   ```

6. Copy your Railway URL (e.g., `https://gotcg-backend-production.up.railway.app`)

7. Get Deploy Hook:
   - Settings → Deploy Trigger → Create
   - Copy webhook URL

#### Option B: Render

Follow instructions in [DEPLOYMENT.md](DEPLOYMENT.md#option-b-render)

### 4. Update Configuration

After deploying backend:

1. **Update Vercel frontend env:**
   - Change `VITE_BACKEND_URL` to your Railway/Render URL
   - Redeploy frontend

2. **Update Railway/Render backend env:**
   - Set `CLIENT_URL` to your Vercel frontend URL

3. **Update GitHub Secrets** (for auto-deploy):
   - Go to GitHub repo → Settings → Secrets and variables → Actions
   - Add/Update:
     - `BACKEND_DEPLOY_HOOK_URL` = Railway/Render webhook URL
     - `VERCEL_TOKEN` = From https://vercel.com/account/tokens
     - `VERCEL_ORG_ID` = From Vercel project settings
     - `VERCEL_PROJECT_ID_FRONTEND` = From Vercel project settings

### 5. Test & Verify

1. Visit your Vercel frontend URL
2. Open DevTools (F12) → Console & Network tabs
3. Try to login/play
4. Verify:
   - [ ] No CORS errors
   - [ ] API requests succeed
   - [ ] WebSocket connection establishes
   - [ ] Can authenticate
   - [ ] Can create/join games

## 🆘 Troubleshooting

### Deployment still failing?

**Frontend fails:**
- Check environment variables are set in Vercel
- Check build logs in Vercel dashboard
- Verify `vercel.json` is valid

**Backend connection fails:**
- Verify backend is running (visit `https://your-backend-url/health`)
- Check CORS settings in backend
- Ensure `CLIENT_URL` matches your Vercel URL exactly

**WebSocket fails:**
- Confirm backend is on Railway/Render (NOT Vercel)
- Check browser console for connection errors
- Verify Socket.io CORS configuration

## 📚 References

- [Complete Deployment Guide](DEPLOYMENT.md)
- [Quick Fix Guide](DEPLOYMENT_QUICKFIX.md)
- [Railway Documentation](https://docs.railway.app)
- [Vercel Documentation](https://vercel.com/docs)

## ✉️ Need Help?

If you're still stuck:
1. Check the deployment logs
2. Review error messages in browser console
3. Verify all environment variables are correct
4. Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

---

**Once complete, push this commit to trigger GitHub Actions auto-deployment! 🚀**
