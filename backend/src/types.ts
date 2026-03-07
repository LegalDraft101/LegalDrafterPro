/**
 * Shared types for auth API.
 */

export type OtpChannel = 'email' | 'phone';

export interface PendingOtp {
  hash: string;
  salt: string;
  expiresAt: number;
  target: string;
  channel: OtpChannel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  googleId?: string;
  passwordHash?: string;
  passwordSalt?: string;
  tokenVersion: number;
  createdAt: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  phone?: string;
  tokenVersion?: number;
  iat: number;
  exp: number;
}

export type SignupOtpChannel = 'email' | 'phone';

export interface SignupBody {
  name: string;
  email: string;
  phone: string;
  password?: string;
  otpChannel?: SignupOtpChannel;
}

export interface LoginBody {
  emailOrPhone: string;
}

export interface RequestOtpBody {
  channel: OtpChannel;
  email?: string;
  phone?: string;
}

export interface VerifyOtpBody {
  channel: OtpChannel;
  email?: string;
  phone?: string;
  code: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ForgotPasswordBody {
  channel: OtpChannel;
  email?: string;
  phone?: string;
}

export interface ResetPasswordBody {
  channel: OtpChannel;
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}
