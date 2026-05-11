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

export interface ProjectSelectFilter {
  id: string;
  title: string;
  status: string;
  service: string;
  contract: string;
}

export interface ProjectSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectProject: (project: ProjectRow) => void;
  pageSize?: number;
  confirmLabel?: string;
  currentProjectId?: string | null;
}
