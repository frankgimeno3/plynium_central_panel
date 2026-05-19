import type { MagazineApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type ContentsManagerSubTabId =
  | "should_be_in_magazine"
  | "selected_contents"
  | "available_articles";

/** Issue URL query when `tab=contentsManager`. If absent, default sub-tab applies. */
export const ISSUE_CONTENTS_MANAGER_SUBTAB_QUERY_PARAM = "contentsSubtab";

export type ContentsManagerTabProps = {
  publicationId: string;
  magazine: MagazineApiRow | null;
  magazineId: string | null;
};

export type LinkedPortalRow = { portal_id: number; portal_name: string };

export type ContentsManagerSubTabMeta = {
  id: ContentsManagerSubTabId;
  label: string;
  description: string;
};
