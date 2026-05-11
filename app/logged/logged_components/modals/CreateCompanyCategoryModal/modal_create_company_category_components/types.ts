export interface CompanyCategory {
  category_id: string;
  category_name: string;
  category_description?: string;
  portals_array: string[];
}

export interface CreateCompanyCategoryModalProps {
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onCreated: () => void;
}
