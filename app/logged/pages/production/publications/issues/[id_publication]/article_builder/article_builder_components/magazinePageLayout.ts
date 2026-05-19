export const MAGAZINE_PAGE_LAYOUTS = ["2_col_article", "3_col_article"] as const;

export type MagazinePageLayout = (typeof MAGAZINE_PAGE_LAYOUTS)[number];

export const DEFAULT_MAGAZINE_PAGE_LAYOUT: MagazinePageLayout = "2_col_article";

export function isMagazinePageLayout(value: string): value is MagazinePageLayout {
  return value === "2_col_article" || value === "3_col_article";
}

export function normalizeMagazinePageLayout(value: unknown): MagazinePageLayout {
  const s = String(value ?? "").trim();
  return isMagazinePageLayout(s) ? s : DEFAULT_MAGAZINE_PAGE_LAYOUT;
}

function isLayoutMetaEntry(obj: unknown): obj is { _meta: true; magazine_page_layout?: string } {
  return Boolean(obj && typeof obj === "object" && (obj as { _meta?: unknown })._meta === true);
}

export function readMagazinePageLayoutFromObjectArray(arr: unknown): MagazinePageLayout {
  if (!Array.isArray(arr)) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
  const meta = arr.find(isLayoutMetaEntry);
  return normalizeMagazinePageLayout(meta?.magazine_page_layout);
}

export function stripMagazineLayoutMetaFromObjectArray(arr: unknown): unknown[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((o) => !isLayoutMetaEntry(o));
}

export function withMagazinePageLayoutMeta(arr: unknown, layout: MagazinePageLayout): unknown[] {
  const entries = stripMagazineLayoutMetaFromObjectArray(arr);
  return [{ _meta: true, magazine_page_layout: layout }, ...entries];
}

export const MAGAZINE_PAGE_LAYOUT_OPTIONS: {
  id: MagazinePageLayout;
  label: string;
  description: string;
}[] = [
  {
    id: "2_col_article",
    label: "2 col article",
    description: "Body text flows in two columns below the title and subtitle band.",
  },
  {
    id: "3_col_article",
    label: "3 col article",
    description: "Body text flows in three columns below the title and subtitle band.",
  },
];
