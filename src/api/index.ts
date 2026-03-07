/**
 * Central API layer — all frontend API endpoints in one place.
 * Import from '@/api' or '../api' for auth, drafting, and types.
 */

export { request } from './client';
export { authApi, getGoogleAuthUrl } from './auth';
export { draftingApi } from './drafting';
export type {
  SignupOtpChannel,
  SignupPayload,
  LoginPayload,
  RequestOtpPayload,
  VerifyOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  DraftType,
  FormFieldOption,
  FormField,
  FormSchema,
} from './types';

// Single api object for backward compatibility (auth + drafting)
import { authApi } from './auth';
import { draftingApi } from './drafting';

export const api = {
  ...authApi,
  ...draftingApi,
};
