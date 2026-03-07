import { request } from './client';
import type {
  SignupPayload,
  LoginPayload,
  RequestOtpPayload,
  VerifyOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from './types';

export const authApi = {
  signup: (body: SignupPayload) =>
    request<{ status: string; next: string }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: LoginPayload) =>
    request<{ status: string; message?: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  requestOtp: (body: RequestOtpPayload) =>
    request<{ status: string }>('/auth/request-otp', { method: 'POST', body: JSON.stringify(body) }),

  verifyOtp: (body: VerifyOtpPayload) =>
    request<{ status: string; user?: { id: string; name: string; email: string; phone: string } }>(
      '/auth/verify-otp',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  forgotPassword: (body: ForgotPasswordPayload) =>
    request<{ status: string; message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  resetPassword: (body: ResetPasswordPayload) =>
    request<{ status: string; message?: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: () =>
    request<{ id: string; name: string; email: string; phone: string } | null>('/auth/me', { allow401: true }),

  logout: () =>
    request<{ status: string }>('/auth/logout', { method: 'POST' }),
};

/** Use frontend origin so OAuth flow goes through the app (and dev proxy); cookie then works. */
export function getGoogleAuthUrl(): string {
  return `${window.location.origin}/auth/google`;
}
