import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import type { User } from '../users/user.types';

const SESSION_COOKIE = 'auth_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MAX_OTP_ATTEMPTS = 5;

export function hashSecret(secret: string, salt = crypto.randomBytes(16).toString('hex')): { hash: string; salt: string } {
  return { hash: crypto.scryptSync(secret, salt, 64).toString('hex'), salt };
}

export function verifySecret(secret: string, hash: string, salt: string): boolean {
  const actual = Buffer.from(hashSecret(secret, salt).hash, 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function issueSession(user: User, res: Response): void {
  const token = jwt.sign(
    { sub: user.id, tokenVersion: user.tokenVersion, authMethod: user.authMethod },
    env.JWT_SECRET,
    { expiresIn: SESSION_TTL_SECONDS },
  );
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000,
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production' });
}

export function readSessionToken(req: { cookies?: Record<string, string>; headers: Record<string, string | string[] | undefined> }): string | undefined {
  if (req.cookies?.[SESSION_COOKIE]) return req.cookies[SESSION_COOKIE];
  const auth = req.headers.authorization;
  return typeof auth === 'string' && /^Bearer /.test(auth) ? auth.slice(7) : undefined;
}

export function createOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function consumeOtp(id: string, code: string): Promise<{ valid: boolean; record?: Awaited<ReturnType<typeof prisma.authOtp.findUnique>> }> {
  const record = await prisma.authOtp.findUnique({ where: { id } });
  if (!record || record.consumedAt || record.expiresAt <= new Date() || record.attempts >= MAX_OTP_ATTEMPTS) return { valid: false };
  const valid = verifySecret(code, record.codeHash, record.codeSalt);
  await prisma.authOtp.update({ where: { id }, data: valid ? { consumedAt: new Date() } : { attempts: { increment: 1 } } });
  return { valid, record: valid ? record : undefined };
}

export { MAX_OTP_ATTEMPTS };