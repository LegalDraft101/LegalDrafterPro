import { request, buildUrl } from './client';
import type { DraftType, FormSchema } from './types';

export const draftingApi = {
  getAffidavitTypes: () =>
    request<DraftType[]>('/api/affidavit-types'),

  getAffidavitForm: (typeId: string) =>
    request<FormSchema>(`/api/affidavit-forms/${encodeURIComponent(typeId)}`),

  getRentAgreementTypes: () =>
    request<DraftType[]>('/api/rent-agreement-types'),

  getRentAgreementForm: (typeId: string) =>
    request<FormSchema>(`/api/rent-agreement-forms/${encodeURIComponent(typeId)}`),

  /** Generate an affidavit document from form data. Returns a Blob for download. */
  generateAffidavit: async (typeId: string, formData: Record<string, unknown>): Promise<{ blob: Blob; draftId: string; filename: string }> => {
    const res = await fetch(buildUrl(`/api/affidavit/generate/${encodeURIComponent(typeId)}`), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Generation failed' }));
      throw new Error((errData as { error?: string }).error ?? `Request failed: ${res.status}`);
    }
    const blob = await res.blob();
    const draftId = res.headers.get('X-Draft-Id') ?? 'affidavit';
    const filename = `${draftId}.docx`;
    return { blob, draftId, filename };
  },

  /** Trigger browser download from a Blob. */
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /** Upload a supporting document (Aadhaar, etc.). Returns file metadata. */
  uploadDocument: async (file: File): Promise<{ fileId: string; originalName: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(buildUrl('/api/upload-document'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { fileId?: string; originalName?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? `Upload failed: ${res.status}`);
    return { fileId: data.fileId ?? '', originalName: data.originalName ?? file.name };
  },

  /** Extract text from any supported file (PDF, DOCX, image). Field name: "file". */
  extractContentFromFile: async (file: File): Promise<{ text: string; sourceType: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(buildUrl('/api/extract-content'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { text?: string; sourceType?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
    return { text: data.text ?? '', sourceType: data.sourceType ?? 'unknown' };
  },

  /** Legacy: upload image and get extracted text via OCR. Field name: "image". */
  extractTextFromImage: async (file: File): Promise<{ text: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(buildUrl('/api/ocr'), {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
    return { text: data.text ?? '' };
  },
};
