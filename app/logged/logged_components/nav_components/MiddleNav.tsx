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
      <nav className="flex items-center gap-0 text-md pr-4" aria-label="Breadcrumb">
        {withHome.map((item, index) => (
          <span key={index} className="flex items-center gap-0">
            {index > 0 && <span className="text-blue-200/80 px-1">&gt;</span>}
            {item.href ? (
              <Link
                href={item.href}
                className="flex min-h-[36px] items-center rounded-md  py-2 px-4 text-sm font-medium uppercase  transition-colors cursor-pointer text-white bg-gray-300/50  hover:bg-gray-300/60 "
              >
                {item.label}
              </Link>
            ) : (
              <span className="flex min-h-[36px] items-center rounded-md  py-2 px-4 text-sm font-medium uppercase  transition-colors cursor-pointer text-white bg-gray-300/50  hover:bg-gray-300/60 ">
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
