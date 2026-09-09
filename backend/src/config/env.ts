import { config } from 'dotenv';

// Load this service's .env once, before any other module reads configuration.
config({ override: true });

/** Returns a required setting and fails during startup with an actionable key name. */
const get = (key: string): string => {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') throw new Error(`Missing env: ${key}`);
  return value;
};

/** Optional secrets remain empty unless their related provider is enabled. */
const getOptional = (key: string): string => process.env[key]?.trim() ?? '';

/** Validates numeric operational limits before the API begins accepting traffic. */
const getNum = (key: string, min = 1): number => {
  const parsed = Number(get(key));
  if (!Number.isInteger(parsed) || parsed < min) throw new Error(`Invalid numeric env: ${key}`);
  return parsed;
};

/** Converts a comma-separated allow-list into normalized values for safe comparisons. */
const getList = (key: string): string[] => get(key).split(',').map((value) => value.trim()).filter(Boolean);

/** Converts explicit true/false feature flags; ambiguous values are rejected at startup. */
const getBool = (key: string): boolean => {
  const value = get(key).toLowerCase();
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid boolean env: ${key}`);
};

// This is the only module permitted to access process.env. Keep every runtime
// value in backend/.env and document it in backend/.env.example.
export const env = {
  PORT: getNum('PORT'),
  API_URL: get('API_URL'),
  ALLOWED_ORIGINS: getList('ALLOWED_ORIGINS'),
  ALLOW_REQUESTS_WITHOUT_ORIGIN: getBool('ALLOW_REQUESTS_WITHOUT_ORIGIN'),
  DATABASE_URL: get('DATABASE_URL'),
  JWT_SECRET: get('JWT_SECRET'),
  NODE_ENV: getOptional('NODE_ENV'),
  FIREBASE_SERVICE_ACCOUNT_PATH: getOptional('FIREBASE_SERVICE_ACCOUNT_PATH') || getOptional('GOOGLE_APPLICATION_CREDENTIALS'),
  REQUEST_BODY_LIMIT: get('REQUEST_BODY_LIMIT'),
  GENERAL_RATE_LIMIT_WINDOW_MS: getNum('GENERAL_RATE_LIMIT_WINDOW_MS'),
  GENERAL_RATE_LIMIT_MAX: getNum('GENERAL_RATE_LIMIT_MAX'),
  AUTH_RATE_LIMIT_WINDOW_MS: getNum('AUTH_RATE_LIMIT_WINDOW_MS'),
  AUTH_RATE_LIMIT_MAX: getNum('AUTH_RATE_LIMIT_MAX'),
  OCR_MAX_FILE_SIZE_BYTES: getNum('OCR_MAX_FILE_SIZE_BYTES'),
  OCR_IMAGE_MAX_FILE_SIZE_BYTES: getNum('OCR_IMAGE_MAX_FILE_SIZE_BYTES'),
  LOG_DEBUG_ENABLED: getBool('LOG_DEBUG_ENABLED'),
  GMAIL_CLIENT_ID: getOptional('GMAIL_CLIENT_ID'),
  GMAIL_CLIENT_SECRET: getOptional('GMAIL_CLIENT_SECRET'),
  GMAIL_REDIRECT_URI: getOptional('GMAIL_REDIRECT_URI'),
  GMAIL_REFRESH_TOKEN: getOptional('GMAIL_REFRESH_TOKEN'),
  GMAIL_SENDER: getOptional('GMAIL_SENDER'),
  EMAIL_PROVIDER: getOptional('EMAIL_PROVIDER'),
  EMAIL_FROM: getOptional('EMAIL_FROM'),
  EMAIL_API_KEY: getOptional('EMAIL_API_KEY'),
  SMS_PROVIDER: getOptional('SMS_PROVIDER'),
  TWILIO_ACCOUNT_SID: getOptional('TWILIO_ACCOUNT_SID'),
  TWILIO_AUTH_TOKEN: getOptional('TWILIO_AUTH_TOKEN'),
  TWILIO_FROM_NUMBER: getOptional('TWILIO_FROM_NUMBER'),
  FIREBASE_PROJECT_ID: getOptional('FIREBASE_PROJECT_ID'),
  FIREBASE_CLIENT_EMAIL: getOptional('FIREBASE_CLIENT_EMAIL'),
  FIREBASE_PRIVATE_KEY: getOptional('FIREBASE_PRIVATE_KEY'),
  GOOGLE_CLIENT_ID: getOptional('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: getOptional('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL: getOptional('GOOGLE_CALLBACK_URL'),
} as const;

export default env;
