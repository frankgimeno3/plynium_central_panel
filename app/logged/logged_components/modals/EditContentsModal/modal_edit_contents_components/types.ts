export interface EditContentsModalProps {
  isOpen: boolean;
  initialValue: string;
  title?: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
  isRichText?: boolean;
}
