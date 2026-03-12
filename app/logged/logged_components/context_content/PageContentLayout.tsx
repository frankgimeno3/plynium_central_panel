"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePageContent } from "./PageContentContext";
import { countPathSegmentsWithPage } from "./routeBreadcrumbConfig";
import MiddleNav from "../nav_components/MiddleNav";

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
    <div className="flex flex-col w-full min-h-full ">
      <MiddleNav pageTitle={pageTitle} breadcrumbs={filteredBreadcrumbs} />

      <div className="flex-1 bg-white text-black content-main ">
        {buttons && buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end pr-12 pt-12">
            {buttons.map((btn, index) => {
              const linkStyles =
                "flex min-h-[36px] items-center rounded-md  py-2 px-3 text-sm font-medium uppercase  transition-colors cursor-pointer text-white bg-blue-950/90  hover:bg-blue-900 ";
              return btn.onClick ? (
                <button
                  key={index}
                  type="button"
                  onClick={btn.onClick}
                  className={linkStyles}
                >
                  {btn.label}
                </button>
              ) : btn.href ? (
                <Link key={index} href={btn.href} className={linkStyles}>
                  {btn.label}
                </Link>
              ) : null;
            })}
          </div>
        )}

        <div className="flex flex-col   ">
          {children}
        </div>
      </div>
    </div>
  );
}
