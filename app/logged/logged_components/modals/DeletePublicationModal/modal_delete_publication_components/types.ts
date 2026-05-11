export interface DeletePublicationModalProps {
  isOpen: boolean;
  publicationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}
