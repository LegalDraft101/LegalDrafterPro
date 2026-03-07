/**
 * Utils: crypto (OTP/password), JWT, validators.
 */

import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from './config';
import type { JwtPayload } from './types';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 64;
const SALT_LEN = 32;
const SECRET = env.JWT_SECRET;
const ACCESS_TTL_SEC = env.ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const TECHNICAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{1,14}$/;
const INVISIBLE_REGEX = /[\u200B-\u200D\uFEFF]/g;
const PASSWORD_REGEX = /^[a-zA-Z0-9]+$/;

export function generateOtp(length: number): string {
  const digits: string[] = [];
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) digits.push((bytes[i]! % 10).toString());
  return digits.join('');
}

export function hashOtp(code: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(code, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return { hash: hash.toString('hex'), salt };
}

export function verifyOtp(code: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(code, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  const derivedHex = derived.toString('hex');
  if (derivedHex.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(derivedHex, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function hashPassword(plain: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(SALT_LEN).toString('hex');
  const hash = crypto.scryptSync(plain, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return { hash: hash.toString('hex'), salt };
}

export function verifyPassword(plain: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(plain, salt, KEYLEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  const derivedHex = derived.toString('hex');
  if (derivedHex.length !== storedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(derivedHex, 'hex'), Buffer.from(storedHash, 'hex'));
}

export function signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      phone: payload.phone,
      tokenVersion: payload.tokenVersion ?? 0,
    },
    SECRET,
    { expiresIn: ACCESS_TTL_SEC }
  );
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token, { complete: true }) as { header?: { alg?: string }; payload?: JwtPayload } | null;
    if (!decoded?.header || (decoded.header.alg && decoded.header.alg.toLowerCase() === 'none')) return null;
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function stripInvisible(s: string): string {
  if (typeof s !== 'string') return '';
  return s.replace(INVISIBLE_REGEX, '').trim();
}

export function nfcNormalize(s: string): string {
  return typeof s === 'string' ? s.normalize('NFC') : '';
}

export function isValidEmail(s: string): boolean {
  if (typeof s !== 'string') return false;
  const t = nfcNormalize(stripInvisible(s)).toLowerCase();
  if (t.length < 3 || t.length > 254) return false;
  return EMAIL_REGEX.test(t) || TECHNICAL_EMAIL_REGEX.test(t);
}

export function isValidPassword(s: string): boolean {
  if (typeof s !== 'string') return false;
  const t = stripInvisible(s);
  if (t.length < 8) return false;
  if (!PASSWORD_REGEX.test(t)) return false;
  if (!/[a-z]/.test(t)) return false;
  if (!/[A-Z]/.test(t)) return false;
  if (!/\d/.test(t)) return false;
  return true;
}

export function isValidE164(s: string): boolean {
  return typeof s === 'string' && E164_REGEX.test(s.replace(/\s/g, ''));
}

export function isValidName(s: string): boolean {
  const t = typeof s === 'string' ? s.trim() : '';
  return t.length >= 2 && t.length <= 50;
}

export function isEmailOrPhone(s: string): boolean {
  const t = (s || '').trim();
  return isValidEmail(t) || isValidE164(t);
}

export function normalizeEmail(s: string): string {
  return nfcNormalize(stripInvisible(s || '')).toLowerCase();
}

export function normalizePhone(s: string): string {
  return nfcNormalize(stripInvisible(s || '').replace(/\s/g, ''));
}
