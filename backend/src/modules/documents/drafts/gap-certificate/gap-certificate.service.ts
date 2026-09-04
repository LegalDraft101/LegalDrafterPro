import { generateAffidavit, GenerationResult } from '../../document.service';
import type { GapCertificateFormData } from './gap-certificate.schema';

export async function createGapCertificateDraft(data: GapCertificateFormData): Promise<GenerationResult> {
  return generateAffidavit('gap-certificate', data as unknown as Record<string, unknown>);
}
