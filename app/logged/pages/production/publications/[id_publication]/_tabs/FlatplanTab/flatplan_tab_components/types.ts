import type { Dispatch, SetStateAction } from "react";

import type { SlotRow } from "../../../_shared";

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
  maxNumericSlotKey: number;
  slotsReduced: boolean;
  setSlotsReduced: Dispatch<SetStateAction<boolean>>;
  hoveredSlotId: number | null;
  setHoveredSlotId: Dispatch<SetStateAction<number | null>>;
  handleSlotsTableTypeChange: (slot: SlotRow, newType: string) => void;
};
