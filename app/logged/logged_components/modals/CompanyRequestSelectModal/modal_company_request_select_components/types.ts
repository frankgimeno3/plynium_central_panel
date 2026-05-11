import type { CompanyRequest } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";

export interface CompanyRequestSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (request: CompanyRequest) => void;
}
