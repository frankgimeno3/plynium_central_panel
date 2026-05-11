"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC } from "react";
import AuthenticationService from "@/app/service/AuthenticationService";
import TopnavActions from "./nav_top_components/TopnavActions";

const Topnav: FC = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await AuthenticationService.logout();
    } finally {
      if (typeof window !== "undefined") {
        window.location.assign("/");
        return;
      }
      router.replace("/");
    }
  };

  return (
    <nav className="relative flex flex-row items-center justify-between bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 px-4 py-3 text-gray-200 md:px-6 md:py-3.5">
      <Link href="/logged" className="text-xl font-semibold hover:text-white cursor-pointer md:text-2xl">
        Plynium Central Panel
      </Link>
      <TopnavActions onLogout={handleLogout} />
    </nav>
  );
};

export default Topnav;
