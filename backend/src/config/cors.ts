import type { CorsOptions } from 'cors';
import { env, isProd } from './env';

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

export default corsOptions;
