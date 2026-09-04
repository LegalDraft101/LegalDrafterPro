export interface RentAgreementFormData {
  landlordName: string;
  tenantName: string;
  propertyAddress: string;
  monthlyRent: number | string;
  securityDeposit: number | string;
  agreementStartDate: string;
  durationMonths: number | string;
}
