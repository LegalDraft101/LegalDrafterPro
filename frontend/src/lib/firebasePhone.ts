import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, type Auth, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getOrCreateRecaptchaVerifier(containerId: string = 'firebase-phone-recaptcha-container') {
  if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || !import.meta.env.VITE_FIREBASE_PROJECT_ID || !import.meta.env.VITE_FIREBASE_APP_ID) {
    throw new Error('Firebase phone authentication is not configured.');
  }

  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => undefined,
      'expired-callback': () => undefined,
    });
  }

  return recaptchaVerifier;
}

export async function sendOtp(phoneNumber: string): Promise<ConfirmationResult> {
  const value = phoneNumber.trim();
  if (!/^\+[1-9]\d{7,14}$/.test(value)) {
    throw new Error('Enter a valid phone number in E.164 format.');
  }

  const verifier = getOrCreateRecaptchaVerifier();
  try {
    return await signInWithPhoneNumber(auth, value, verifier);
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/invalid-phone-number') {
      throw new Error('The phone number is invalid.');
    }
    if (code === 'auth/quota-exceeded' || code === 'auth/too-many-requests') {
      throw new Error('Too many OTP requests. Please try again later.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error while sending the OTP.');
    }
    if (code === 'captcha-check-failed' || code === 'auth/captcha-check-failed' || code === 'auth/invalid-app-credential') {
      throw new Error('reCAPTCHA failed. Please refresh and try again.');
    }
    throw new Error('Unable to send the OTP right now.');
  }
}

export async function verifyOtp(confirmationResult: ConfirmationResult, otp: string) {
  const value = otp.trim();
  if (!value) {
    throw new Error('Enter the OTP sent to your phone number.');
  }

  try {
    const result = await confirmationResult.confirm(value);
    const idToken = await result.user.getIdToken();
    return { user: result.user, idToken };
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/invalid-verification-code' || code === 'auth/code-expired') {
      throw new Error('The OTP is invalid or expired.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error while verifying the OTP.');
    }
    throw new Error('Unable to verify the OTP.');
  }
}

export function clearRecaptchaVerifier() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}
