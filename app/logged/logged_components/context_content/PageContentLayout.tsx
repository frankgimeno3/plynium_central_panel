"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePageContent } from "./PageContentContext";
import type { PageButton } from "./PageContentContext";
import { countPathSegmentsWithPage } from "./routeBreadcrumbConfig";
import MiddleNav from "../nav_components/MiddleNav";

export type { PageButton } from "./PageContentContext";

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className ?? "h-5 w-5"}
      aria-hidden
    >
      <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z" />
    </svg>
  );
}

function pageButtonClassName(btn: PageButton): string {
  const base =
    "flex min-h-[36px] items-center justify-center rounded-md py-2 text-sm font-medium uppercase transition-colors cursor-pointer text-white disabled:cursor-not-allowed disabled:opacity-60";
  if (btn.iconOnly && btn.icon === "save" && btn.saved) {
    return `${base} bg-green-600 px-3 hover:bg-green-700`;
  }
  if (btn.variant === "danger") {
    return `${base} bg-red-600 px-3 hover:bg-red-700`;
  }
  return `${base} bg-blue-950/90 px-3 hover:bg-blue-900`;
}

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
              const className = pageButtonClassName(btn);
              const label = btn.iconOnly && btn.icon === "save" ? btn.title ?? "Save" : btn.label;
              const content =
                btn.iconOnly && btn.icon === "save" ? <SaveIcon /> : btn.label;
              return btn.onClick ? (
                <button
                  key={index}
                  type="button"
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  className={className}
                  title={btn.title}
                  aria-label={label}
                >
                  {content}
                </button>
              ) : btn.href ? (
                <Link key={index} href={btn.href} className={className} title={btn.title}>
                  {content}
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
