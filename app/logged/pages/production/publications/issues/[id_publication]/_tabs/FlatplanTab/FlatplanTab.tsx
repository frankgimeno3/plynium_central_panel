"use client";

import { FlatplanBulkDeleteModal } from "./flatplan_tab_components/FlatplanBulkDeleteModal";
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
    maxPreferentialInteriorPage,
    slotsReduced,
    setSlotsReduced,
    hoveredSlotId,
    setHoveredSlotId,
    handleSlotsTableTypeChange,
    flatplanBulkDeleteSelectMode,
    flatplanBulkDeleteSelectedIds,
    onFlatplanBulkDeleteToggleSlot,
    flatplanBulkDeleteButtonLabel,
    onFlatplanBulkDeleteButtonClick,
    flatplanBulkDeleteShowSelectedCount,
    flatplanBulkDeleteError,
    flatplanBulkDeleteModalOpen,
    flatplanBulkDeleteModalPhase,
    flatplanBulkDeleteModalVisibleSlotIds,
    flatplanBulkDeleteModalCheckedSlotIds,
    onFlatplanBulkDeleteModalToggleSlot,
    flatplanBulkDeleteConfirmInput,
    onFlatplanBulkDeleteConfirmInputChange,
    onFlatplanBulkDeleteModalClose,
    onFlatplanBulkDeleteModalYes,
    onFlatplanBulkDeleteModalFinal,
    flatplanBulkDeleteBusy,
    onFlatplanAddSlotToolbar,
    onFlatplanAddSlotAfterNine,
    onFlatplanAddSlotBeforeEnd,
    onFlatplanAddSlotAdjacent,
    onFlatplanRelocateArticle,
  } = props;

  const bulkDeleteSelectedIdsSafe = flatplanBulkDeleteSelectedIds ?? [];
  const bulkDeleteModalVisibleIdsSafe = flatplanBulkDeleteModalVisibleSlotIds ?? [];
  const bulkDeleteModalCheckedIdsSafe = flatplanBulkDeleteModalCheckedSlotIds ?? [];

  return (
    <div className="flex flex-row w-full min-h-[360px] items-stretch gap-3 overflow-hidden">
      <FlatplanBulkDeleteModal
        open={flatplanBulkDeleteModalOpen}
        phase={flatplanBulkDeleteModalPhase}
        slots={slots}
        modalVisibleSlotIds={bulkDeleteModalVisibleIdsSafe}
        modalCheckedSlotIds={bulkDeleteModalCheckedIdsSafe}
        onToggleModalId={onFlatplanBulkDeleteModalToggleSlot}
        confirmInput={flatplanBulkDeleteConfirmInput}
        onConfirmInputChange={onFlatplanBulkDeleteConfirmInputChange}
        onClose={onFlatplanBulkDeleteModalClose}
        onYes={onFlatplanBulkDeleteModalYes}
        onFinalDelete={onFlatplanBulkDeleteModalFinal}
        busy={flatplanBulkDeleteBusy}
        error={flatplanBulkDeleteError}
      />
      <FlatplanPreviewPanel
        publicationId={publicationId}
        sortedSlotsForFlatplan={sortedSlotsForFlatplan}
        flatplanWorkingSplit={flatplanWorkingSplit}
        slotByKey={slotByKey}
        slotsReduced={slotsReduced}
        hoveredSlotId={hoveredSlotId}
        flatplanBulkDeleteSelectMode={Boolean(flatplanBulkDeleteSelectMode)}
        flatplanBulkDeleteSelectedIds={bulkDeleteSelectedIdsSafe}
        onFlatplanBulkDeleteToggleSlot={onFlatplanBulkDeleteToggleSlot}
        flatplanBulkDeleteButtonLabel={flatplanBulkDeleteButtonLabel}
        onFlatplanBulkDeleteButtonClick={onFlatplanBulkDeleteButtonClick}
        flatplanBulkDeleteShowSelectedCount={flatplanBulkDeleteShowSelectedCount}
        flatplanBulkDeleteError={flatplanBulkDeleteError}
        onFlatplanAddSlotToolbar={onFlatplanAddSlotToolbar}
        onFlatplanAddSlotAdjacent={onFlatplanAddSlotAdjacent}
        onFlatplanRelocateArticle={onFlatplanRelocateArticle}
      />
      <FlatplanSlotsTablePanel
        publicationId={publicationId}
        slots={slots}
        sortedSlotsForFlatplan={sortedSlotsForFlatplan}
        slotKeyToWorkingIndex={slotKeyToWorkingIndex}
        maxPreferentialInteriorPage={maxPreferentialInteriorPage}
        slotsReduced={slotsReduced}
        setSlotsReduced={setSlotsReduced}
        setHoveredSlotId={setHoveredSlotId}
        handleSlotsTableTypeChange={handleSlotsTableTypeChange}
        onFlatplanAddSlotAfterNine={onFlatplanAddSlotAfterNine}
        onFlatplanAddSlotBeforeEnd={onFlatplanAddSlotBeforeEnd}
      />
    </div>
  );
}
