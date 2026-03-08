/**
 * Shared types for API requests/responses.
 */

// ---- Auth ----
export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
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
