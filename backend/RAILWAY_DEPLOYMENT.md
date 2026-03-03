# Railway Deployment Guide

## Fixing "Invalid env var definition" Error

Railway has trouble with environment variables containing JSON strings with newlines and escaped characters (especially Firebase service accounts). Follow these steps to fix the deployment:

### Step 1: Encode Your Firebase Service Account

Use the provided script to encode your Firebase service account JSON to base64:

```bash
# If you have the service account JSON file
node scripts/encode-service-account.js path/to/your-service-account.json

# Or pipe the JSON content directly
cat service-account.json | node scripts/encode-service-account.js
```

This will output a base64-encoded string.

### Step 2: Set Environment Variables in Railway

Go to your Railway project dashboard and set these environment variables:

**Required:**
- `FIREBASE_SERVICE_ACCOUNT_B64` - The base64 string from Step 1
- `MONGO_URI` - Your MongoDB connection string
- `CLIENT_URL` - Your frontend URL (e.g., `https://your-app.vercel.app`)
- `PORT` - `8080` (or your preferred port)
- `NODE_ENV` - `production`

**Remove or don't set:**
- `FIREBASE_SERVICE_ACCOUNT` - Not needed when using the base64 version

### Step 3: Redeploy

After setting the environment variables, redeploy your application. The healthcheck should now pass.

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `PORT` | Yes | Server port | `8080` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `https://app.vercel.app` |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Yes | Base64-encoded Firebase service account | (base64 string) |

## Healthcheck

The application exposes a `/health` endpoint that Railway uses for healthchecks. Make sure your application can start successfully before the healthcheck timeout (100 seconds).

## Troubleshooting

### Healthcheck Still Failing?

1. Check Railway logs for startup errors
2. Verify all required environment variables are set
3. Ensure MongoDB is accessible from Railway
4. Verify the base64-encoded Firebase service account is valid:
   ```bash
   # Decode to verify (run locally)
   echo "YOUR_BASE64_STRING" | base64 -d | jq
   ```

### Can't Connect to MongoDB?

Make sure your MongoDB cluster allows connections from Railway. You may need to:
- Add Railway's IP addresses to your MongoDB allowlist
- Or allow connections from anywhere (`0.0.0.0/0`) for development

### CORS Errors?

Ensure `CLIENT_URL` matches your actual frontend URL exactly (including protocol: `https://` not `http://`).
