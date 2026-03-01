/**
 * Services: email, SMS, OTP, reset password, user, Google OAuth.
 */

import nodemailer from 'nodemailer';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env, isProd } from './config';
import { userRepo } from './repo';
import { generateOtp, hashOtp, verifyOtp, hashPassword, normalizeEmail, normalizePhone, stripInvisible } from './utils';
import type { User } from './types';
import type { OtpChannel, PendingOtp } from './types';

// ---- Email ----
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const hasGmail =
    env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN && env.GMAIL_SENDER;
  if (!hasGmail) {
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporter;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.GMAIL_SENDER,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
    },
  });
  return transporter;
}

async function sendOtpEmail(toEmail: string, code: string): Promise<void> {
  const trans = getTransporter();
  const hasOAuth =
    env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN;
  const mailOptions: nodemailer.SendMailOptions = {
    from: env.GMAIL_SENDER,
    to: toEmail,
    subject: 'Your verification code',
    text: `Your verification code is: ${code}. It expires in 5 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
  };
  if (!hasOAuth) {
    console.log('[Email mock] to=%s*** code=%s', toEmail.slice(0, 3), code);
    return;
  }
  await trans.sendMail(mailOptions);
}

async function sendPasswordResetEmail(toEmail: string, code: string): Promise<void> {
  const trans = getTransporter();
  const hasOAuth =
    env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN;
  const mailOptions: nodemailer.SendMailOptions = {
    from: env.GMAIL_SENDER,
    to: toEmail,
    subject: 'Password reset code',
    text: `Your password reset code is: ${code}. It is valid for 3 minutes.`,
    html: `<p>Your password reset code is: <strong>${code}</strong>.</p><p>It is valid for 3 minutes.</p>`,
  };
  if (!hasOAuth) {
    console.log('[Email mock] password reset to=%s*** code=%s', toEmail.slice(0, 3), code);
    return;
  }
  await trans.sendMail(mailOptions);
}

// ---- SMS ----
export interface SmsProvider {
  send(to: string, code: string): Promise<void>;
}

class ConsoleSmsProvider implements SmsProvider {
  async send(to: string, code: string): Promise<void> {
    const masked = to.length <= 4 ? '****' : to.slice(0, 2) + '****' + to.slice(-2);
    console.log('[SMS mock] destination=%s code=%s', masked, code);
  }
}

class TwilioSmsProvider implements SmsProvider {
  async send(_to: string, _code: string): Promise<void> {
    throw new Error('TwilioSmsProvider not implemented; use SMS_PROVIDER=console or implement Twilio');
  }
}

export function getSmsProvider(providerName: string): SmsProvider {
  if (providerName === 'twilio') return new TwilioSmsProvider();
  return new ConsoleSmsProvider();
}

// ---- OTP ----
const TEST_OTP = '000000';
const OTP_TTL_MS = 60 * 1000;
const MAX_VERIFY_ATTEMPTS = 5;
const VERIFY_BLOCK_MS = 15 * 60 * 1000;
const MAX_PER_HOUR = env.OTP_MAX_PER_HOUR;
const CODE_LENGTH = env.OTP_CODE_LENGTH;

interface StoredOtp extends PendingOtp {
  createdAt: number;
}

const otpStore = new Map<string, StoredOtp>();
const otpRateLimitCount = new Map<string, { count: number; hourStart: number }>();
const verifyAttempts = new Map<string, { count: number; blockedUntil: number }>();

export function getOtpVerifyKey(channel: OtpChannel, target: string): string {
  return `${channel}:${target}`;
}

export function isVerifyBlocked(targetKey: string): boolean {
  const entry = verifyAttempts.get(targetKey);
  if (!entry) return false;
  if (Date.now() >= entry.blockedUntil) {
    verifyAttempts.delete(targetKey);
    return false;
  }
  return true;
}

export function recordFailedVerifyAttempt(targetKey: string): void {
  const now = Date.now();
  let entry = verifyAttempts.get(targetKey);
  if (!entry) {
    verifyAttempts.set(targetKey, { count: 1, blockedUntil: 0 });
    return;
  }
  if (entry.blockedUntil > 0 && now < entry.blockedUntil) return;
  if (entry.blockedUntil > 0 && now >= entry.blockedUntil) {
    entry.count = 0;
    entry.blockedUntil = 0;
  }
  entry.count += 1;
  if (entry.count >= MAX_VERIFY_ATTEMPTS) entry.blockedUntil = now + VERIFY_BLOCK_MS;
}

function clearVerifyAttempts(targetKey: string): void {
  verifyAttempts.delete(targetKey);
}

function otpCleanupExpired(): void {
  const now = Date.now();
  for (const [k, v] of otpStore.entries()) {
    if (v.expiresAt < now) otpStore.delete(k);
  }
}

function checkOtpRateLimit(targetKey: string): boolean {
  const now = Date.now();
  const hourStart = Math.floor(now / 3600000) * 3600000;
  const entry = otpRateLimitCount.get(targetKey);
  if (!entry) return true;
  if (entry.hourStart < hourStart) return true;
  return entry.count < MAX_PER_HOUR;
}

function incrementOtpRateLimit(targetKey: string): void {
  const now = Date.now();
  const hourStart = Math.floor(now / 3600000) * 3600000;
  const entry = otpRateLimitCount.get(targetKey);
  if (!entry || entry.hourStart < hourStart) {
    otpRateLimitCount.set(targetKey, { count: 1, hourStart });
  } else {
    entry.count += 1;
  }
}

function key(channel: OtpChannel, target: string): string {
  return getOtpVerifyKey(channel, target);
}

export function createOtp(target: string, channel: OtpChannel): { code: string } {
  otpCleanupExpired();
  const targetKey = key(channel, target);
  if (!checkOtpRateLimit(targetKey)) throw new Error('RATE_LIMIT');
  const code = isProd ? generateOtp(CODE_LENGTH) : TEST_OTP;
  const { hash, salt } = hashOtp(code);
  const now = Date.now();
  otpStore.set(targetKey, {
    hash,
    salt,
    expiresAt: now + OTP_TTL_MS,
    target,
    channel,
    createdAt: now,
  });
  incrementOtpRateLimit(targetKey);
  return { code };
}

export async function sendOtp(target: string, channel: OtpChannel): Promise<void> {
  const { code } = createOtp(target, channel);
  console.log(`[OTP TEST] ${channel} ${target} → code: ${code}`);
  if (channel === 'email') {
    await sendOtpEmail(target, code);
  } else {
    const sms = getSmsProvider(env.SMS_PROVIDER);
    await sms.send(target, code);
  }
}

export async function sendOtpToEmailAndPhone(email: string, phone: string): Promise<void> {
  otpCleanupExpired();
  const emailKey = key('email', email);
  const phoneKey = key('phone', phone);
  if (!checkOtpRateLimit(emailKey) || !checkOtpRateLimit(phoneKey)) throw new Error('RATE_LIMIT');
  const code = isProd ? generateOtp(CODE_LENGTH) : TEST_OTP;
  const { hash, salt } = hashOtp(code);
  const now = Date.now();
  const expiresAt = now + OTP_TTL_MS;
  otpStore.set(emailKey, { hash, salt, expiresAt, target: email, channel: 'email', createdAt: now });
  otpStore.set(phoneKey, { hash, salt, expiresAt, target: phone, channel: 'phone', createdAt: now });
  incrementOtpRateLimit(emailKey);
  incrementOtpRateLimit(phoneKey);
  console.log(`[OTP TEST] email ${email} & phone ${phone} → code: ${code}`);
  await sendOtpEmail(email, code);
  const sms = getSmsProvider(env.SMS_PROVIDER);
  await sms.send(phone, code);
}

export function verifyOtpStored(target: string, channel: OtpChannel, code: string): boolean {
  otpCleanupExpired();
  const targetKey = key(channel, target);
  const stored = otpStore.get(targetKey);
  if (!stored || stored.expiresAt < Date.now()) return false;
  const ok = verifyOtp(code, stored.hash, stored.salt);
  if (ok) {
    otpStore.delete(targetKey);
    clearVerifyAttempts(targetKey);
  }
  return ok;
}

export function getOtpExpiresAt(target: string, channel: OtpChannel): number | null {
  const stored = otpStore.get(key(channel, target));
  return stored ? stored.expiresAt : null;
}

// ---- Reset password ----
const RESET_TTL_MS = 3 * 60 * 1000;
interface StoredReset {
  hash: string;
  salt: string;
  expiresAt: number;
  target: string;
  channel: OtpChannel;
}
const resetStore = new Map<string, StoredReset>();

function resetKey(channel: OtpChannel, target: string): string {
  return `reset:${channel}:${target}`;
}

function resetCleanupExpired(): void {
  const now = Date.now();
  for (const [k, v] of resetStore.entries()) {
    if (v.expiresAt < now) resetStore.delete(k);
  }
}

export async function createAndSendResetCode(target: string, channel: OtpChannel): Promise<void> {
  resetCleanupExpired();
  const targetKey = resetKey(channel, target);
  const code = generateOtp(6);
  const { hash, salt } = hashOtp(code);
  const now = Date.now();
  resetStore.set(targetKey, { hash, salt, expiresAt: now + RESET_TTL_MS, target, channel });
  if (channel === 'email') {
    await sendPasswordResetEmail(target, code);
  } else {
    const sms = getSmsProvider(env.SMS_PROVIDER);
    await sms.send(target, code);
  }
}

export function verifyAndConsumeResetCode(target: string, channel: OtpChannel, code: string): boolean {
  resetCleanupExpired();
  const targetKey = resetKey(channel, target);
  const stored = resetStore.get(targetKey);
  if (!stored || stored.expiresAt < Date.now()) return false;
  const ok = verifyOtp(code, stored.hash, stored.salt);
  if (ok) resetStore.delete(targetKey);
  return ok;
}

// ---- User ----
export async function findUserByEmail(email: string): Promise<User | null> {
  return userRepo.findByEmail(normalizeEmail(email));
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  return userRepo.findByPhone(normalizePhone(phone));
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  return userRepo.findByGoogleId(googleId);
}

export async function findUserById(id: string): Promise<User | null> {
  return userRepo.findById(id);
}

export async function createUser(data: {
  name: string;
  email: string;
  phone: string;
  googleId?: string;
  password?: string;
}): Promise<User> {
  const base = {
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    googleId: data.googleId,
  };
  if (data.password) {
    const sanitized = stripInvisible(data.password);
    const { hash, salt } = hashPassword(sanitized);
    return userRepo.create({ ...base, passwordHash: hash, passwordSalt: salt });
  }
  return userRepo.create(base);
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  const sanitized = stripInvisible(newPassword);
  const { hash, salt } = hashPassword(sanitized);
  await userRepo.updatePassword(userId, hash, salt);
}

export async function findOrCreateByGoogle(profile: {
  googleId: string;
  email: string;
  name?: string;
  phone?: string;
}): Promise<User> {
  let user = await userRepo.findByGoogleId(profile.googleId);
  if (user) return user;
  user = await userRepo.findByEmail(profile.email);
  if (user) return user;
  return userRepo.create({
    name: profile.name ?? profile.email.split('@')[0] ?? 'User',
    email: profile.email,
    phone: profile.phone ?? '',
    googleId: profile.googleId,
  });
}

// ---- Google OAuth ----
export function isGoogleAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

function initGoogleStrategy(): void {
  if (!isGoogleAuthConfigured()) return;
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          if (!email || !email.includes('@')) {
            done(new Error('Google did not provide an email. Please grant email permission.') as Error, undefined);
            return;
          }
          const user = await findOrCreateByGoogle({
            googleId: profile.id,
            email,
            name: profile.displayName ?? undefined,
          });
          done(null, user);
        } catch (err) {
          done(err as Error, undefined);
        }
      }
    )
  );
}

passport.serializeUser((user: unknown, done: (err: Error | null, id?: string) => void) => {
  done(null, (user as User).id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await findUserById(id);
    done(null, user ?? undefined);
  } catch (err) {
    done(err as Error, undefined);
  }
});

export function initPassport(): void {
  initGoogleStrategy();
}

export const googleAuthMiddleware = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

export const googleCbMiddleware = passport.authenticate('google', {
  session: false,
  failureRedirect: `${env.ORIGIN}/login?error=google_failed`,
});
