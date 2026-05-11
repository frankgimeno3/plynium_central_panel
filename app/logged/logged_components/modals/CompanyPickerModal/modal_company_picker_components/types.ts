export type CompanyPickerRow = {
  companyId: string;
  commercialName: string;
  country: string;
  region: string;
};

export interface CompanyPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional list of company IDs to hide (already linked). */
  excludeCompanyIds?: string[];
  onSelectCompany: (row: { companyId: string; commercialName: string }) => void;
  confirmLabel?: string;
}

export const COMPANY_PICKER_PAGE_SIZE = 15;
