"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "../nav_components/MiddleNav";

export interface PageButton {
  label: string;
  href?: string;
  onClick?: () => void;
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

const PageContentContext = createContext<PageContentContextValue | null>(null);

export function PageContentProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<PageMeta>(defaultMeta);

  const setPageMeta = useCallback((next: Partial<PageMeta>) => {
    setMeta((prev) => {
      const nextTitle = next.pageTitle ?? prev.pageTitle;
      const nextBreadcrumbs = next.breadcrumbs ?? prev.breadcrumbs;
      const nextButtons =
        next.buttons !== undefined ? next.buttons : prev.buttons;
      // Only update if content changed (avoids loops when deps are new refs every render)
      if (
        nextTitle === prev.pageTitle &&
        JSON.stringify(nextBreadcrumbs) === JSON.stringify(prev.breadcrumbs) &&
        JSON.stringify(nextButtons) === JSON.stringify(prev.buttons)
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

  return (
    <PageContentContext.Provider value={{ meta, setPageMeta }}>
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
