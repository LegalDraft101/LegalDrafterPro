import { generateAffidavit, GenerationResult } from '../../document.service';
import type { NameDifferenceFormData } from './name-difference.schema';

export async function createNameDifferenceDraft(data: NameDifferenceFormData, userId: string): Promise<GenerationResult> {
  return generateAffidavit('name-difference', data as unknown as Record<string, unknown>, userId);
}
