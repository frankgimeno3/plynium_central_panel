"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "../nav_components/MiddleNav";

export interface PageButton {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "danger";
}

export interface PageMeta {
  pageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  buttons?: PageButton[];
}

interface PageContentContextValue {
  meta: PageMeta;
  setPageMeta: (meta: Partial<PageMeta>) => void;
}

const defaultMeta: PageMeta = {
  pageTitle: "",
  breadcrumbs: [],
  buttons: [],
};

function breadcrumbsEqual(a: BreadcrumbItem[], b: BreadcrumbItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    if (String(a[i]?.label) !== String(b[i]?.label)) return false;
    if (String(a[i]?.href ?? "") !== String(b[i]?.href ?? "")) return false;
  }
  return true;
}

function buttonsEqual(a: PageButton[] | undefined, b: PageButton[] | undefined): boolean {
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa === bb) return true;
  if (aa.length !== bb.length) return false;
  for (let i = 0; i < aa.length; i++) {
    if (aa[i] === bb[i]) continue;
    if (String(aa[i]?.label) !== String(bb[i]?.label)) return false;
    if (String(aa[i]?.href ?? "") !== String(bb[i]?.href ?? "")) return false;
    if (aa[i]?.variant !== bb[i]?.variant) return false;
    if (aa[i]?.onClick !== bb[i]?.onClick) return false;
  }
  return true;
}

const PageContentContext = createContext<PageContentContextValue | null>(null);

export function PageContentProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);

  const setPageMeta = useCallback((next: Partial<PageMeta>) => {
    setMeta((prev) => {
      const nextTitle = next.pageTitle ?? prev.pageTitle;
      const nextBreadcrumbs = next.breadcrumbs ?? prev.breadcrumbs;
      const nextButtons =
        next.buttons !== undefined ? next.buttons : prev.buttons;
      // Shallow compare only (no JSON.stringify): deep/circular structures can overflow the stack.
      if (
        nextTitle === prev.pageTitle &&
        breadcrumbsEqual(nextBreadcrumbs, prev.breadcrumbs) &&
        buttonsEqual(nextButtons, prev.buttons)
      ) {
        return prev;
      }
      return {
        pageTitle: nextTitle,
        breadcrumbs: nextBreadcrumbs,
        buttons: nextButtons,
      };
    });
  }, []);

  const contextValue = useMemo(
    () => ({ meta, setPageMeta }),
    [meta, setPageMeta]
  );

  return (
    <PageContentContext.Provider value={contextValue}>
      {children}
    </PageContentContext.Provider>
  );
}

export function usePageContent(): PageContentContextValue {
  const ctx = useContext(PageContentContext);
  if (!ctx) {
    throw new Error("usePageContent must be used within PageContentProvider");
  }
  return ctx;
}
