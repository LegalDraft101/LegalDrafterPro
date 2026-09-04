export interface DraftSubmission {
  typeId: string;
  draftId: string;
  submittedAt: string;
  formData: Record<string, unknown>;
}
