import * as admin from 'firebase-admin';

try {
    if (!admin.apps.length) {
        // If GOOGLE_APPLICATION_CREDENTIALS is set, this works automatically.
        // Otherwise you may need to pass credential: admin.credential.cert(serviceAccount)
        admin.initializeApp();
    }
} catch (error) {
    console.warn('Firebase admin initialization failed. Please set GOOGLE_APPLICATION_CREDENTIALS or configure service account.', error);
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
