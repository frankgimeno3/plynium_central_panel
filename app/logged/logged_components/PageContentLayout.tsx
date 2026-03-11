"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MiddleNav from "./MiddleNav";
import { usePageContent } from "./PageContentContext";
import { countPathSegmentsWithPage } from "./routeBreadcrumbConfig";

export type { PageButton } from "./PageContentContext";

interface PageContentLayoutProps {
  children: ReactNode;
}

export default function PageContentLayout({ children }: PageContentLayoutProps) {
  const { meta } = usePageContent();
  const pathname = usePathname();
  const { pageTitle, breadcrumbs, buttons } = meta;

  // Only show breadcrumbs for path segments that have a page.tsx (skip layout-only segments)
  const segmentsWithPage = countPathSegmentsWithPage(pathname ?? "");
  const filteredBreadcrumbs =
    Array.isArray(breadcrumbs) && segmentsWithPage > 0
      ? breadcrumbs.slice(-segmentsWithPage)
      : breadcrumbs;

  return (
    <div className="flex flex-col w-full min-h-full bg-white">
      <MiddleNav pageTitle={pageTitle} breadcrumbs={filteredBreadcrumbs} />

      <div className="flex-1 p-6 bg-gray-100">
        {buttons && buttons.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 justify-end">
            {buttons.map((btn, index) =>
              btn.onClick ? (
                <button
                  key={index}
                  type="button"
                  onClick={btn.onClick}
                  className="bg-blue-950 text-white text-base font-medium px-4 py-2 rounded-xl shadow hover:bg-blue-950/80 inline-block transition-colors cursor-pointer"
                >
                  {btn.label}
                </button>
              ) : btn.href ? (
                <Link
                  key={index}
                  href={btn.href}
                  className="bg-blue-950 text-white text-base font-medium px-4 py-2 rounded-xl shadow hover:bg-blue-950/80 inline-block transition-colors cursor-pointer"
                >
                  {btn.label}
                </Link>
              ) : null
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}
