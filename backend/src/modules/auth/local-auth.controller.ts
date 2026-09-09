import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { isValidEmail, isValidE164, isValidName, isValidPassword, normalizeEmail, normalizePhone } from '../../utils/helpers';
import { createUser, findUserByEmail, findUserByPhone } from '../users/user.queries';
import { consumeOtp, createOtpCode, hashSecret, issueSession, verifySecret } from './local-auth';
import { sendEmailOtp } from '../../services/email.service';
import { toApiUser } from '../users/user.types';

const OTP_TTL_MS = 10 * 60 * 1000;

function badRequest(res: Response, message: string): void {
  res.status(400).json({ error: message });
}

export async function phoneSignup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = String(req.body.name || '').trim();
    const phone = normalizePhone(String(req.body.phone || ''));
    const password = String(req.body.password || '');
    if (!isValidName(name) || !isValidE164(phone) || !isValidPassword(password)) {
      badRequest(res, 'Name, E.164 phone number, and a strong password are required.');
      return;
    }
    const passwordSecret = hashSecret(password);
    const user = await createUser({ name, phone, passwordHash: passwordSecret.hash, passwordSalt: passwordSecret.salt, authMethod: 'PHONE_PASSWORD' });
    issueSession(user, res);
    res.status(201).json({ status: 'ok', user: toApiUser(user) });
  } catch (error: any) {
    if (error.message?.includes('EMAIL_OR_PHONE_EXISTS')) { res.status(409).json({ error: 'Phone number is already registered.' }); return; }
    next(error);
  }
}

export async function phoneLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const phone = normalizePhone(String(req.body.phone || ''));
    const password = String(req.body.password || '');
    const user = await findUserByPhone(phone);
    if (!user?.passwordHash || !user.passwordSalt || user.authMethod !== 'PHONE_PASSWORD' || !verifySecret(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Invalid phone number or password.' }); return;
    }
    issueSession(user, res);
    res.json({ status: 'ok', user: toApiUser(user) });
  } catch (error) { next(error); }
}

async function createEmailOtp(target: string, purpose: string, data: { userId?: string; name?: string; phone?: string; passwordHash?: string; passwordSalt?: string }): Promise<string> {
  const code = createOtpCode();
  const secret = hashSecret(code);
  const record = await prisma.authOtp.create({
    data: { ...data, target, purpose, codeHash: secret.hash, codeSalt: secret.salt, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendEmailOtp(target, code);
  return record.id;
}

export async function emailSignupRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizeEmail(String(req.body.email || ''));
    const name = String(req.body.name || '').trim();
    const password = String(req.body.password || '');
    if (!isValidEmail(email) || !isValidName(name) || !isValidPassword(password)) { badRequest(res, 'Email, name, and a strong password are required.'); return; }
    if (await findUserByEmail(email)) { res.status(409).json({ error: 'Email is already registered.' }); return; }
    const passwordSecret = hashSecret(password);
    const otpId = await createEmailOtp(email, 'EMAIL_SIGNUP', { name, passwordHash: passwordSecret.hash, passwordSalt: passwordSecret.salt });
    res.status(202).json({ status: 'otp_sent', otpId });
  } catch (error) { next(error); }
}

export async function emailSignupVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await consumeOtp(String(req.body.otpId || ''), String(req.body.code || ''));
    if (!result.valid || !result.record || result.record.purpose !== 'EMAIL_SIGNUP' || !result.record.name || !result.record.passwordHash || !result.record.passwordSalt) { res.status(401).json({ error: 'Invalid or expired verification code.' }); return; }
    const user = await createUser({ name: result.record.name, email: result.record.target, phone: '', passwordHash: result.record.passwordHash, passwordSalt: result.record.passwordSalt, authMethod: 'EMAIL_OTP' });
    issueSession(user, res);
    res.status(201).json({ status: 'ok', user: toApiUser(user) });
  } catch (error: any) {
    if (error.message?.includes('EMAIL_OR_PHONE_EXISTS')) { res.status(409).json({ error: 'Email is already registered.' }); return; }
    next(error);
  }
}

export async function emailLoginRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizeEmail(String(req.body.email || ''));
    const password = String(req.body.password || '');
    const user = await findUserByEmail(email);
    if (!user?.passwordHash || !user.passwordSalt || user.authMethod !== 'EMAIL_OTP' || !verifySecret(password, user.passwordHash, user.passwordSalt)) { res.status(401).json({ error: 'Invalid email or password.' }); return; }
    const otpId = await createEmailOtp(email, 'EMAIL_LOGIN', { userId: user.id });
    res.status(202).json({ status: 'otp_sent', otpId });
  } catch (error) { next(error); }
}

export async function emailLoginVerify(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await consumeOtp(String(req.body.otpId || ''), String(req.body.code || ''));
    if (!result.valid || !result.record || result.record.purpose !== 'EMAIL_LOGIN' || !result.record.userId) { res.status(401).json({ error: 'Invalid or expired verification code.' }); return; }
    const user = await findUserByEmail(result.record.target);
    if (!user || user.id !== result.record.userId) { res.status(401).json({ error: 'Invalid verification session.' }); return; }
    issueSession(user, res);
    res.json({ status: 'ok', user: toApiUser(user) });
  } catch (error) { next(error); }
}