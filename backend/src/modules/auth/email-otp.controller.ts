import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { isValidEmail, normalizeEmail } from '../../utils/helpers';
import { createUser, findUserByEmail } from '../users/user.queries';
import { createOtpCode, hashSecret, issueSession, MAX_OTP_ATTEMPTS, verifySecret } from './local-auth';
import { sendEmailOtp as deliverEmailOtp } from '../../services/email.service';

const EMAIL_OTP_PURPOSE = 'EMAIL_AUTH';
const EMAIL_OTP_TTL_MS = 5 * 60 * 1000;
const EMAIL_OTP_RESEND_COOLDOWN_MS = 45 * 1000;

function normalizedInput(value: unknown): string {
  return normalizeEmail(String(value || ''));
}

function validOtp(value: unknown): boolean {
  return /^\d{6}$/.test(String(value || ''));
}

export async function sendEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizedInput(req.body.email);
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }

    const recent = await prisma.authOtp.findFirst({
      where: { target: email, purpose: EMAIL_OTP_PURPOSE, consumedAt: null, createdAt: { gt: new Date(Date.now() - EMAIL_OTP_RESEND_COOLDOWN_MS) } },
      select: { id: true },
    });
    if (recent) {
      res.status(429).json({ error: 'Please wait before requesting another code.' });
      return;
    }

    const code = createOtpCode();
    const secret = hashSecret(code);
    await prisma.authOtp.updateMany({
      where: { target: email, purpose: EMAIL_OTP_PURPOSE, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    const record = await prisma.authOtp.create({
      data: { target: email, purpose: EMAIL_OTP_PURPOSE, codeHash: secret.hash, codeSalt: secret.salt, expiresAt: new Date(Date.now() + EMAIL_OTP_TTL_MS) },
    });

    try {
      await deliverEmailOtp(email, code);
    } catch (error) {
      await prisma.authOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } }).catch(() => undefined);
      throw error;
    }

    res.status(202).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    next(error);
  }
}

export async function verifyEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizedInput(req.body.email);
    const code = String(req.body.otp || '');
    if (!isValidEmail(email) || !validOtp(code)) {
      res.status(400).json({ error: 'A valid email address and 6-digit OTP are required.' });
      return;
    }

    const record = await prisma.authOtp.findFirst({
      where: { target: email, purpose: EMAIL_OTP_PURPOSE, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || record.expiresAt <= new Date()) {
      res.status(410).json({ error: 'This verification code has expired. Request a new code.' });
      return;
    }
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      res.status(429).json({ error: 'Too many incorrect attempts. Request a new code.' });
      return;
    }

    if (!verifySecret(code, record.codeHash, record.codeSalt)) {
      const attempts = record.attempts + 1;
      await prisma.authOtp.update({
        where: { id: record.id },
        data: { attempts, ...(attempts >= MAX_OTP_ATTEMPTS ? { consumedAt: new Date() } : {}) },
      });
      res.status(attempts >= MAX_OTP_ATTEMPTS ? 429 : 401).json({
        error: attempts >= MAX_OTP_ATTEMPTS ? 'Too many incorrect attempts. Request a new code.' : 'Incorrect verification code.',
      });
      return;
    }

    await prisma.authOtp.update({ where: { id: record.id }, data: { consumedAt: new Date() } });
    let user = await findUserByEmail(email);
    if (!user) {
      user = await createUser({ name: email.split('@')[0], email, phone: '', authMethod: 'EMAIL_OTP' });
    }
    const now = new Date();
    await prisma.userVerification.upsert({
      where: { userId: user.id },
      create: { userId: user.id, emailAuthenticated: true, emailAuthenticatedAt: now, lastAuthenticationAt: now },
      update: { emailAuthenticated: true, emailAuthenticatedAt: now, lastAuthenticationAt: now },
    });
    issueSession(user, res);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error: any) {
    if (error?.message?.includes('EMAIL_OR_PHONE_EXISTS')) {
      res.status(409).json({ error: 'Unable to create the application account.' });
      return;
    }
    next(error);
  }
}