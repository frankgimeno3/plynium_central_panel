export interface ContactRow {
  id_contact: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  id_customer?: string;
  company_name?: string;
}

export const CONTACT_SELECT_PAGE_SIZE = 10;

export interface ContactSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectContact: (contact: ContactRow) => void;
  filterByCustomerId?: string;
  excludeContactIds?: string[];
}

export type ContactFilterState = { id: string; name: string; role: string; company: string };
