import { request } from './client';
import type { SignupPayload } from './types';

interface UserResponse { id: string; name: string; email: string; phone: string }

export const authApi = {
  signup: (body: SignupPayload) =>
    request<{ status: string; user?: UserResponse }>('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),

  googleCreate: () =>
    request<{ status: string; user?: UserResponse }>('/auth/google-create', { method: 'POST', body: JSON.stringify({}) }),

  me: () =>
    request<UserResponse | null>('/auth/me', { allow401: true }),

  logout: () =>
    request<{ status: string }>('/auth/logout', { method: 'POST' }),
};
