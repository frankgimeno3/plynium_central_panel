import type React from "react";
import type { MovableContentType } from "@/app/logged/logged_components/modals/MoveContentTypeModal";
import type {
  CoverMarginArticleMiniature,
  MagazineApiRow,
  PreferentialSlotApiRow,
  PublicationDbRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type MoveContentTypeModalState = {
  contentType: MovableContentType;
  initialTarget: string | null;
} | null;

export type DataTabProps = {
  publicationId: string;
  publication: PublicationDbRow;
  draftPub: PublicationDbRow | null;
  setDraftPub: React.Dispatch<React.SetStateAction<PublicationDbRow | null>>;
  saveError: string | null;
  magazine: MagazineApiRow | null;
  preferentialSlots: PreferentialSlotApiRow[];
  title: string;
  coverSlotId: number | null;
  coverMarginMiniatures: CoverMarginArticleMiniature[];
  setCoverMarginArticleModalPosition: React.Dispatch<React.SetStateAction<number | null>>;
  removeCoverMarginArticle: (position: number) => void;
  startEditingCoverMarginContent: (position: number) => void;
  updateCoverMarginDraftContent: (position: number, draftContent: string) => void;
  saveCoverMarginDraftContent: (position: number) => void;
  setMoveContentTypeModal: React.Dispatch<
    React.SetStateAction<MoveContentTypeModalState>
  >;
  onRefreshPublication?: () => void | Promise<void>;
};
