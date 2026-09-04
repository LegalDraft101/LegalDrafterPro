import { getFormatWithContent } from '../common/affidavit.service';
import type { FeeRemissionAffidavitFormData } from './fee-remission.schema';

export async function processFeeRemissionAffidavit(data: FeeRemissionAffidavitFormData) {
  const format = await getFormatWithContent('fee-remission');
  return { format, submittedData: data };
}
