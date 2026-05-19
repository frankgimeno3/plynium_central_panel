export interface ProjectRow {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service: string;
  publication_date: string | null;
  publication_id: string | null;
  publication_slot_id: number | null;
}

export interface ContractRow {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  agent: string;
  process_state: string;
  payment_state: string;
  title: string;
  amount_eur: number;
}

export interface ProjectSelectFilter {
  id: string;
  title: string;
  status: string;
  service: string;
  contract: string;
}

export interface ContractSelectFilter {
  id: string;
  title: string;
  customer: string;
  processState: string;
  paymentState: string;
}

export interface ProjectSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectRow) => void;
  pageSize?: number;
  confirmLabel?: string;
  currentProjectId?: string | null;
  /** Tailwind z-index class when stacking above another modal (e.g. `z-[100]`). */
  overlayZIndexClass?: string;
}
