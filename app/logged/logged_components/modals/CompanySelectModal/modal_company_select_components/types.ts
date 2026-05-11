export const COMPANY_SELECT_PAGE_SIZE = 20;

export interface CompanyRow {
  companyId: string;
  commercialName: string;
  country: string;
  region: string;
  mainEmail: string;
}

export interface CompanySelectPublicationOption {
  portalId: number;
  portalName: string;
}

export interface CompanySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (payload: { companyId: string; commercialName: string }) => void;
  publications: CompanySelectPublicationOption[];
}
