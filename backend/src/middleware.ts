/**
 * Middleware: auth guard, error handler, rate limiting.
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyAccessToken } from './utils';
import { findUserById } from './services';
import type { JwtPayload } from './types';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many OTP requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many attempts. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export async function authGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.accessToken ?? req.cookies?.access_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const payload = verifyAccessToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = await findUserById(payload.sub);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const tokenVersion = user.tokenVersion ?? 0;
  if ((payload.tokenVersion ?? 0) !== tokenVersion) {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
    return;
  }
  req.user = { ...payload, name: user.name, phone: user.phone };
  next();
}

export function maskForLog(value: unknown): string {
  if (value == null) return 'null';
  if (typeof value === 'string') return value.length > 4 ? value.slice(0, 2) + '***' : '***';
  if (typeof value === 'object') return '[object]';
  return '***';
}

export function errorHandler(
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.statusCode ?? 500;
  const message = status >= 500 ? 'Internal server error' : (err.message || 'Bad request');
  console.error(`[${status}] ${err.message}`, err.stack ?? '');
  res.status(status).json({ error: message });
}
