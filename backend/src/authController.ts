/**
 * Auth controller: signup, login, me, logout, Google OAuth.
 */

import type { Request, Response, NextFunction } from 'express';
import { signAccessToken } from './utils';
import {
  isValidEmail,
  isValidE164,
  isValidName,
  isEmailOrPhone,
  isValidPassword,
  normalizeEmail,
  normalizePhone,
} from './utils';
import {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updatePassword,
  sendOtp,
  verifyOtpStored,
  getOtpVerifyKey,
  isVerifyBlocked,
  recordFailedVerifyAttempt,
  createAndSendResetCode,
  verifyAndConsumeResetCode,
} from './services';
import { env, isProd } from './config';
import type { AuthRequest } from './middleware';
import type { SignupBody, LoginBody, RequestOtpBody, VerifyOtpBody, ForgotPasswordBody, ResetPasswordBody } from './types';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: env.ACCESS_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as SignupBody;
    const name = (body.name ?? '').trim();
    const email = normalizeEmail(body.email ?? '');
    const phone = normalizePhone(body.phone ?? '');

    if (!isValidName(name)) {
      res.status(400).json({ error: 'Invalid name (2–50 characters)' });
      return;
    }
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (!isValidE164(phone)) {
      res.status(400).json({ error: 'Invalid phone (E.164)' });
      return;
    }

    const existingByEmail = await findUserByEmail(email);
    const existingByPhone = await findUserByPhone(phone);
    if (existingByEmail || existingByPhone) {
      res.status(400).json({ error: 'Email or phone already registered.' });
      return;
    }
    const password = typeof body.password === 'string' && body.password.trim() ? body.password.trim() : undefined;
    if (password && !isValidPassword(password)) {
      res.status(400).json({ error: 'Password must be 8+ characters with uppercase, lowercase and a number' });
      return;
    }
    try {
      await createUser({ name, email, phone, password });
    } catch (createErr) {
      if ((createErr as Error).message === 'EMAIL_OR_PHONE_EXISTS') {
        res.status(400).json({ error: 'Email or phone already registered.' });
        return;
      }
      throw createErr;
    }
    const otpChannel = (body.otpChannel ?? 'email') as 'email' | 'phone';
    if (otpChannel === 'phone') {
      await sendOtp(phone, 'phone');
    } else {
      await sendOtp(email, 'email');
    }
    res.status(200).json({ status: 'ok', next: 'verify-otp' });
  } catch (err) {
    if ((err as Error).message === 'RATE_LIMIT') {
      res.status(429).json({ error: 'Too many attempts. Try again later.' });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as LoginBody;
    const emailOrPhone = (body.emailOrPhone ?? '').trim();
    if (!isEmailOrPhone(emailOrPhone)) {
      res.status(400).json({ error: 'Invalid email or phone' });
      return;
    }
    const isEmail = isValidEmail(emailOrPhone);
    const target = isEmail ? normalizeEmail(emailOrPhone) : normalizePhone(emailOrPhone);
    const channel = isEmail ? 'email' : 'phone';
    const existingUser = isEmail
      ? await findUserByEmail(target)
      : await findUserByPhone(target);
    if (!existingUser) {
      res.status(400).json({ error: 'Email or phone not registered. Please sign up first.' });
      return;
    }
    await sendOtp(target, channel);
    res.status(200).json({ status: 'ok', message: 'If an account exists, you will receive a code.' });
  } catch (err) {
    if ((err as Error).message === 'RATE_LIMIT') {
      res.status(429).json({ error: 'Too many attempts. Try again later.' });
      return;
    }
    next(err);
  }
}

