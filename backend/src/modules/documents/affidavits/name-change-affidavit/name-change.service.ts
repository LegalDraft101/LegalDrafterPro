import { getFormatWithContent } from '../common/affidavit.service';
import type { NameChangeAffidavitFormData } from './name-change.schema';

export async function processNameChangeAffidavit(data: NameChangeAffidavitFormData) {
  const format = await getFormatWithContent('name-change');
  return { format, submittedData: data };
}
