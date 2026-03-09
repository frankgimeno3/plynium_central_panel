"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import MiddleNav, { BreadcrumbItem } from "./MiddleNav";

export interface PageButton {
  label: string;
  href: string;
}

interface PageContentLayoutProps {
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  buttons?: PageButton[];
  children: ReactNode;
}

const PageContentLayout: FC<PageContentLayoutProps> = ({
  pageTitle,
  breadcrumbs,
  buttons,
  children,
}) => {
  return (
    <div className="flex flex-col w-full min-h-full bg-white">
      <MiddleNav pageTitle={pageTitle} breadcrumbs={breadcrumbs} />

      <div className="flex-1 p-6 bg-gray-100">
        {buttons && buttons.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 justify-end">
            {buttons.map((btn, index) => (
              <Link
                key={index}
                href={btn.href}
                className="bg-blue-950 text-white text-xs px-4 py-2 rounded-xl shadow hover:bg-blue-950/80 inline-block transition-colors"
              >
                {btn.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContentLayout;
