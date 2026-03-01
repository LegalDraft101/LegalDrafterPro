/**
 * Shared validation schemas (Zod). Align with backend validators.
 */

import { z } from 'zod';

/** Strict: local@domain.tld */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
/** Technically correct: something@something (at least one char each side of @) */
export const TECHNICAL_EMAIL_REGEX = /^[^\s@]+@[^\s@]+$/;

export function isEmailTechnicallyCorrect(value: string): boolean {
  const s = (value || '').trim();
  return s.length >= 3 && s.length <= 254 && TECHNICAL_EMAIL_REGEX.test(s);
}

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Invalid or incomplete email')
  .max(254, 'Invalid or incomplete email')
  .superRefine((s, ctx) => {
    if (!(EMAIL_REGEX.test(s.toLowerCase()) || TECHNICAL_EMAIL_REGEX.test(s))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: !s.includes('@')
          ? `Please include an '@' in the email address. '${s}' is missing an '@'.`
          : 'Invalid or incomplete email',
      });
    }
  });

/** Password: 8+ characters, alphanumeric only, at least one uppercase, one lowercase, and one number */
export const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .max(128, 'Password must have uppercase, lowercase and a number')
  .refine(
    (s) => /^[a-zA-Z0-9]+$/.test(s) && /[a-z]/.test(s) && /[A-Z]/.test(s) && /\d/.test(s),
    'Password must have uppercase, lowercase and a number'
  );

export function isValidEmail(value: string): boolean {
  const result = emailSchema.safeParse(value);
  return result.success;
}

export function isValidPassword(value: string): boolean {
  const result = passwordSchema.safeParse(value);
  return result.success;
}
