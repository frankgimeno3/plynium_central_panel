"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { FC, useMemo, useState, useEffect } from "react";
import AuthenticationService from "@/app/service/AuthenticationService";
import { useCompanyRequests } from "@/app/logged/pages/network/requests/hooks/useCompanyRequests";
import { useOtherRequests } from "@/app/logged/pages/network/requests/hooks/useOtherRequests";
import { useAdvertisements } from "@/app/logged/pages/network/requests/hooks/useAdvertisements";
import { fetchNotifications, getUnreadNotifications, type UnifiedNotification } from "@/app/contents/notifications.types";

interface TopnavProps {}

const NotificationsBadge: FC = () => {
  const { requests: companyRequests } = useCompanyRequests();
  const { requests: otherRequests } = useOtherRequests();
  const { counts: advCounts } = useAdvertisements();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications({ notification_type: 'notification' })
      .then((data) => {
        const unread = getUnreadNotifications(data).length;
        setUnreadCount(unread);
      })
      .catch(() => setUnreadCount(0));
  }, []);

  const totalPending = useMemo(() => {
    const company = companyRequests.filter((r) => r.request_state === "Pending").length;
    const other = otherRequests.filter((r) => r.request_state === "Pending").length;
    const adv = advCounts.pending;
    return company + other + adv + unreadCount;
  }, [companyRequests, otherRequests, advCounts.pending, unreadCount]);

  if (totalPending === 0) return null;
  return (
    <span className="absolute -bottom-3 -left-3 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-xl font-bold leading-none text-white py-4">
      {totalPending > 99 ? "99+" : totalPending}
    </span>
  );
};

const Topnav: FC<TopnavProps> = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await AuthenticationService.logout();
    router.replace("/");
  };

  return (
    <nav className="flex flex-row bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 text-gray-200 justify-between items-center p-12 relative ">
      <Link href="/logged" className="text-3xl font-semibold hover:text-white cursor-pointer">
        Plynium Central Panel
      </Link>

      <div className="flex items-center gap-4 text-lg uppercase">
        <Link
          href="/logged/pages/mediateca"
          className="cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Mediateca
        </Link>
        <Link
          href="/logged/pages/tickets"
          className="cursor-pointer relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors uppercase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <NotificationsBadge />
          Panel Tickets
        </Link>

        <button
            className="cursor-pointer flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors uppercase"
            onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Topnav;
