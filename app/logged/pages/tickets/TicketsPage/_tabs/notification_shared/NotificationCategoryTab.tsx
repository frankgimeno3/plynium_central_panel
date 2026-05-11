"use client";

import NotificationSubTabBar, {
  type NotificationSubTabKey,
} from "./notification_category_tab_components/NotificationSubTabBar";
import NotificationTicketsTable, {
  type MappedNotificationRow,
} from "./notification_category_tab_components/NotificationTicketsTable";

export type { MappedNotificationRow, NotificationSubTabKey };

type Props = {
  notifications: MappedNotificationRow[];
  currentSubTab: NotificationSubTabKey;
  onSubTabChange: (key: NotificationSubTabKey) => void;
  formatNotificationTime: (dateStr: string) => string;
};

export default function NotificationCategoryTab({
  notifications,
  currentSubTab,
  onSubTabChange,
  formatNotificationTime,
}: Props) {
  return (
    <div className="p-6">
      <NotificationSubTabBar currentSubTab={currentSubTab} onSubTabChange={onSubTabChange} />
      <NotificationTicketsTable rows={notifications} formatNotificationTime={formatNotificationTime} />
    </div>
  );
}
