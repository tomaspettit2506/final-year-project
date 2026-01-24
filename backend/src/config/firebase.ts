import admin from 'firebase-admin';

export function initializeFirebase(): void {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('Firebase service account not configured');
    return;
  }

  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}
