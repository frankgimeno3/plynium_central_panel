"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { FC, useState, useRef, useEffect } from "react";
import AuthenticationService from "@/app/service/AuthenticationService";
import NotificationsDropdown from "./NotificationsDropdown";

interface TopnavProps {}

const Topnav: FC<TopnavProps> = () => {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await AuthenticationService.logout();
    router.replace("/");
  };

  return (
    <nav className="flex flex-row bg-blue-950 text-gray-200 justify-between items-center p-12 relative">
      <Link href="/logged" className="text-3xl hover:text-white cursor-pointer">
        Plynium Central Panel
      </Link>

      <div className="flex items-center gap-4">
        <Link
          href="/logged/pages/mediateca"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Mediateca
        </Link>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white transition-colors"
            aria-expanded={notificationsOpen}
            aria-haspopup="true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Notifications
          </button>
          {notificationsOpen && (
            <NotificationsDropdown onClose={() => setNotificationsOpen(false)} />
          )}
        </div>

        <button
          className="bg-white text-blue-950 cursor-pointer hover:bg-gray-100/80 px-5 py-1 rounded-xl shadow-xl"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Topnav;
