"use client";

import Link from "next/link";
import { FC } from "react";
import type { BreadcrumbItem } from "./types";

type MiddleNavBreadcrumbsProps = {
  breadcrumbs: BreadcrumbItem[];
};

const MiddleNavBreadcrumbs: FC<MiddleNavBreadcrumbsProps> = ({ breadcrumbs }) => {
  const withHome: BreadcrumbItem[] = [{ label: "Home", href: "/logged" }, ...breadcrumbs];

  return (
    <nav className="flex items-center gap-0 pr-2 text-sm md:pr-4" aria-label="Breadcrumb">
      {withHome.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-0">
          {index > 0 ? <span className="text-blue-200/80 px-1">&gt;</span> : null}
          {item.href ? (
            <Link
              href={item.href}
              className="flex min-h-[36px] items-center rounded-md py-2 px-4 text-sm font-medium uppercase transition-colors cursor-pointer text-white bg-gray-300/50 hover:bg-gray-300/60"
            >
              {item.label}
            </Link>
          ) : (
            <span className="flex min-h-[36px] items-center rounded-md py-2 px-4 text-sm font-medium uppercase transition-colors cursor-pointer text-white bg-gray-300/50 hover:bg-gray-300/60">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default MiddleNavBreadcrumbs;