export async function requestOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as RequestOtpBody;
    const channel = body.channel;
    if (channel !== 'email' && channel !== 'phone') {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }
    if (channel === 'email') {
      const email = normalizeEmail(body.email ?? '');
      if (!email || !isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email' });
        return;
      }
      await sendOtp(email, 'email');
    } else {
      const phone = normalizePhone(body.phone ?? '');
      if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
        res.status(400).json({ error: 'Invalid phone (E.164)' });
        return;
      }
      await sendOtp(phone, 'phone');
    }
    res.status(200).json({ status: 'ok', message: 'Code sent.' });
  } catch (err) {
    if ((err as Error).message === 'RATE_LIMIT') {
      res.status(429).json({ error: 'Too many attempts. Try again later.' });
      return;
    }
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as VerifyOtpBody;
    const channel = body.channel;
    const code = (body.code ?? '').trim();
    if (channel !== 'email' && channel !== 'phone') {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: 'Invalid or expired code' });
      return;
    }
    const target =
      channel === 'email' ? normalizeEmail(body.email ?? '') : normalizePhone(body.phone ?? '');
    if (!target) {
      res.status(400).json({ error: 'Missing email or phone' });
      return;
    }
    if (channel === 'email' && !isValidEmail(target)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (channel === 'phone' && !isValidE164(target)) {
      res.status(400).json({ error: 'Invalid phone (E.164)' });
      return;
    }

    const verifyKey = getOtpVerifyKey(channel, target);
    if (isVerifyBlocked(verifyKey)) {
      res.status(400).json({ error: 'Too many wrong attempts. Try again in 15 minutes.' });
      return;
    }

    const ok = verifyOtpStored(target, channel, code);
    if (!ok) {
      recordFailedVerifyAttempt(verifyKey);
      res.status(400).json({ error: 'Invalid or expired code' });
      return;
    }

    let user = await findUserByEmail(target);
    if (!user) user = await findUserByPhone(target);
    if (!user) {
      if (!isProd) {
        user = await createUser({
          name: 'Test User',
          email: channel === 'email' ? target : `phone-${target.replace(/\D/g, '')}@otp.local`,
          phone: channel === 'phone' ? target : '',
        });
      } else {
        res.status(400).json({ error: 'Account not found. Please sign up first.' });
        return;
      }
    }

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      tokenVersion: user.tokenVersion ?? 0,
    });
    res.cookie('accessToken', token, COOKIE_OPTIONS);
    res.status(200).json({ status: 'ok', user: { id: user.id, name: user.name, email: user.email, phone: user.phone } });
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ForgotPasswordBody;
    const channel = body.channel;
    if (channel !== 'email' && channel !== 'phone') {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }
    const target =
      channel === 'email' ? normalizeEmail(body.email ?? '') : normalizePhone(body.phone ?? '');
    if (!target) {
      res.status(400).json({ error: 'Missing email or phone' });
      return;
    }
    if (channel === 'email' && !isValidEmail(target)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (channel === 'phone' && !isValidE164(target)) {
      res.status(400).json({ error: 'Invalid phone (E.164)' });
      return;
    }
    const user = channel === 'email' ? await findUserByEmail(target) : await findUserByPhone(target);
    if (!user) {
      res.status(400).json({ error: 'Email or phone not registered. Please sign up first.' });
      return;
    }
    await createAndSendResetCode(target, channel);
    res.status(200).json({ status: 'ok', message: 'Reset code sent. Valid for 3 minutes.' });
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ResetPasswordBody;
    const channel = body.channel;
    const code = (body.code ?? '').trim();
    const newPassword = body.newPassword ?? '';
    if (channel !== 'email' && channel !== 'phone') {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      res.status(400).json({ error: 'Invalid or expired code' });
      return;
    }
    if (!isValidPassword(newPassword)) {
      res.status(400).json({ error: 'Password must be 8+ characters with uppercase, lowercase and a number' });
      return;
    }
    const target =
      channel === 'email' ? normalizeEmail(body.email ?? '') : normalizePhone(body.phone ?? '');
    if (!target) {
      res.status(400).json({ error: 'Missing email or phone' });
      return;
    }
    if (channel === 'email' && !isValidEmail(target)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (channel === 'phone' && !isValidE164(target)) {
      res.status(400).json({ error: 'Invalid phone (E.164)' });
      return;
    }
    const ok = verifyAndConsumeResetCode(target, channel, code);
    if (!ok) {
      res.status(400).json({ error: 'Invalid or expired code. Request a new one.' });
      return;
    }
    const user = channel === 'email' ? await findUserByEmail(target) : await findUserByPhone(target);
    if (!user) {
      res.status(400).json({ error: 'Account not found.' });
      return;
    }
    await updatePassword(user.id, newPassword);
    const updatedUser = await findUserById(user.id);
    if (updatedUser) {
      const token = signAccessToken({
        sub: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        phone: updatedUser.phone,
        tokenVersion: updatedUser.tokenVersion ?? 0,
      });
      res.cookie('accessToken', token, COOKIE_OPTIONS);
    }
    res.status(200).json({ status: 'ok', message: 'Password updated.' });
  } catch (e) {
    next(e);
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
  res.clearCookie('accessToken', { path: '/', httpOnly: true, sameSite: 'lax' });
  res.status(200).json({ status: 'ok' });
}

export function googleRedirect(req: AuthRequest, res: Response, next: NextFunction): void {
  next();
}

export async function googleCallback(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = (req as unknown as { user?: { id: string; email: string; name?: string; phone?: string; tokenVersion?: number } }).user;
    if (!user) {
      res.redirect(`${env.ORIGIN}/login?error=google_failed`);
      return;
    }
    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      tokenVersion: user.tokenVersion ?? 0,
    });
    res.cookie('accessToken', token, COOKIE_OPTIONS);
    res.redirect(`${env.ORIGIN}/account`);
  } catch (e) {
    next(e);
  }
}
