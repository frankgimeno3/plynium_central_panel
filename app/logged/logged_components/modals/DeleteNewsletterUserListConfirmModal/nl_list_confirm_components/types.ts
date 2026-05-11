export type DeleteNewsletterUserListConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  /** newsletter_user_list_id (UUID) */
  listId: string;
  listName: string;
  /** Called after successful DELETE (e.g. redirect). */
  onDeleted: () => void;
};
