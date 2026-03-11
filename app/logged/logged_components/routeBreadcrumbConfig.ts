"use client";

/**
 * Path prefixes (relative to /logged/pages) that do NOT have a page.tsx.
 * These segments are layout-only and should never appear as breadcrumbs.
 * Add here any route prefix where the folder has no page.tsx (only layout or children with pages).
 */
const ROUTE_PREFIXES_WITHOUT_PAGE = new Set([
  "network",
  "network/directory",
  "network/contents",
]);

const BASE_PATH = "/logged/pages";

/**
 * Returns the number of path segments that have a page (i.e. are not in ROUTE_PREFIXES_WITHOUT_PAGE).
 * Breadcrumbs should show only the last `count` items, so we only show segments that have a page.
 */
export function countPathSegmentsWithPage(pathname: string): number {
  const normalized = pathname.startsWith(BASE_PATH)
    ? pathname.slice(BASE_PATH.length).replace(/^\/+/, "")
    : pathname.replace(/^\/+/, "");
  if (!normalized) return 0;

  const segments = normalized.split("/").filter(Boolean);
  let prefix = "";
  let withPage = 0;
  for (let i = 0; i < segments.length; i++) {
    prefix = prefix ? `${prefix}/${segments[i]}` : segments[i];
    if (!ROUTE_PREFIXES_WITHOUT_PAGE.has(prefix)) {
      withPage++;
    }
  }
  return withPage;
}
