"use client";

import Link from "next/link";
import { FC } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MiddleNavProps {
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
}

const MiddleNav: FC<MiddleNavProps> = ({ pageTitle, breadcrumbs }) => {
  const withHome: BreadcrumbItem[] = [
    { label: "Home", href: "/logged" },
    ...breadcrumbs,
  ];

  return (
    <div className="flex flex-row items-center justify-between bg-gradient-to-r from-zinc-700  to-gray-800 px-8 py-5 text-white  ">
      <p className="text-xl text-zinc-100 uppercase"       aria-label="Main navigation"
      >{pageTitle}</p>
      <nav className="flex items-center gap-0 text-md" aria-label="Breadcrumb">
        {withHome.map((item, index) => (
          <span key={index} className="flex items-center gap-0">
            {index > 0 && <span className="text-blue-200/80 px-1">&gt;</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="bg-gray-100/20 hover:bg-gray-100/30 px-2 py-0.5 rounded transition-colors text-blue-100 hover:text-white"
              >
                {item.label}
              </Link>
            ) : (
              <span className="bg-gray-100/20 px-2 py-0.5 rounded text-white">
                {item.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </div>
  );
};

export default MiddleNav;
