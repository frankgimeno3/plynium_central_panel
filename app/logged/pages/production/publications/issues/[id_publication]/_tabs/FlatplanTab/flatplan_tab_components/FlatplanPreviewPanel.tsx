"use client";

import React from "react";

import {
  chunkKeysIntoPairs,
  FLATPLAN_BUFFER_KEY,
  FLATPLAN_PREVIEW_CELL_OUTER_SHELL_CLASS,
  FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS, 
  FLATPLAN_PREVIEW_ROW_INSERT_BTN_CLASS,
  FLATPLAN_PREVIEW_TILE_TRANSITION_CLASS,
  flatplanPreviewColClass,
  flatplanPreviewPairPlaceholderClass,
  flatplanPreviewPenultimateSingleSlotPlacement,
  flatplanPreviewRowContainsEndSlot,
  flatplanPreviewRowIsPreferentialEightNine,
  FLATPLAN_PAGE_ASPECT_CLASS,
  flatplanPreviewRowVerticalGutterClass,
  flatplanPreviewTileWidthClass,
  FlatplanPreviewCell,
  isFlatplanSlotBulkDeletable,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { FlatplanArticleDragProvider } from "./FlatplanArticleDragContext";
import type { FlatplanInsertAdjacentSide } from "./flatplanInsertPlacement";
import type { FlatplanWorkingSplit } from "./types";

export type FlatplanPreviewAdjacentOptions = {
  reloadDocumentAfterCreate?: boolean;
};

export type FlatplanPreviewPanelProps = {
  publicationId: string;
  sortedSlotsForFlatplan: SlotRow[];
  flatplanWorkingSplit: FlatplanWorkingSplit;
  slotByKey: Map<string, SlotRow>;
  slotsReduced: boolean;
  hoveredSlotId: number | null;
  flatplanBulkDeleteSelectMode: boolean;
  flatplanBulkDeleteSelectedIds: number[];
  onFlatplanBulkDeleteToggleSlot: (publicationSlotId: number) => void;
  flatplanBulkDeleteButtonLabel: string;
  onFlatplanBulkDeleteButtonClick: () => void;
  flatplanBulkDeleteShowSelectedCount: boolean;
  flatplanBulkDeleteError: string | null;
  onFlatplanAddSlotToolbar?: () => void;
  onFlatplanAddSlotAdjacent?: (
    entryKey: string,
    side: "before" | "after",
    options?: FlatplanPreviewAdjacentOptions
  ) => void;
  onFlatplanRelocateArticle?: (
    publicationArticleId: string,
    entryKey: string,
    side: FlatplanInsertAdjacentSide
  ) => void | Promise<void>;
};

function bulkDeleteCellProps(
  entryKey: string,
  slot: SlotRow | null,
  selectMode: boolean,
  selectedIds: number[],
  onToggle: (publicationSlotId: number) => void
) {
  const deletable = isFlatplanSlotBulkDeletable(slot, entryKey);
  const ids = Array.isArray(selectedIds) ? selectedIds : [];
  const selected =
    slot != null && ids.includes(slot.publication_slot_id);
  return {
    bulkDeleteSelectMode: selectMode,
    bulkDeleteDeletable: deletable,
    bulkDeleteSelected: selected,
    onBulkDeleteToggle: onToggle,
  };
}

/** Vertical "+" between rows: only above `end` row and below preferential 8+9 row (editorial gap). */
function FlatplanPreviewTileRow({
  rowKeysInFlatplanOrder,
  previewExpanded,
  rowGapClass,
  justifyClassName,
  enableInsertAbove,
  enableInsertBelow,
  onFlatplanAddSlotAdjacent,
  children,
}: {
  rowKeysInFlatplanOrder: string[];
  previewExpanded: boolean;
  rowGapClass: string;
  justifyClassName?: string;
  enableInsertAbove: boolean;
  enableInsertBelow: boolean;
  onFlatplanAddSlotAdjacent?: (
    entryKey: string,
    side: "before" | "after",
    options?: FlatplanPreviewAdjacentOptions
  ) => void;
  children: React.ReactNode;
}) {
  const reals = rowKeysInFlatplanOrder.filter((k) => k !== FLATPLAN_BUFFER_KEY);
  const firstReal = reals[0];
  const lastReal = reals[reals.length - 1];
  const vGutter = flatplanPreviewRowVerticalGutterClass(previewExpanded);

  const canAbove =
    Boolean(enableInsertAbove && onFlatplanAddSlotAdjacent && firstReal !== undefined);
  const canBelow =
    Boolean(enableInsertBelow && onFlatplanAddSlotAdjacent && lastReal !== undefined);

  const tilesRow = (
    <div className={`flex flex-row ${rowGapClass} ${justifyClassName ?? ""}`.trim()}>{children}</div>
  );

  return (
    <div className="group/preview-row flex flex-col items-stretch gap-1">
      <div className={`relative flex w-full items-center justify-center ${vGutter}`}>
        {canAbove ? (
          <button
            type="button"
            aria-label="Insert editorial slot above end row"
            className={`${FLATPLAN_PREVIEW_ROW_INSERT_BTN_CLASS} absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFlatplanAddSlotAdjacent!(firstReal!, "before", { reloadDocumentAfterCreate: true });
            }}
          >
            +
          </button>
        ) : null}
      </div>
      {tilesRow}
      <div className={`relative flex w-full items-center justify-center ${vGutter}`}>
        {canBelow ? (
          <button
            type="button"
            aria-label="Insert editorial slot below preferential pages 8 and 9"
            className={`${FLATPLAN_PREVIEW_ROW_INSERT_BTN_CLASS} absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFlatplanAddSlotAdjacent!(lastReal!, "after", { reloadDocumentAfterCreate: true });
            }}
          >
            +
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Inline warning in the empty spread partner cell — same outer layout as {@link FlatplanPreviewCell}. */
function FlatplanPenultimatePairNotice({
  previewExpanded,
  onAddSlot,
}: {
  previewExpanded: boolean;
  onAddSlot?: () => void;
}) {
  const tileW = flatplanPreviewTileWidthClass(previewExpanded);
  const tileTransition = FLATPLAN_PREVIEW_TILE_TRANSITION_CLASS;
  const pad = previewExpanded ? "p-2" : "p-1";
  return (
    <div className={FLATPLAN_PREVIEW_CELL_OUTER_SHELL_CLASS} role="status">
      <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden />
      <div
        className={`relative ${FLATPLAN_PAGE_ASPECT_CLASS} rounded-lg shrink-0 flex flex-col items-stretch justify-center text-center ${tileW} ${tileTransition} ${pad} border border-dashed border-amber-500 bg-transparent text-xs text-amber-950`}
      >
        <p className="font-semibold leading-snug px-0.5">
          Magazine spread slots must always come in pairs.
        </p>
        {onAddSlot ? (
          <button
            type="button"
            onClick={onAddSlot}
            className="mt-1 shrink-0 self-center rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
          >
            Add slot
          </button>
        ) : null}
      </div>
      <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden />
    </div>
  );
}

export function FlatplanPreviewPanel({
  publicationId,
  sortedSlotsForFlatplan,
  flatplanWorkingSplit,
  slotByKey,
  slotsReduced,
  hoveredSlotId,
  flatplanBulkDeleteSelectMode,
  flatplanBulkDeleteSelectedIds,
  onFlatplanBulkDeleteToggleSlot,
  flatplanBulkDeleteButtonLabel,
  onFlatplanBulkDeleteButtonClick,
  flatplanBulkDeleteShowSelectedCount,
  flatplanBulkDeleteError,
  onFlatplanAddSlotToolbar,
  onFlatplanAddSlotAdjacent,
  onFlatplanRelocateArticle,
}: FlatplanPreviewPanelProps) {
  const selectedIdsSafe = Array.isArray(flatplanBulkDeleteSelectedIds)
    ? flatplanBulkDeleteSelectedIds
    : [];

  const adjacentForEntryKey = React.useCallback(
    (entryKey: string) =>
      onFlatplanAddSlotAdjacent != null
        ? (side: "before" | "after") => onFlatplanAddSlotAdjacent(entryKey, side)
        : undefined,
    [onFlatplanAddSlotAdjacent]
  );

  const bd = (entryKey: string, slot: SlotRow | null) => ({
    ...bulkDeleteCellProps(
      entryKey,
      slot,
      Boolean(flatplanBulkDeleteSelectMode),
      selectedIdsSafe,
      onFlatplanBulkDeleteToggleSlot
    ),
    onAdjacentSlotInsert: adjacentForEntryKey(entryKey),
  });

  const penultimatePlacement = React.useMemo(
    () => flatplanPreviewPenultimateSingleSlotPlacement(flatplanWorkingSplit),
    [flatplanWorkingSplit]
  );

  const showPenultimatePairNotice = React.useCallback(
    (column: "left" | "right", lk: string, rk: string | undefined): boolean => {
      if (!penultimatePlacement || penultimatePlacement.column !== column) return false;
      if (penultimatePlacement.leftKey !== lk) return false;
      if ((rk ?? FLATPLAN_BUFFER_KEY) !== penultimatePlacement.rightKey) return false;
      return rk == null && penultimatePlacement.rightKey === FLATPLAN_BUFFER_KEY;
    },
    [penultimatePlacement]
  );

  const pairPartnerOrPlaceholder = React.useCallback(
    (column: "left" | "right", lk: string, rk: string | undefined) => {
      if (showPenultimatePairNotice(column, lk, rk) && onFlatplanAddSlotToolbar) {
        return (
          <FlatplanPenultimatePairNotice
            previewExpanded={slotsReduced}
            onAddSlot={onFlatplanAddSlotToolbar}
          />
        );
      }
      return <div className={flatplanPreviewPairPlaceholderClass(slotsReduced)} aria-hidden />;
    },
    [showPenultimatePairNotice, slotsReduced, onFlatplanAddSlotToolbar]
  );

  const rowGap = slotsReduced ? "gap-2" : "gap-1";

  return (
    <div
      className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,max-width] duration-[1400ms] ${
        slotsReduced ? "flex-[3] min-w-0 max-w-none" : "flex-1 min-w-0 max-w-[520px]"
      }`}
    >
      <div className="flex flex-row items-start justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-gray-700 shrink-0">Flatplan preview</p>
        <div className="flex flex-col items-end gap-1 min-w-0">
          {flatplanBulkDeleteShowSelectedCount ? (
            <p className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Selected elements {selectedIdsSafe.length}
            </p>
          ) : null}
          <div className="flex flex-row flex-wrap items-center justify-end gap-2">
            {onFlatplanAddSlotToolbar ? (
              <button
                type="button"
                onClick={onFlatplanAddSlotToolbar}
                className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
              >
                Add slot
              </button>
            ) : null}
            <button
              type="button"
              onClick={onFlatplanBulkDeleteButtonClick}
              className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-900 hover:bg-red-100 transition"
            >
              {flatplanBulkDeleteButtonLabel}
            </button>
          </div>
          {flatplanBulkDeleteError ? (
            <p className="text-xs text-red-600 text-right max-w-[220px]">{flatplanBulkDeleteError}</p>
          ) : null}
        </div>
      </div>
      <FlatplanArticleDragProvider
        sortedSlots={sortedSlotsForFlatplan}
        onRelocateArticle={
          onFlatplanRelocateArticle ??
          (async () => {
            /* relocate not configured */
          })
        }
      >
      <div className="min-w-0 overflow-x-auto border border-gray-200 rounded-lg bg-gray-50 p-3">
        <div
          className={`inline-flex flex-row items-start max-w-full motion-reduce:transition-none motion-reduce:duration-0 transition-[gap] duration-[1400ms] ease-in-out ${
            slotsReduced ? "gap-6" : "gap-2"
          }`}
        >
          <div
            className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
              slotsReduced ? "gap-2" : "gap-1"
            } ${flatplanPreviewColClass(slotsReduced)}`}
          >
            {flatplanWorkingSplit.leftKeys.length > 0 ? (
              <>
                <FlatplanPreviewTileRow
                  rowKeysInFlatplanOrder={[
                    flatplanWorkingSplit.leftKeys[0],
                    flatplanWorkingSplit.leftKeys[1] ?? FLATPLAN_BUFFER_KEY,
                  ]}
                  previewExpanded={slotsReduced}
                  rowGapClass={rowGap}
                  justifyClassName="justify-end"
                  enableInsertAbove={flatplanPreviewRowContainsEndSlot([
                    flatplanWorkingSplit.leftKeys[0],
                    flatplanWorkingSplit.leftKeys[1] ?? FLATPLAN_BUFFER_KEY,
                  ])}
                  enableInsertBelow={flatplanPreviewRowIsPreferentialEightNine([
                    flatplanWorkingSplit.leftKeys[0],
                    flatplanWorkingSplit.leftKeys[1] ?? FLATPLAN_BUFFER_KEY,
                  ])}
                  onFlatplanAddSlotAdjacent={onFlatplanAddSlotAdjacent}
                >
                  <FlatplanPreviewCell
                    publicationId={publicationId}
                    entryKey={flatplanWorkingSplit.leftKeys[0]}
                    side="Left"
                    slot={slotByKey.get(flatplanWorkingSplit.leftKeys[0]) ?? null}
                    workingIndex={0}
                    previewExpanded={slotsReduced}
                    highlightedSlotId={hoveredSlotId}
                    {...bd(flatplanWorkingSplit.leftKeys[0], slotByKey.get(flatplanWorkingSplit.leftKeys[0]) ?? null)}
                  />
                  {flatplanWorkingSplit.leftKeys[1] != null ? (
                    <FlatplanPreviewCell
                      publicationId={publicationId}
                      entryKey={flatplanWorkingSplit.leftKeys[1]}
                      side="Right"
                      slot={slotByKey.get(flatplanWorkingSplit.leftKeys[1]) ?? null}
                      workingIndex={1}
                      previewExpanded={slotsReduced}
                      highlightedSlotId={hoveredSlotId}
                      {...bd(flatplanWorkingSplit.leftKeys[1], slotByKey.get(flatplanWorkingSplit.leftKeys[1]) ?? null)}
                    />
                  ) : (
                    pairPartnerOrPlaceholder(
                      "left",
                      flatplanWorkingSplit.leftKeys[0],
                      flatplanWorkingSplit.leftKeys[1]
                    )
                  )}
                </FlatplanPreviewTileRow>
                {chunkKeysIntoPairs(flatplanWorkingSplit.leftKeys.slice(2)).map(([lk, rk], idx) => {
                  const base = 2 + idx * 2;
                  return (
                    <FlatplanPreviewTileRow
                      key={`flatplan-left-${idx}`}
                      rowKeysInFlatplanOrder={[lk, rk ?? FLATPLAN_BUFFER_KEY]}
                      previewExpanded={slotsReduced}
                      rowGapClass={rowGap}
                      enableInsertAbove={flatplanPreviewRowContainsEndSlot([
                        lk,
                        rk ?? FLATPLAN_BUFFER_KEY,
                      ])}
                      enableInsertBelow={flatplanPreviewRowIsPreferentialEightNine([
                        lk,
                        rk ?? FLATPLAN_BUFFER_KEY,
                      ])}
                      onFlatplanAddSlotAdjacent={onFlatplanAddSlotAdjacent}
                    >
                      <FlatplanPreviewCell
                        publicationId={publicationId}
                        entryKey={lk}
                        side="Left"
                        slot={slotByKey.get(lk) ?? null}
                        workingIndex={base}
                        previewExpanded={slotsReduced}
                        highlightedSlotId={hoveredSlotId}
                        {...bd(lk, slotByKey.get(lk) ?? null)}
                      />
                      {rk ? (
                        <FlatplanPreviewCell
                          publicationId={publicationId}
                          entryKey={rk}
                          side="Right"
                          slot={slotByKey.get(rk) ?? null}
                          workingIndex={base + 1}
                          previewExpanded={slotsReduced}
                          highlightedSlotId={hoveredSlotId}
                          {...bd(rk, slotByKey.get(rk) ?? null)}
                        />
                      ) : (
                        pairPartnerOrPlaceholder("left", lk, rk)
                      )}
                    </FlatplanPreviewTileRow>
                  );
                })}
              </>
            ) : (
              <p className="text-xs text-gray-400">No flatplan positions.</p>
            )}
          </div>
          <div
            className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
              slotsReduced ? "gap-2" : "gap-1"
            } ${flatplanPreviewColClass(slotsReduced)}`}
          >
            {flatplanWorkingSplit.rightKeys.length > 0 ? (
              <>
                {chunkKeysIntoPairs(
                  flatplanWorkingSplit.rightKeys.slice(
                    0,
                    Math.max(0, flatplanWorkingSplit.rightKeys.length - 2)
                  )
                ).map(([lk, rk], idx) => {
                  const off = flatplanWorkingSplit.leftCount;
                  const base = off + idx * 2;
                  return (
                    <FlatplanPreviewTileRow
                      key={`flatplan-right-${idx}`}
                      rowKeysInFlatplanOrder={[lk, rk ?? FLATPLAN_BUFFER_KEY]}
                      previewExpanded={slotsReduced}
                      rowGapClass={rowGap}
                      enableInsertAbove={flatplanPreviewRowContainsEndSlot([
                        lk,
                        rk ?? FLATPLAN_BUFFER_KEY,
                      ])}
                      enableInsertBelow={flatplanPreviewRowIsPreferentialEightNine([
                        lk,
                        rk ?? FLATPLAN_BUFFER_KEY,
                      ])}
                      onFlatplanAddSlotAdjacent={onFlatplanAddSlotAdjacent}
                    >
                      <FlatplanPreviewCell
                        publicationId={publicationId}
                        entryKey={lk}
                        side="Left"
                        slot={slotByKey.get(lk) ?? null}
                        workingIndex={base}
                        previewExpanded={slotsReduced}
                        highlightedSlotId={hoveredSlotId}
                        {...bd(lk, slotByKey.get(lk) ?? null)}
                      />
                      {rk ? (
                        <FlatplanPreviewCell
                          publicationId={publicationId}
                          entryKey={rk}
                          side="Right"
                          slot={slotByKey.get(rk) ?? null}
                          workingIndex={base + 1}
                          previewExpanded={slotsReduced}
                          highlightedSlotId={hoveredSlotId}
                          {...bd(rk, slotByKey.get(rk) ?? null)}
                        />
                      ) : (
                        pairPartnerOrPlaceholder("right", lk, rk)
                      )}
                    </FlatplanPreviewTileRow>
                  );
                })}
                {flatplanWorkingSplit.rightKeys.length >= 2 ? (
                  <FlatplanPreviewTileRow
                    rowKeysInFlatplanOrder={[
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2],
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1],
                    ]}
                    previewExpanded={slotsReduced}
                    rowGapClass={rowGap}
                    justifyClassName="justify-start"
                    enableInsertAbove={flatplanPreviewRowContainsEndSlot([
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2],
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1],
                    ])}
                    enableInsertBelow={flatplanPreviewRowIsPreferentialEightNine([
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2],
                      flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1],
                    ])}
                    onFlatplanAddSlotAdjacent={onFlatplanAddSlotAdjacent}
                  >
                    <FlatplanPreviewCell
                      publicationId={publicationId}
                      entryKey={
                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2]
                      }
                      side="Left"
                      slot={
                        slotByKey.get(
                          flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2]
                        ) ?? null
                      }
                      workingIndex={
                        flatplanWorkingSplit.leftCount + flatplanWorkingSplit.rightKeys.length - 2
                      }
                      previewExpanded={slotsReduced}
                      highlightedSlotId={hoveredSlotId}
                      {...bd(
                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2],
                        slotByKey.get(
                          flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2]
                        ) ?? null
                      )}
                    />
                    <FlatplanPreviewCell
                      publicationId={publicationId}
                      entryKey={
                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1]
                      }
                      side="Right"
                      slot={
                        slotByKey.get(
                          flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1]
                        ) ?? null
                      }
                      workingIndex={
                        flatplanWorkingSplit.leftCount + flatplanWorkingSplit.rightKeys.length - 1
                      }
                      previewExpanded={slotsReduced}
                      highlightedSlotId={hoveredSlotId}
                      {...bd(
                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1],
                        slotByKey.get(
                          flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1]
                        ) ?? null
                      )}
                    />
                  </FlatplanPreviewTileRow>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
      </FlatplanArticleDragProvider>
    </div>
  );
}
