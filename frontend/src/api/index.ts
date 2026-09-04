/**
 * Central API layer — all frontend API endpoints in one place.
 * Import from '@/api' or '../api' for auth, drafting, and types.
 */

export { request } from './client';
export { authApi } from './auth';
export { draftingApi } from './drafting';
export type {
  SignupPayload,
  DraftType,
  FormFieldOption,
  FormField,
  FormSchema,
} from './types';

import { authApi } from './auth';
import { draftingApi } from './drafting';

export const api = {
  ...authApi,
  ...draftingApi,
};
