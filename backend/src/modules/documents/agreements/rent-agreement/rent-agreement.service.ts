import { getFormatWithContent } from '../common/agreement.service';
import type { RentAgreementFormData } from './rent-agreement.schema';

export async function processRentAgreement(data: RentAgreementFormData) {
  const format = await getFormatWithContent('rent-agreement');
  return { format, submittedData: data };
}
