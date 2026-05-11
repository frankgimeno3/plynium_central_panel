"use client";

import Link from "next/link";
import { FC } from "react";
import NotificationsBadge from "./NotificationsBadge";

type TopnavActionsProps = {
  onLogout: () => void;
};

const TopnavActions: FC<TopnavActionsProps> = ({ onLogout }) => (
  <div className="flex items-center gap-2 text-sm uppercase md:gap-3 md:text-base">
    <Link
      href="/logged/pages/mediateca"
      className="cursor-pointer flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-gray-200 transition-colors hover:bg-white/20 hover:text-white md:gap-2.5 md:px-4 md:py-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0 md:h-6 md:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
        />
      </svg>
      Mediateca
    </Link>
    <Link
      href="/logged/pages/tickets"
      className="relative flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-gray-200 uppercase transition-colors hover:bg-white/20 hover:text-white md:gap-2.5 md:px-4 md:py-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 shrink-0 md:h-6 md:w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <NotificationsBadge />
      Panel Tickets
    </Link>
    <button
      type="button"
      className="flex cursor-pointer items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-gray-200 uppercase transition-colors hover:bg-white/20 hover:text-white md:gap-2.5 md:px-4 md:py-2"
      onClick={onLogout}
    >
      Log out
    </button>
  </div>
);

export default TopnavActions;
