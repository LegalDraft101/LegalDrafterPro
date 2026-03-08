import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

try {
    if (!admin.apps.length) {
        const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
        if (credPath) {
            const resolved = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
            if (fs.existsSync(resolved)) {
                const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'));
                admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            } else {
                console.warn(`Firebase: service account file not found at ${resolved}. Falling back to default credentials.`);
                admin.initializeApp();
            }
        } else {
            admin.initializeApp();
        }
    }
} catch (error) {
    console.warn('Firebase admin initialization failed:', error);
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
