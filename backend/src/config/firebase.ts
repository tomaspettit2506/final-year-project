import admin from 'firebase-admin';

function parseServiceAccount(): admin.ServiceAccount | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_B64;

  if (!rawJson && !base64Json) return null;

  try {
    if (rawJson) {
      return JSON.parse(rawJson) as admin.ServiceAccount;
    }

    const decoded = Buffer.from(base64Json as string, 'base64').toString('utf8');
    return JSON.parse(decoded) as admin.ServiceAccount;
  } catch (error) {
    console.error('Failed to parse Firebase service account from environment variables', error);
    return null;
  }
}

export function initializeFirebase(): void {
  const serviceAccount = parseServiceAccount();

  if (!serviceAccount) {
    console.warn('Firebase service account not configured');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}
