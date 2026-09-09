import type { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { adminAuth } from '../config/firebase';
import { findUserByFirebaseUid, findUserById } from '../modules/users/user.queries';
import { readSessionToken } from '../modules/auth/local-auth';
import type { JwtPayload } from '../modules/users/user.types';
import { env } from '../config/env';

export const generalLimiter = rateLimit({ windowMs: env.GENERAL_RATE_LIMIT_WINDOW_MS, max: env.GENERAL_RATE_LIMIT_MAX, message: { error: 'Too many requests' }, standardHeaders: true, legacyHeaders: false });
export const authLimiter = rateLimit({ windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS, max: env.AUTH_RATE_LIMIT_MAX, message: { error: 'Too many attempts. Try again later.' }, standardHeaders: true, legacyHeaders: false });

export interface AuthRequest extends Request { user?: JwtPayload; }

export async function authGuard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const match = typeof authHeader === 'string' ? /^Bearer ([^\s]+)$/.exec(authHeader) : null;
  const hasLocalSession = Boolean(req.cookies?.auth_session);
  if (!match && !hasLocalSession) { res.status(401).json({ error: 'Unauthorized: No token provided' }); return; }

  if (match && !hasLocalSession && adminAuth) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(match[1], true);
      (req as any).firebaseUser = decodedToken;
      const user = await findUserByFirebaseUid(decodedToken.uid);
      if (!user) {
        if (['/signup', '/google-create', '/google/signin'].includes(req.path)) {
          req.user = { sub: decodedToken.uid, tokenVersion: 1, name: decodedToken.name || '', phone: decodedToken.phone_number || '', email: decodedToken.email || '', iat: decodedToken.iat, exp: decodedToken.exp };
          next();
          return;
        }
        res.status(403).json({ error: 'Account is not registered.' });
        return;
      }
      if (user.accountStatus?.toLowerCase() !== 'active') { res.status(403).json({ error: 'Account is not active.' }); return; }
      req.user = { sub: user.id, tokenVersion: user.tokenVersion, name: user.name, phone: user.phone, email: user.email || '', iat: decodedToken.iat, exp: decodedToken.exp };
      next();
      return;
    } catch {
      // A bearer token may be a backend session. Try that path below.
    }
  }

  try {
    const sessionToken = readSessionToken(req);
    if (!sessionToken) { res.status(401).json({ error: 'Unauthorized: No token provided' }); return; }
    const payload = jwt.verify(sessionToken, env.JWT_SECRET) as { sub: string; tokenVersion: number; iat: number; exp: number };
    const user = await findUserById(payload.sub);
    if (!user || user.tokenVersion !== payload.tokenVersion || user.accountStatus?.toLowerCase() !== 'active') { res.status(401).json({ error: 'Unauthorized: Invalid session' }); return; }
    req.user = { sub: user.id, tokenVersion: user.tokenVersion, name: user.name, phone: user.phone, email: user.email || '', iat: payload.iat, exp: payload.exp };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
