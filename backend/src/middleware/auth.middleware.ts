import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { adminAuth } from '../config/firebase';
import { findUserByEmail, findUserByPhone } from '../modules/users/user.queries';

import { normalizeEmail, normalizePhone } from '../utils/helpers';
import type { JwtPayload } from '../modules/users/user.types';

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

    // Find matching user in DB
    let user = null;
    if (decodedToken.email) {
      user = await findUserByEmail(normalizeEmail(decodedToken.email));
    } else if (decodedToken.phone_number) {
      user = await findUserByPhone(normalizePhone(decodedToken.phone_number));
    }

    if (!user) {
      const allowedNewUserPaths = ['/signup', '/google-create'];
      if (allowedNewUserPaths.includes(req.path)) {
        req.user = {
          sub: decodedToken.uid,
          tokenVersion: 1,
          name: decodedToken.name || '',
          phone: decodedToken.phone_number || '',
          email: decodedToken.email || '',
          iat: decodedToken.iat,
          exp: decodedToken.exp
        };
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
