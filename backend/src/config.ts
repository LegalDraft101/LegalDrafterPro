/**
 * Config: env loading/validation and CORS. No secrets in logs.
 */

import { config } from 'dotenv';
import type { CorsOptions } from 'cors';

config();

const get = (key: string, defaultValue?: string): string => {
  const v = process.env[key] ?? defaultValue;
  if (v === undefined) throw new Error(`Missing env: ${key}`);
  return v as string;
};

const getNum = (key: string, defaultValue: number): number => {
  const v = process.env[key];
  if (v === undefined || v === '') return defaultValue;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return defaultValue;
  return n;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: getNum('PORT', 4000),
  ORIGIN: get('ORIGIN', 'http://localhost:5173'),
  JWT_SECRET: get('JWT_SECRET', 'dev-secret-change-in-production'),
  ACCESS_TOKEN_TTL_DAYS: getNum('ACCESS_TOKEN_TTL_DAYS', 10),
  REFRESH_TOKEN_TTL_DAYS: getNum('REFRESH_TOKEN_TTL_DAYS', 7),
  OTP_CODE_LENGTH: getNum('OTP_CODE_LENGTH', 6),
  OTP_TTL_SECONDS: getNum('OTP_TTL_SECONDS', 300),
  OTP_MAX_PER_HOUR: getNum('OTP_MAX_PER_HOUR', 5),
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ?? '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ?? '',
  GMAIL_REDIRECT_URI: process.env.GMAIL_REDIRECT_URI ?? '',
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN ?? '',
  GMAIL_SENDER: process.env.GMAIL_SENDER ?? 'noreply@example.com',
  SMS_PROVIDER: process.env.SMS_PROVIDER ?? 'console',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ?? '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ?? '',
  TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER ?? '',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? '',
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL ?? `${process.env.ORIGIN ?? 'http://localhost:5173'}/auth/google/callback`,
};

export const isProd = env.NODE_ENV === 'production';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const allowed = env.ORIGIN;
    if (origin === allowed) {
      callback(null, true);
      return;
    }
    if (!isProd && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Draft-Id', 'Content-Disposition'],
};
