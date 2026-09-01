/**
 * Single source of truth for left nav and midnav (breadcrumb) labels.
 * Update this index when changing nav labels; both Leftnav and MiddleNav use it.
 */

const BASE = "/logged/pages" as const;

/** Path prefix -> label for breadcrumb and left nav. Longest match wins. */
export const NAV_ROUTE_LABELS: Record<string, string> = {
  [`${BASE}/network/contents/articles`]: "Articles",
  [`${BASE}/network/contents/banners`]: "Banners",
  [`${BASE}/network/contents/events`]: "Events",
  [`${BASE}/network/contents/topics`]: "Content Topics",
  [`${BASE}/tickets`]: "Tickets",
  [`${BASE}/network/directory/companies`]: "Published Companies",
  [`${BASE}/network/directory/products`]: "Published Products",
  [`${BASE}/network/portals`]: "Published Portals",
  [`${BASE}/network/users/lists`]: "User Lists",
  [`${BASE}/network/user_lists`]: "User Lists",
  [`${BASE}/network/users`]: "Registered Users",
  [`${BASE}/account-management/customers_db`]: "Customers DB",
  [`${BASE}/account-management/contacts_db`]: "Contacts DB",
  [`${BASE}/account-management/proposals`]: "Proposals",
  [`${BASE}/account-management/contracts`]: "Contracts",
  [`${BASE}/account-management/projects`]: "Projects",
  [`${BASE}/production/services`]: "Services",
  [`${BASE}/production/newsletters`]: "Newsletters",
  [`${BASE}/production/newsletters/create`]: "Create newsletter campaign",
  [`${BASE}/production/publications`]: "Publications",
  [`${BASE}/production/publications/magazines`]: "Magazine titles",
  [`${BASE}/production/publications/issues`]: "Issues",
  [`${BASE}/production/publications/preferential-pages`]: "Preferential pages",
  [`${BASE}/administration`]: "Orders",
  [`${BASE}/administration/banks`]: "Banks",
  [`${BASE}/administration/issued-invoices`]: "Issued invoices",
  [`${BASE}/administration/provider-invoices`]: "Provider invoices",
  [`${BASE}/administration/providers`]: "Providers",
  [`${BASE}/administration/agents`]: "Agents",
  [`${BASE}/frank/pm/proyectos`]: "Proyectos",
  [`${BASE}/frank/pm/tareas`]: "Tareas",
  [`${BASE}/frank/srm/entidades`]: "Entidades",
  [`${BASE}/frank/auto-wiki/documentacion`]: "Documentación",
  [`${BASE}/frank/auto-wiki/estado-actual-temas`]: "Estado actual temas",
};

const sortedPaths = Object.keys(NAV_ROUTE_LABELS).sort((a, b) => b.length - a.length);

export function getNavLabelForPath(path: string): string | undefined {
  if (!path) return undefined;
  const normalized = path.replace(/\/+$/, "");
  for (const prefix of sortedPaths) {
    if (normalized === prefix || normalized.startsWith(`${prefix}/`)) {
      return NAV_ROUTE_LABELS[prefix];
    }
  }
  return undefined;
}

const USERS_INDEX = `${BASE}/network/users` as const;
const USER_LISTS_INDEX = `${BASE}/network/user_lists` as const;
const USER_LISTS_DETAIL_PREFIX = `${BASE}/network/users/lists` as const;

export function isPlyniumNetworkDirectoryLeafActive(href: string, pathname: string): boolean {
  if (href === USERS_INDEX) {
    return pathname.startsWith(USERS_INDEX) && !pathname.startsWith(USER_LISTS_DETAIL_PREFIX);
  }
  if (href === USER_LISTS_INDEX) {
    return pathname.startsWith(USER_LISTS_INDEX) || pathname.startsWith(USER_LISTS_DETAIL_PREFIX);
  }
  return pathname.startsWith(href);
}

export const PLYNIUM_NETWORK_LINKS = [
  { href: `${BASE}/network/contents/articles`, label: "Articles" },
  { href: `${BASE}/network/contents/banners`, label: "Banners" },
  { href: `${BASE}/network/contents/events`, label: "Events" },
  { href: `${BASE}/network/contents/topics`, label: "Content Topics" },
  { href: `${BASE}/network/directory/companies`, label: "Published Companies" },
  { href: `${BASE}/network/directory/products`, label: "Published Products" },
  { href: `${BASE}/network/portals`, label: "Published Portals" },
  { href: `${BASE}/network/users`, label: "Registered Users" },
  { href: `${BASE}/network/user_lists`, label: "User Lists" },
] as const;

export const PLYNIUM_NETWORK_GROUPS = [
  { pathPrefix: `${BASE}/network/contents`, label: "Contents", linkStart: 0, linkEnd: 4 },
] as const;
