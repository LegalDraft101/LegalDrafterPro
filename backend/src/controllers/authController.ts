/**
 * Auth controller: signup, me, logout.
 * Firebase Auth handles login, passwords, and tokens natively.
 * Backend only manages the user record in our DB.
 */

import type { Response, NextFunction } from 'express';
import { isValidName } from '../utils';
import { userRepo } from '../repositories/userRepository';
import type { AuthRequest } from '../middleware';

/**
 * POST /auth/signup
 * Creates a user in our DB after Firebase signup + verification.
 * Requires both email (verified) and phone (verified & linked) in the Firebase token.
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

    try {
      const user = await userRepo.create({
        name: cleanName || 'User',
        email,
        phone,
        googleId: uid,
      });

      res.status(200).json({
        status: 'ok',
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
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
 * Auto-creates a user record for Google sign-in users who don't exist in our DB yet.
 * Only requires a verified email from the Firebase token. Phone is optional.
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

    const existing = await userRepo.findByEmail(email);
    if (existing) {
      res.status(200).json({
        status: 'ok',
        user: { id: existing.id, name: existing.name, email: existing.email, phone: existing.phone },
      });
      return;
    }

    try {
      const user = await userRepo.create({
        name: displayName || 'User',
        email,
        phone: fbUser.phone_number || '',
        googleId: uid,
      });

      res.status(200).json({
        status: 'ok',
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('EMAIL_OR_PHONE_EXISTS') || dbError.code === '23505') {
        const found = await userRepo.findByEmail(email);
        if (found) {
          res.status(200).json({
            status: 'ok',
            user: { id: found.id, name: found.name, email: found.email, phone: found.phone },
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
 * Returns the current user's profile from our DB.
 */
export async function me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.status(200).json({
      id: req.user.sub,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone ?? '',
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST /auth/logout
 */
export function logout(_req: AuthRequest, res: Response): void {
  res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ status: 'ok' });
}
