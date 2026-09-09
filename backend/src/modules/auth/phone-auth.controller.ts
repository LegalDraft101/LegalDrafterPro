import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { firebaseAuth } from '../../config/firebase';
import { isValidE164, normalizePhone } from '../../utils/helpers';
import { createUser, findUserByFirebaseUid, findUserByPhone, linkFirebaseUid } from '../users/user.queries';
import { toApiUser } from '../users/user.types';
import { issueSession } from './local-auth';

export async function verifyPhone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === 'string' ? /^Bearer\s+([^\s]+)$/.exec(authHeader) : null;

    if (!match || !match[1]) {
      res.status(401).json({ error: 'Unauthorized: Firebase ID token missing.' });
      return;
    }

    if (!firebaseAuth) {
      res.status(500).json({ error: 'Firebase Admin is not configured.' });
      return;
    }

    const decodedToken = await firebaseAuth.verifyIdToken(match[1], true);
    const phoneNumber = normalizePhone(decodedToken.phone_number || '');

    if (!phoneNumber || !isValidE164(phoneNumber)) {
      res.status(400).json({ error: 'A verified phone number is required.' });
      return;
    }

    let user = await findUserByFirebaseUid(decodedToken.uid);

    if (!user) {
      const existingByPhone = await findUserByPhone(phoneNumber);
      if (existingByPhone) {
        user = await linkFirebaseUid(existingByPhone.id, decodedToken.uid);
      } else {
        user = await createUser({
          name: phoneNumber,
          email: '',
          phone: phoneNumber,
          firebaseUid: decodedToken.uid,
          authMethod: 'GOOGLE_FIREBASE',
        });
      }
    }

    if (!user) {
      res.status(401).json({ error: 'Unable to resolve the authenticated user.' });
      return;
    }

    if (user.phone !== phoneNumber) {
      user = { ...user, phone: phoneNumber };
      await prisma.user.update({
        where: { id: user.id },
        data: { phone: phoneNumber },
      });
    }

    if (user.accountStatus && user.accountStatus.toLowerCase() !== 'active') {
      res.status(403).json({ error: 'Account is not active.' });
      return;
    }

    const now = new Date();
    await prisma.userVerification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phoneAuthenticated: true,
        phoneAuthenticatedAt: now,
        lastAuthenticationAt: now,
      },
      update: {
        phoneAuthenticated: true,
        phoneAuthenticatedAt: now,
        lastAuthenticationAt: now,
      },
    });

    issueSession(user, res);

    res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      phoneNumber,
      user: toApiUser(user),
    });
  } catch (error: any) {
    const message = typeof error?.message === 'string' ? error.message.toLowerCase() : '';
    if (message.includes('token expired') || message.includes('verify id token') || message.includes('firebase id token') || message.includes('invalid id token') || message.includes('must be a valid')) {
      res.status(401).json({ error: 'Unauthorized: Invalid or expired Firebase ID token.' });
      return;
    }

    if (error?.code === 'auth/argument-error' || message.includes('argument')) {
      res.status(401).json({ error: 'Unauthorized: Invalid Firebase token.' });
      return;
    }

    next(error);
  }
}
