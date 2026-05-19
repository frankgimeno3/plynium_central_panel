import type { Dispatch, SetStateAction } from "react";

import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";

import type { FlatplanBulkDeleteModalPhase } from "./FlatplanBulkDeleteModal";

export type FlatplanWorkingSplit = {
  working: string[];
  leftKeys: string[];
  rightKeys: string[];
  leftCount: number;
};

export type FlatplanTabProps = {
  publicationId: string;
  slots: SlotRow[];
  sortedSlotsForFlatplan: SlotRow[];
  slotByKey: Map<string, SlotRow>;
  slotKeyToWorkingIndex: Map<string, number>;
  flatplanWorkingSplit: FlatplanWorkingSplit;
  maxPreferentialInteriorPage: number;
  slotsReduced: boolean;
  setSlotsReduced: Dispatch<SetStateAction<boolean>>;
  hoveredSlotId: number | null;
  setHoveredSlotId: Dispatch<SetStateAction<number | null>>;
  handleSlotsTableTypeChange: (slot: SlotRow, newType: string) => void;
  /** Flatplan preview: bulk-delete slots flow (server cleans related rows). */
  flatplanBulkDeleteSelectMode: boolean;
  flatplanBulkDeleteSelectedIds: number[];
  onFlatplanBulkDeleteToggleSlot: (publicationSlotId: number) => void;
  flatplanBulkDeleteButtonLabel: string;
  onFlatplanBulkDeleteButtonClick: () => void;
  flatplanBulkDeleteShowSelectedCount: boolean;
  flatplanBulkDeleteError: string | null;
  flatplanBulkDeleteModalOpen: boolean;
  flatplanBulkDeleteModalPhase: FlatplanBulkDeleteModalPhase;
  flatplanBulkDeleteModalVisibleSlotIds: number[];
  flatplanBulkDeleteModalCheckedSlotIds: number[];
  onFlatplanBulkDeleteModalToggleSlot: (publicationSlotId: number) => void;
  flatplanBulkDeleteConfirmInput: string;
  onFlatplanBulkDeleteConfirmInputChange: (value: string) => void;
  onFlatplanBulkDeleteModalClose: () => void;
  onFlatplanBulkDeleteModalYes: () => void;
  onFlatplanBulkDeleteModalFinal: () => void;
  flatplanBulkDeleteBusy: boolean;
  onFlatplanAddSlotToolbar?: () => void;
  onFlatplanAddSlotAfterNine?: () => void;
  onFlatplanAddSlotBeforeEnd?: () => void;
  onFlatplanAddSlotAdjacent?: (
    entryKey: string,
    side: "before" | "after",
    options?: { reloadDocumentAfterCreate?: boolean }
  ) => void;
  onFlatplanRelocateArticle?: (
    publicationArticleId: string,
    entryKey: string,
    side: "before" | "after"
  ) => void | Promise<void>;
};
