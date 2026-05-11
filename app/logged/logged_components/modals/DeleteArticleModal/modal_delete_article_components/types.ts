export interface DeleteArticleModalProps {
  isOpen: boolean;
  articleTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}
