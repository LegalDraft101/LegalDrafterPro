import type { Request, Response, NextFunction } from 'express';
import { createUser, findUserByEmail, findUserByFirebaseUid } from '../users/user.queries';
import { linkFirebaseUid } from '../users/user.queries';
import { prisma } from '../../lib/prisma';
import { toApiUser } from '../users/user.types';
import { normalizeEmail, isValidName, normalizePhone } from '../../utils/helpers';

export interface GoogleAuthRequest extends Request {
  firebaseUser?: { uid: string; email?: string; email_verified?: boolean; name?: string; phone_number?: string; phone_number_verified?: boolean; firebase?: { sign_in_provider?: string } };
}

/**
 * The Firebase guard verifies the ID token before this handler executes.
 */
export async function googleAuth(req: GoogleAuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const fbUser = req.firebaseUser;
    if (!fbUser) {
      res.status(401).json({ error: 'Unauthorized: Missing Firebase authentication context.' });
      return;
    }

    const email = normalizeEmail(fbUser.email || '');
    const uid = fbUser.uid;
    if (!uid || !email || !fbUser.email_verified) {
      res.status(400).json({ error: 'A verified email address is required for Google authentication.' });
      return;
    }
    if (fbUser.firebase?.sign_in_provider !== 'google.com') {
      res.status(403).json({ error: 'This endpoint is only for Google sign-in.' });
      return;
    }

    // The UID is the authority. Email only detects an attempted account collision.
    let user = await findUserByFirebaseUid(uid);
    if (!user) {
      const userWithEmail = await findUserByEmail(email);
      if (userWithEmail && userWithEmail.firebaseUid !== uid) {
        res.status(409).json({ error: 'This email is already linked to a different account.' });
        return;
      }
      user = userWithEmail;
    }

    if (!user) {
      const name = (fbUser.name || 'Google User').trim();
      user = await createUser({
        name: isValidName(name) ? name : 'Google User',
        email,
        phone: normalizePhone(fbUser.phone_number || ''),
        firebaseUid: uid,
        authMethod: 'GOOGLE_FIREBASE',
      });
    } else if (!user.firebaseUid) {
      user = await linkFirebaseUid(user.id, uid);
    }

    if (user.accountStatus && user.accountStatus.toLowerCase() !== 'active') {
      res.status(403).json({ error: 'Account is not active.' });
      return;
    }

    const now = new Date();
    await prisma.userVerification.upsert({
      where: { userId: user.id },
      create: { userId: user.id, emailAuthenticated: true, emailAuthenticatedAt: now, phoneAuthenticated: Boolean(fbUser.phone_number_verified), phoneAuthenticatedAt: fbUser.phone_number_verified ? now : null, lastAuthenticationAt: now },
      update: { emailAuthenticated: true, emailAuthenticatedAt: now, ...(fbUser.phone_number_verified ? { phoneAuthenticated: true, phoneAuthenticatedAt: now } : {}), lastAuthenticationAt: now },
    });

    res.status(200).json({ status: 'ok', user: toApiUser(user) });
  } catch (err) {
    next(err);
  }
}
