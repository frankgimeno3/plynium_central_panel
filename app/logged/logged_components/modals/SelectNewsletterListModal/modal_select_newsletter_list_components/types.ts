export type NewsletterListRow = {
  userList_id: string;
  userListName?: string;
  userListPortal?: string;
  userListTopic?: string;
  listUserIdsArray?: string[];
  portalId?: number | null;
  newsletterListType?: "main" | "specific" | string;
  userListDescription?: string;
};

export type NewsletterListFilterState = {
  id: string;
  name: string;
  usersSummary: string;
  topic: string;
};

export type SelectNewsletterListModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (list: NewsletterListRow) => void;
  portalIdFilter?: number | null;
};
