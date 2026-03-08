/**
 * Middleware: auth guard, error handler, rate limiting.
 */

import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { findUserById, findUserByEmail, findUserByPhone } from '../services';
import type { JwtPayload } from '../types';
import { adminAuth } from '../firebase';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
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
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!adminAuth) {
    res.status(500).json({ error: 'Firebase Admin SDK not initialized' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Find matching user in our Supabase DB
    let user = null;
    if (decodedToken.email) {
      user = await findUserByEmail(decodedToken.email);
    } else if (decodedToken.phone_number) {
      user = await findUserByPhone(decodedToken.phone_number);
    }

    if (!user) {
      if (req.path === '/signup') {
        // If it's a signup request, we allow it to pass even without a user in the DB.
        // We attach the verified Firebase token info so the controller can use it.
        req.user = {
          sub: decodedToken.uid, // Firebase UID
          tokenVersion: 1, // Default
          name: '',
          phone: decodedToken.phone_number || '',
          email: decodedToken.email || '',
          iat: decodedToken.iat,
          exp: decodedToken.exp
        };
        // We intercept the req object to pass decoded token for exact verifications
        (req as any).firebaseUser = decodedToken;
        return next();
      }
      res.status(401).json({ error: 'Unauthorized: User not found in database' });
      return;
    }

    req.user = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      name: user.name,
      phone: user.phone,
      email: user.email,
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };
    next();
  } catch (error) {
    console.error('Firebase token verification error', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
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
