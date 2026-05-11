export interface CustomerRow {
  id_customer: string;
  name: string;
  cif: string;
  country: string;
  contact?: { name: string; role: string; email: string; phone: string };
  proposals?: string[];
  contracts?: string[];
  projects?: string[];
}

export interface CustomerSelectFilterState {
  id: string;
  name: string;
  cif: string;
  country: string;
}

export interface CustomerSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerRow) => void;
  pageSize?: number;
  confirmLabel?: string;
}
