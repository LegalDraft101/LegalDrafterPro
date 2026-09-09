import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';

const getServiceAccount = (): admin.ServiceAccount | null => {
  const projectId = env.FIREBASE_PROJECT_ID || undefined;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL || undefined;
  const privateKey = env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  const credPath = env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!credPath) return null;

  const resolvedPath = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
  if (!fs.existsSync(resolvedPath)) {
    return null;
  }

  try {
    const json = JSON.parse(fs.readFileSync(resolvedPath, 'utf8')) as admin.ServiceAccount;
    return json;
  } catch (error) {
    console.warn('Firebase Admin: invalid service account file. Falling back to default credentials.', error);
    return null;
  }
};

if (!admin.apps.length) {
  try {
    const serviceAccount = getServiceAccount();
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      admin.initializeApp();
    }
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
  }
}

export const firebaseAuth = admin.apps.length ? admin.auth() : null;
export const adminAuth = firebaseAuth;
export default firebaseAuth;
