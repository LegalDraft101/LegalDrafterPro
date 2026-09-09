/**
 * Shared input normalization and validation helpers.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const TECHNICAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{1,14}$/;
const INVISIBLE_REGEX = /[\u200B-\u200D\uFEFF]/g;

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
