/**
 * Shared types for API requests/responses.
 * Keep all API-related types here for a single source of truth.
 */

// ---- Auth ----
export type SignupOtpChannel = 'email' | 'phone';

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  otpChannel?: SignupOtpChannel;
}

export interface LoginPayload {
  emailOrPhone: string;
}

export interface RequestOtpPayload {
  channel: 'email' | 'phone';
  email?: string;
  phone?: string;
}

export interface VerifyOtpPayload {
  channel: 'email' | 'phone';
  email?: string;
  phone?: string;
  code: string;
}

export interface ForgotPasswordPayload {
  channel: 'email' | 'phone';
  email?: string;
  phone?: string;
}

export interface ResetPasswordPayload {
  channel: 'email' | 'phone';
  email?: string;
  phone?: string;
  code: string;
  newPassword: string;
}

// ---- Drafting (affidavit & rent agreement) ----
export interface DraftType {
  id: string;
  name: string;
  description: string;
  slug: string;
}

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
  section?: string;
  /** For file fields: comma-separated accepted MIME types */
  accept?: string;
  /** Hint text shown below the upload area */
  hint?: string;
}

export interface FormSchema {
  typeId: string;
  typeName: string;
  fields: FormField[];
}
