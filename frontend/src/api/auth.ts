import { request } from './client';
import type { AuthUser, ProfileResponse, SignupPayload } from './types';

interface UserResponse extends AuthUser {}

export const authApi = {
  signup: (body: SignupPayload) =>
    request<{ status: string; user?: UserResponse }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  googleCreate: () =>
    request<{ status: string; user?: UserResponse }>('/auth/google-create', { method: 'POST', body: JSON.stringify({}) }),

  phoneSignup: (body: { name: string; phone: string; password: string }) =>
    request<{ status: string; user: UserResponse }>('/auth/phone/signup', { method: 'POST', body: JSON.stringify(body) }),

  phoneLogin: (body: { phone: string; password: string }) =>
    request<{ status: string; user: UserResponse }>('/auth/phone/login', { method: 'POST', body: JSON.stringify(body) }),

  emailSignupRequest: (body: { name: string; email: string; password: string }) =>
    request<{ status: string; otpId: string }>('/auth/email/signup/request-otp', { method: 'POST', body: JSON.stringify(body) }),

  emailSignupVerify: (body: { otpId: string; code: string }) =>
    request<{ status: string; user: UserResponse }>('/auth/email/signup/verify', { method: 'POST', body: JSON.stringify(body) }),

  emailLoginRequest: (body: { email: string; password: string }) =>
    request<{ status: string; otpId: string }>('/auth/email/login/request-otp', { method: 'POST', body: JSON.stringify(body) }),

  emailLoginVerify: (body: { otpId: string; code: string }) =>
    request<{ status: string; user: UserResponse }>('/auth/email/login/verify', { method: 'POST', body: JSON.stringify(body) }),
  me: () =>
    request<UserResponse | null>('/auth/me', { allow401: true }),

  logout: () =>
    request<{ status: string }>('/auth/logout', { method: 'POST' }),

  profile: () => request<ProfileResponse>('/auth/profile'),

  updateProfile: (body: { name?: string; firstName?: string; lastName?: string; displayName?: string; jobTitle?: string; avatar?: string; preferences?: Partial<ProfileResponse['preferences']> }) =>
    request<ProfileResponse>('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),

  addAddress: (body: Record<string, unknown>) =>
    request<UserAddressResponse>('/auth/profile/addresses', { method: 'POST', body: JSON.stringify(body) }),

  updateAddress: (id: string, body: Record<string, unknown>) =>
    request<ProfileResponse>(`/auth/profile/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  setDefaultAddress: (id: string, kind: 'personal' | 'delivery') =>
    request<ProfileResponse>(`/auth/profile/addresses/${id}/default`, { method: 'POST', body: JSON.stringify({ kind }) }),

  deleteAddress: (id: string, kind: 'personal' | 'delivery') =>
    request<void>(`/auth/profile/addresses/${id}?kind=${kind}`, { method: 'DELETE' }),

  requestVerification: (body: { channel: 'email' | 'phone'; email?: string; phone?: string }) =>
    request<{ status: string; otpId: string; channel: 'email' | 'phone' }>('/auth/profile/verification/request', { method: 'POST', body: JSON.stringify(body) }),

  verifyContact: (body: { channel: 'email' | 'phone'; otpId: string; code: string }) =>
    request<{ status: string; channel: 'email' | 'phone' }>('/auth/profile/verification/verify', { method: 'POST', body: JSON.stringify(body) }),

  syncFirebasePhone: () =>
    request<{ status: string; channel: 'phone' }>('/auth/profile/verification/firebase-phone', { method: 'POST', body: JSON.stringify({}) }),

  verifyPhone: () =>
    request<{ success: boolean; uid: string; phoneNumber: string; user?: UserResponse }>('/auth/verify-phone', { method: 'POST' }),

  emailOtpSend: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/email/send-otp', { method: 'POST', body: JSON.stringify({ email }) }),

  emailOtpVerify: (email: string, otp: string) =>
    request<{ success: boolean; message: string }>('/auth/email/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
};

interface UserAddressResponse {
  id: string;
  [key: string]: unknown;
}
