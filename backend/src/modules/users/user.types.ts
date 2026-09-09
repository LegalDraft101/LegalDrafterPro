/**
 * User types and request interface definitions.
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
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name: string;
  email?: string;
  phone: string;
  /** Immutable Firebase Auth UID. Never authorize by mutable profile fields. */
  firebaseUid?: string;
  authMethod?: 'GOOGLE_FIREBASE' | 'PHONE_PASSWORD' | 'EMAIL_OTP';
  passwordHash?: string;
  passwordSalt?: string;
  tokenVersion: number;
  accountStatus?: string;
  createdAt: number;
  updatedAt?: number;
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

export interface VerifySignupBody {
  name: string;
  email: string;
  phone: string;
  password?: string;
  emailCode: string;
  phoneCode: string;
}

export interface ApiUser {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name: string;
  email: string;
  phone: string;
  authMethod?: 'GOOGLE_FIREBASE' | 'PHONE_PASSWORD' | 'EMAIL_OTP';
  accountStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

type ApiUserSource = Pick<User, 'id' | 'name' | 'email' | 'phone' | 'authMethod'> & Partial<Pick<User, 'firstName' | 'lastName' | 'displayName' | 'accountStatus'>> & { createdAt?: Date | number; updatedAt?: Date | number };

function isoDate(value: Date | number | undefined): string | undefined {
  return value instanceof Date ? value.toISOString() : value === undefined ? undefined : new Date(value).toISOString();
}

export function toApiUser(user: ApiUserSource): ApiUser {
  return {
    id: user.id,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    displayName: user.displayName || undefined,
    name: user.name,
    email: user.email?.endsWith('@phone.local') ? '' : user.email || '',
    phone: user.phone,
    authMethod: user.authMethod,
    accountStatus: user.accountStatus,
    createdAt: isoDate(user.createdAt),
    updatedAt: isoDate(user.updatedAt),
  };
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
