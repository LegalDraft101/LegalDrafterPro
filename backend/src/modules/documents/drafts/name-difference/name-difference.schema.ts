export interface NameDifferenceFormData {
  deponentName: string;
  age: number | string;
  fatherName: string;
  relation?: 'son' | 'daughter';
  permanentAddress: string;
  nameInFirstDoc: string;
  firstDocumentName: string;
  nameInSecondDoc: string;
  secondDocumentName: string;
  correctName: string;
  verificationPlace: string;
  verificationDate: string;
  applicationDate: string;
  advocateName?: string;
  enrolmentNo?: string;
  advocateAddress?: string;
}
