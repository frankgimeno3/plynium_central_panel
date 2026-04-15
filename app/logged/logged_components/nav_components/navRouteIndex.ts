"use client";

/**
 * Single source of truth for left nav and midnav (breadcrumb) labels.
 * Update this index when changing nav labels; both Leftnav and MiddleNav use it.
 */

const BASE = "/logged/pages" as const;

/** Path prefix -> label for breadcrumb and left nav. Longest match wins. */
export const NAV_ROUTE_LABELS: Record<string, string> = {
  // Plynium Network – Contents
  [`${BASE}/network/contents/articles`]: "Articles",
  [`${BASE}/network/contents/banners`]: "Banners",
  [`${BASE}/network/contents/events`]: "Events",
  [`${BASE}/network/contents/topics`]: "Content Topics",
  // Communications (Topnav)
  [`${BASE}/communications`]: "Communications",
  [`${BASE}/communications/company`]: "Company Creation Requests",
  [`${BASE}/communications/quotations`]: "Advertisement quotations",
  [`${BASE}/communications/other`]: "Other Communications",
  // Plynium Network – Directory & rest
  [`${BASE}/network/directory/companies`]: "Published Companies",
  [`${BASE}/network/directory/products`]: "Published Products",
  [`${BASE}/network/portals`]: "Published Portals",
  [`${BASE}/network/users`]: "Registered Users",
  // Account Management
  [`${BASE}/account-management/customers_db`]: "Customers DB",
  [`${BASE}/account-management/contacts_db`]: "Contacts DB",
  [`${BASE}/account-management/proposals`]: "Proposals",
  [`${BASE}/account-management/contracts`]: "Contracts",
  [`${BASE}/account-management/projects`]: "Projects",
  // Production
  [`${BASE}/production/services`]: "Services",
  [`${BASE}/production/newsletters`]: "Newsletters",
  [`${BASE}/production/newsletters/create`]: "Create newsletter campaign",
  [`${BASE}/production/publications`]: "Publications",
  [`${BASE}/production/publications/magazines`]: "Magazines",
  [`${BASE}/production/publications/issues`]: "Issues",
  // Administration
  [`${BASE}/administration`]: "Orders",
  [`${BASE}/administration/banks`]: "Banks",
  [`${BASE}/administration/issued-invoices`]: "Issued invoices",
  [`${BASE}/administration/provider-invoices`]: "Provider invoices",
  [`${BASE}/administration/providers`]: "Providers",
  [`${BASE}/administration/agents`]: "Agents",
};

/** Sorted path prefixes by length descending for longest-match lookup */
const _sortedPaths = Object.keys(NAV_ROUTE_LABELS).sort((a, b) => b.length - a.length);

/**
 * Returns the nav label for a given path (e.g. breadcrumb href).
 * Uses longest matching prefix so /logged/pages/network/directory/companies/123 → "Published Companies".
 */
export function getNavLabelForPath(path: string): string | undefined {
  if (!path) return undefined;
  const normalized = path.replace(/\/+$/, "");
  for (const prefix of _sortedPaths) {
    if (normalized === prefix || normalized.startsWith(prefix + "/")) {
      return NAV_ROUTE_LABELS[prefix];
    }
  }
  return undefined;
}

/** Plynium Network section: link items (href + label) for left nav and for building the labels map */
export const PLYNIUM_NETWORK_LINKS = [
  // Contents (expandable) – sub-items
  { href: `${BASE}/network/contents/articles`, label: "Articles" },
  { href: `${BASE}/network/contents/banners`, label: "Banners" },
  { href: `${BASE}/network/contents/events`, label: "Events" },
  { href: `${BASE}/network/contents/topics`, label: "Content Topics" },
  // Directory & rest (no Requests – moved to Communications in Topnav)
  { href: `${BASE}/network/directory/companies`, label: "Published Companies" },
  { href: `${BASE}/network/directory/products`, label: "Published Products" },
  { href: `${BASE}/network/portals`, label: "Published Portals" },
  { href: `${BASE}/network/users`, label: "Registered Users" },
] as const;

/** Grouping for left nav: path prefix that starts a sub-section (Contents only; Requests removed) */
export const PLYNIUM_NETWORK_GROUPS = [
  { pathPrefix: `${BASE}/network/contents`, label: "Contents", linkStart: 0, linkEnd: 4 },
] as const;
