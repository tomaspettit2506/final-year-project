import admin from 'firebase-admin';

function parseServiceAccount(): admin.ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!rawJson && !base64Json) {
    console.warn('No Firebase service account found (set FIREBASE_SERVICE_ACCOUNT_B64 or FIREBASE_SERVICE_ACCOUNT)');
    return null;
  }

  try {
    // Prioritize base64 version (recommended for production/Railway)
    if (base64Json) {
      const decoded = Buffer.from(base64Json, 'base64').toString('utf8');
      return JSON.parse(decoded) as admin.ServiceAccount;
    }

    // Fallback to raw JSON (for local development)
    if (rawJson) {
      return JSON.parse(rawJson) as admin.ServiceAccount;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse Firebase service account from environment variables', error);
    console.error('Hint: Use scripts/encode-service-account.js to generate a valid FIREBASE_SERVICE_ACCOUNT_B64');
    return null;
  }
}

export function initializeFirebase(): void {
  const serviceAccount = parseServiceAccount();

  if (!serviceAccount) {
    console.warn('⚠️  Firebase service account not configured - some features will be disabled');
    return;
  }

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('ℹ️  Firebase Admin already initialized');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
  }
}

export default initializeFirebase;
