import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID',
];

const missingVars = requiredVars.filter((key) => !import.meta.env[key]);
if (missingVars.length > 0) {
    console.error(
        `[Firebase] Missing required environment variables: ${missingVars.join(', ')}.\n` +
        'Please create a .env file in the project root with these variables set to your Firebase project values.\n' +
        'Restart the dev server after adding the .env file.'
    );
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
