export interface CompaniesDbRow {
  companyId: string;
  commercialName: string;
  country: string;
  region?: string;
}

export interface CompaniesDbSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (payload: { companyId: string; commercialName: string; country?: string }) => void;
}

export const PAGE_SIZE = 10;
