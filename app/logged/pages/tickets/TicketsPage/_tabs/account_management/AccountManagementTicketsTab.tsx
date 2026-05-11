"use client";

import NotificationCategoryTab, {
  type MappedNotificationRow,
  type NotificationSubTabKey,
} from "../notification_shared/NotificationCategoryTab";

type Props = {
  notifications: MappedNotificationRow[];
  currentSubTab: NotificationSubTabKey;
  onSubTabChange: (key: NotificationSubTabKey) => void;
  formatNotificationTime: (dateStr: string) => string;
};

export default function AccountManagementTicketsTab(props: Props) {
  return <NotificationCategoryTab {...props} />;
}
