import type { MagazineApiRow } from "../../../_shared";

export type ContentsManagerSubTabId =
  | "should_be_in_magazine"
  | "selected_contents"
  | "available_articles";

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
