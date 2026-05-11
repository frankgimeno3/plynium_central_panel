"use client";

import Link from "next/link";
import { FC } from "react";

type NavLinkProps = {
  href: string;
  label: string;
  active: boolean;
};

const NavLink: FC<NavLinkProps> = ({ href, label, active }) => (
  <Link
    href={href}
    prefetch={false}
    className={`flex min-h-[36px] items-center rounded-r-md border-l-2 py-2 pl-3 pr-4 text-sm uppercase transition-colors ${
      active
        ? "border-blue-500 bg-blue-950/40 font-medium text-blue-300"
        : "border-transparent text-gray-400 hover:bg-gray-800 hover:text-gray-100"
    }`}
  >
    {label}
  </Link>
);

export default NavLink;
