import type { Response, NextFunction } from 'express';
import { isValidName } from '../../utils/helpers';
import { createUser, findUserByEmail, findUserByFirebaseUid, findUserById, linkFirebaseUid } from '../users/user.queries';
import { toApiUser } from '../users/user.types';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { adminAuth } from '../../config/firebase';
import { clearSession } from './local-auth';

/**
 * POST /auth/signup
 */
export async function signup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const fbUser = (req as any).firebaseUser;
    if (!fbUser) {
      res.status(401).json({ error: 'Unauthorized: Missing Firebase Token Context' });
      return;
    }

    const { name } = req.body;
    const cleanName = (name ?? '').trim();

    if (cleanName && !isValidName(cleanName)) {
      res.status(400).json({ error: 'Invalid name (2–50 characters)' });
      return;
    }

    const emailVerified = fbUser.email_verified === true;
    const email = fbUser.email;
    const phone = fbUser.phone_number;
    const uid = fbUser.uid;

    if (!email || !emailVerified) {
      res.status(400).json({ error: 'Email must be verified to complete signup.' });
      return;
    }

    if (!phone) {
      res.status(400).json({ error: 'Phone number must be verified and linked to complete signup.' });
      return;
    }

    const existingByUid = await findUserByFirebaseUid(uid);
    if (existingByUid) {
      res.status(200).json({ status: 'ok', user: { id: existingByUid.id, name: existingByUid.name, email: existingByUid.email, phone: existingByUid.phone } });
      return;
    }
    const existingByEmail = await findUserByEmail(email);
    if (existingByEmail && existingByEmail.firebaseUid !== uid) {
      res.status(409).json({ error: 'This email is already linked to a different account.' });
      return;
    }

    try {
      const user = await createUser({
        name: cleanName || 'User',
        email,
        phone,
        firebaseUid: uid,
      });

      res.status(200).json({
        status: 'ok',
        user: toApiUser(user),
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('EMAIL_OR_PHONE_EXISTS') || dbError.code === '23505') {
        res.status(400).json({ error: 'User with this email or phone already exists.' });
        return;
      }
      throw dbError;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/google-create
 */
export async function googleCreate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const fbUser = (req as any).firebaseUser;
    if (!fbUser) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const email = fbUser.email;
    const emailVerified = fbUser.email_verified === true;
    const uid = fbUser.uid;
    const displayName = fbUser.name || fbUser.displayName || '';

    if (!email || !emailVerified) {
      res.status(400).json({ error: 'A verified email is required.' });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      if (existing.firebaseUid && existing.firebaseUid !== uid) {
        res.status(409).json({ error: 'This email is already linked to a different Google account.' });
        return;
      }
      const linkedUser = existing.firebaseUid ? existing : await linkFirebaseUid(existing.id, uid);
      res.status(200).json({ status: 'ok', user: toApiUser(linkedUser) });
      return;
    }

    try {
      const user = await createUser({
        name: displayName || 'User',
        email,
        phone: fbUser.phone_number || '',
        firebaseUid: uid,
      });

      res.status(200).json({
        status: 'ok',
        user: toApiUser(user),
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('EMAIL_OR_PHONE_EXISTS') || dbError.code === '23505') {
        const found = await findUserByEmail(email);
        if (found) {
          res.status(200).json({
            status: 'ok',
            user: toApiUser(found),
          });
          return;
        }
      }
      throw dbError;
    }
  } catch (err) {
    next(err);
  }
}

/**
 * GET /auth/me
 */
export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await findUserById(req.user.sub);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(toApiUser(user));
  } catch (e) {
    next(e);
  }
}

/**
 * POST /auth/logout
 */
export async function logout(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const firebaseUser = (req as any).firebaseUser;
    if (!firebaseUser?.uid || !adminAuth) { clearSession(res); res.status(200).json({ status: 'ok' }); return; }
    // Invalidates refresh tokens and, with checkRevoked in authGuard, prevents
    // reuse of this session after Firebase has processed the revocation.
    await adminAuth.revokeRefreshTokens(firebaseUser.uid);
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    next(error);
  }
}
