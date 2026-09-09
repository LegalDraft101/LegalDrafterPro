import type { CorsOptions } from 'cors';
import { env } from './env';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      // Non-browser clients have no Origin header; allow only when explicitly configured.
      callback(null, env.ALLOW_REQUESTS_WITHOUT_ORIGIN);
      return;
    }
    if (env.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    console.warn(`[CORS] Rejected origin: ${origin}`);
    callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Draft-Id', 'Content-Disposition'],
};

export default corsOptions;
