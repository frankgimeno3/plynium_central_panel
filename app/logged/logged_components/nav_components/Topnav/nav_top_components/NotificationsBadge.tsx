"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useAdvertisements } from "@/app/logged/pages/tickets/hooks/useAdvertisements";
import { useCompanyRequests } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import { useOtherRequests } from "@/app/logged/pages/tickets/hooks/useOtherRequests";
import {
  fetchNotifications,
  getUnreadNotifications,
} from "@/app/contents/notifications.types";

const NotificationsBadge: FC = () => {
  const { requests: companyRequests } = useCompanyRequests();
  const { requests: otherRequests } = useOtherRequests();
  const { counts: advCounts } = useAdvertisements();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications({ state: "unread" })
      .then((data) => {
        const unread = getUnreadNotifications(data).length;
        setUnreadCount(unread);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  const totalPending = useMemo(() => {
    const company = companyRequests.filter((request) => request.request_state === "Pending").length;
    const other = otherRequests.filter((request) => request.request_state === "Pending").length;
    const adv = advCounts.pending;
    return company + other + adv + unreadCount;
  }, [companyRequests, otherRequests, advCounts.pending, unreadCount]);

  if (totalPending === 0) return null;

  return (
    <span className="absolute -bottom-1 -left-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-none text-white">
      {totalPending > 99 ? "99+" : totalPending}
    </span>
  );
};

export default NotificationsBadge;
