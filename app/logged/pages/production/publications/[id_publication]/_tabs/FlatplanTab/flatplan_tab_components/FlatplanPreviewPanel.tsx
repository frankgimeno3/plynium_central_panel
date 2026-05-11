"use client";

import React from "react";

import {
  chunkKeysIntoPairs,
  flatplanPreviewColClass,
  FlatplanPreviewCell,
} from "../../../_shared";

import type { SlotRow } from "../../../_shared";
import type { FlatplanWorkingSplit } from "./types";

export type FlatplanPreviewPanelProps = {
  publicationId: string;
  flatplanWorkingSplit: FlatplanWorkingSplit;
  slotByKey: Map<string, SlotRow>;
  slotsReduced: boolean;
  hoveredSlotId: number | null;
};

export function FlatplanPreviewPanel({
  publicationId,
  flatplanWorkingSplit,
  slotByKey,
  slotsReduced,
  hoveredSlotId,
}: FlatplanPreviewPanelProps) {
  return (
    <div
      className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,max-width] duration-[1400ms] ${
        slotsReduced ? "flex-[3] max-w-[10000px]" : "flex-1 max-w-[640px]"
      }`}
    >
      <p className="text-sm font-semibold text-gray-700 mb-3">Flatplan preview</p>
      <div className="min-w-0 overflow-x-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
        <div
          className={`inline-flex flex-row items-start max-w-full motion-reduce:transition-none motion-reduce:duration-0 transition-[gap] duration-[1400ms] ease-in-out ${
            slotsReduced ? "gap-12" : "gap-3"
          }`}
        >
          <div
            className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
              slotsReduced ? "gap-4" : "gap-2"
            } ${flatplanPreviewColClass(slotsReduced)}`}
          >
            {flatplanWorkingSplit.leftKeys.length > 0 ? (
              <>
                <div className={`flex flex-row justify-end ${slotsReduced ? "gap-4" : "gap-2"}`}>
                  <FlatplanPreviewCell
                    publicationId={publicationId}
                    entryKey={flatplanWorkingSplit.leftKeys[0]}
                    side="Left"
                    slot={slotByKey.get(flatplanWorkingSplit.leftKeys[0]) ?? null}
                    workingIndex={0}
                    previewExpanded={slotsReduced}
                    highlightedSlotId={hoveredSlotId}
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
                    />
                  ) : (
                    <div
                      className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                      aria-hidden
                    />
                  )}
                </div>
                {chunkKeysIntoPairs(flatplanWorkingSplit.leftKeys.slice(2)).map(([lk, rk], idx) => {
                  const base = 2 + idx * 2;
                  return (
                    <div
                      key={`flatplan-left-${idx}`}
                      className={`flex flex-row ${slotsReduced ? "gap-4" : "gap-2"}`}
                    >
                      <FlatplanPreviewCell
                        publicationId={publicationId}
                        entryKey={lk}
                        side="Left"
                        slot={slotByKey.get(lk) ?? null}
                        workingIndex={base}
                        previewExpanded={slotsReduced}
                        highlightedSlotId={hoveredSlotId}
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
                        />
                      ) : (
                        <div
                          className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-xs text-gray-400">No flatplan positions.</p>
            )}
          </div>
          <div
            className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
              slotsReduced ? "gap-4" : "gap-2"
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
                    <div
                      key={`flatplan-right-${idx}`}
                      className={`flex flex-row ${slotsReduced ? "gap-4" : "gap-2"}`}
                    >
                      <FlatplanPreviewCell
                        publicationId={publicationId}
                        entryKey={lk}
                        side="Left"
                        slot={slotByKey.get(lk) ?? null}
                        workingIndex={base}
                        previewExpanded={slotsReduced}
                        highlightedSlotId={hoveredSlotId}
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
                        />
                      ) : (
                        <div
                          className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                          aria-hidden
                        />
                      )}
                    </div>
                  );
                })}
                {flatplanWorkingSplit.rightKeys.length >= 2 ? (
                  <div className={`flex flex-row justify-start ${slotsReduced ? "gap-4" : "gap-2"}`}>
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
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
