/**
 * Shared types for API requests/responses.
 */

// ---- Auth ----
export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
}

export interface AuthUser {
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

export interface ProfileResponse {
  user: AuthUser;
  profile: { jobTitle: string; avatar: string };
  preferences: {
    language: string;
    theme: string;
    emailNotifications: boolean;
    marketingEmails: boolean;
    whatsappEnabled: boolean;
    smsNotifications: boolean;
  };
  verification: {
    emailVerified: boolean;
    phoneVerified: boolean;
    emailVerifiedAt: string | null;
    phoneVerifiedAt: string | null;
  };
  addresses: UserAddress[];
  deliveryAddresses: DeliveryAddress[];
}

export interface UserAddress {
  id: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  isPrimary: boolean;
}

export interface DeliveryAddress {
  id: string;
  name: string;
  phone: string | null;
  altPhone: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
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
