export interface CompanyDirectorySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (companyId: string, commercialName?: string) => void;
}
