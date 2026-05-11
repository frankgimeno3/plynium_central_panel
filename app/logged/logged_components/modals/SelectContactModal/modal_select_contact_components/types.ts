export type ContactRow = {
  id_contact: string;
  name?: string;
  email?: string;
  role?: string;
};

export type ContactFilterState = {
  id: string;
  name: string;
  email: string;
};

export type SelectContactModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (contact: ContactRow) => void;
};
