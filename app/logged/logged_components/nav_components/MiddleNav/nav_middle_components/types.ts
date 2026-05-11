export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface MiddleNavProps {
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
}
