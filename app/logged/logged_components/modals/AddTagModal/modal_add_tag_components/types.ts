export interface AddTagModalProps {
  isOpen: boolean;
  initialValue?: string;
  onSave: (newTag: string) => void;
  onCancel: () => void;
}
