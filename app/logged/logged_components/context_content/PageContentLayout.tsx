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

      <div className="content-main flex-1 bg-white text-sm leading-normal text-black antialiased">
        {buttons && buttons.length > 0 && (
          <div className="flex flex-wrap justify-end gap-2 pr-4 pt-4 md:pr-6 md:pt-5">
            {buttons.map((btn, index) => {
              const baseStyles =
                "flex min-h-[36px] items-center rounded-md py-2 px-3 text-sm font-medium uppercase transition-colors cursor-pointer text-white";
              const variantStyles =
                btn.variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-950/90 hover:bg-blue-900";
              const linkStyles = `${baseStyles} ${variantStyles}`;
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
