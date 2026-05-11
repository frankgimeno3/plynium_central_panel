"use client";

import { FlatplanPreviewPanel } from "./flatplan_tab_components/FlatplanPreviewPanel";
import { FlatplanSlotsTablePanel } from "./flatplan_tab_components/FlatplanSlotsTablePanel";
import type { FlatplanTabProps } from "./flatplan_tab_components/types";

export type { FlatplanTabProps, FlatplanWorkingSplit } from "./flatplan_tab_components/types";

/**
 * "Flatplan" tab: live preview of the magazine spreads on the left and an
 * editable Slots table on the right. Hovering a row in the table highlights
 * the matching tile in the preview.
 *
 * All data + mutation logic stays in the parent; the tab is a pure renderer
 * of the supplied props.
 */
export function FlatplanTab(props: FlatplanTabProps) {
  const {
    publicationId,
    slots,
    sortedSlotsForFlatplan,
    slotByKey,
    slotKeyToWorkingIndex,
    flatplanWorkingSplit,
    maxNumericSlotKey,
    slotsReduced,
    setSlotsReduced,
    hoveredSlotId,
    setHoveredSlotId,
    handleSlotsTableTypeChange,
  } = props;

  return (
    <div className="flex flex-row w-full min-h-[420px] items-stretch gap-0">
      <FlatplanPreviewPanel
        publicationId={publicationId}
        flatplanWorkingSplit={flatplanWorkingSplit}
        slotByKey={slotByKey}
        slotsReduced={slotsReduced}
        hoveredSlotId={hoveredSlotId}
      />
      <FlatplanSlotsTablePanel
        publicationId={publicationId}
        slots={slots}
        sortedSlotsForFlatplan={sortedSlotsForFlatplan}
        slotKeyToWorkingIndex={slotKeyToWorkingIndex}
        maxNumericSlotKey={maxNumericSlotKey}
        slotsReduced={slotsReduced}
        setSlotsReduced={setSlotsReduced}
        setHoveredSlotId={setHoveredSlotId}
        handleSlotsTableTypeChange={handleSlotsTableTypeChange}
      />
    </div>
  );
}
