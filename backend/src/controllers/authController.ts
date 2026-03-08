/**
 * Auth controller: signup (for syncing), me, logout.
 * Firebase Auth now handles login, passwords, and tokens natively.
 */

import type { Response, NextFunction } from 'express';
import { normalizePhone, isValidE164, isValidName } from '../utils';
import { userRepo } from '../repositories/userRepository';
import type { AuthRequest } from '../middleware';

export async function signup(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // `firebaseUser` is injected in the updated authGuard
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

    // Verify both email and phone are present and verified in Firebase
    const emailVerified = fbUser.email_verified === true;
    const email = fbUser.email;
    const phone = fbUser.phone_number; // E.164 phone from Firebase
    const uid = fbUser.uid;

    if (!email || !emailVerified) {
      res.status(400).json({ error: 'Email must be verified to complete signup.' });
      return;
    }

    if (!phone) {
      res.status(400).json({ error: 'Phone number must be verified and linked to complete signup.' });
      return;
    }

    // Create the user in our DB
    try {
      // Create user record in our database. Note `create` omits `id` by design.
      const user = await userRepo.create({
        name: cleanName || 'User',
        email: email,
        phone: phone,
        googleId: uid // optionally use Firebase UID here or elsewhere
      });

      req.user.name = user.name;
      req.user.sub = user.id;

      res.status(200).json({
        status: 'ok',
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
      });
    } catch (dbError: any) {
      if (dbError.message?.includes('unique constraint') || dbError.code === '23505') {
        res.status(400).json({ error: 'User with this email or phone already exists.' });
        return;
      }
      throw dbError;
    }

  } catch (err) {
    next(err);
  }
}

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

export function logout(_req: AuthRequest, res: Response): void {
  // Client is using Firebase so cookie clearing is mostly deprecated but leaving for safety
  res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ status: 'ok' });
}
