export interface GapCertificateFormData {
  deponentName: string;
  age: number | string;
  fatherName: string;
  relation?: 'son' | 'daughter';
  permanentAddress: string;
  lastQualification: string;
  institutionName: string;
  yearOfCompletion: string | number;
  gapFrom: string;
  gapTo: string;
  gapDuration: string;
  reasonForGap: string;
  admissionInstitution: string;
  verificationPlace: string;
  verificationDate: string;
  applicationDate: string;
  advocateName?: string;
  enrolmentNo?: string;
  advocateAddress?: string;
}
