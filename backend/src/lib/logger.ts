import { env } from '../config/env';

// Central logger keeps timestamped operational events consistent and searchable.
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (env.LOG_DEBUG_ENABLED) {
      console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, ...args);
    }
  },
};

export default logger;
