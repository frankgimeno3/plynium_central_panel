"use client";

import React from "react";
import Link from "next/link";
import {
  allowedSlotContentTypes,
  BASE,
  chunkKeysIntoPairs,
  DEFAULT_SLOT_CONTENT_TYPE,
  flatplanPreviewColClass,
  FlatplanPreviewCell,
  flatplanWorkingLabel,
  isPaddingSlot,
  normalizeSlotContentType,
  SlotContentCard,
  SlotRow,
  spreadIndexLabel,
} from "../_shared";

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
  setSlotsReduced: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredSlotId: number | null;
  setHoveredSlotId: React.Dispatch<React.SetStateAction<number | null>>;
  handleSlotsTableTypeChange: (slot: SlotRow, newType: string) => void;
};

/**
 * "Flatplan" tab: live preview of the magazine spreads on the left and an
 * editable Slots table on the right. Hovering a row in the table highlights
 * the matching tile in the preview.
 *
 * All data + mutation logic stays in the parent; the tab is a pure renderer
 * of the supplied props.
 */
export function FlatplanTab({
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
}: FlatplanTabProps) {
  return (
    <div className="flex flex-row w-full min-h-[420px] items-stretch gap-0">
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
                          flatplanWorkingSplit.leftCount +
                          flatplanWorkingSplit.rightKeys.length -
                          2
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
                          flatplanWorkingSplit.leftCount +
                          flatplanWorkingSplit.rightKeys.length -
                          1
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

      <div
        className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,box-shadow,border-radius,padding,margin,border-color] duration-[1400ms] ${
          slotsReduced
            ? "flex-[1] relative z-10 rounded-l-xl border-l border-y border-gray-200 bg-white shadow-lg pl-3 -ml-1"
            : "flex-1 border border-transparent pl-0 shadow-none"
        }`}
      >
        <div className="mb-3 flex flex-row items-center gap-2">
          {slotsReduced ? (
            <button
              type="button"
              title="<- Expand"
              aria-label="Expand slots panel"
              onClick={(e) => {
                e.stopPropagation();
                setSlotsReduced(false);
              }}
              className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              &lt;
            </button>
          ) : (
            <button
              type="button"
              title="Collapse"
              aria-label="Collapse slots panel"
              onClick={(e) => {
                e.stopPropagation();
                setSlotsReduced(true);
              }}
              className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              &gt;
            </button>
          )}
          <p className="text-sm font-semibold text-gray-700">Slots (editable)</p>
        </div>
        <div className="overflow-x-auto min-w-0">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase bg-slate-900 text-white">
                  Slot
                </th>
                {!slotsReduced ? (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                  </>
                ) : (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {slots.length === 0 ? (
                <tr>
                  <td
                    colSpan={slotsReduced ? 2 : 4}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No slots found for this issue.
                  </td>
                </tr>
              ) : (
                sortedSlotsForFlatplan.map((s) => {
                  const wi = slotKeyToWorkingIndex.get(String(s.slot_key));
                  const spreadLine =
                    wi != null
                      ? `Spread ${flatplanWorkingLabel(wi)}`
                      : `Spread ${spreadIndexLabel(String(s.slot_key), maxNumericSlotKey)}`;

                  const padding = isPaddingSlot(s);
                  const allowedTypes = allowedSlotContentTypes(s.slot_key);
                  const normalizedType = normalizeSlotContentType(s.slot_content_type);
                  const currentType = allowedTypes.includes(normalizedType)
                    ? normalizedType
                    : DEFAULT_SLOT_CONTENT_TYPE;
                  return (
                    <tr
                      key={s.publication_slot_id}
                      className={`align-top ${padding ? "bg-red-100" : ""}`}
                    >
                      <td
                        className={`px-4 py-3 text-sm ${
                          padding ? "bg-red-700 text-white" : "bg-slate-900 text-white"
                        }`}
                        onMouseEnter={() => setHoveredSlotId(s.publication_slot_id)}
                        onMouseLeave={() => setHoveredSlotId(null)}
                        onFocus={() => setHoveredSlotId(s.publication_slot_id)}
                        onBlur={() => setHoveredSlotId(null)}
                      >
                        <Link
                          href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${s.publication_slot_id}`}
                          className="font-medium text-white hover:text-gray-200"
                        >
                          {s.slot_key}
                        </Link>
                        {!slotsReduced ? (
                          <>
                            <div className="text-xs text-gray-300 mt-0.5">{spreadLine}</div>
                            <div className="text-xs text-gray-400">#{s.publication_slot_id}</div>
                          </>
                        ) : null}
                      </td>
                      {!slotsReduced ? (
                        <>
                          <td className="px-4 py-3">
                            <select
                              value={currentType}
                              onChange={(e) => handleSlotsTableTypeChange(s, e.target.value)}
                              disabled={allowedTypes.length === 1}
                              className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {allowedTypes.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-block w-32 px-2 py-1 text-sm text-white">
                              {s.slot_state?.trim() ? s.slot_state : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <SlotContentCard
                              publicationId={publicationId}
                              slot={s}
                              variant="expanded"
                            />
                          </td>
                        </>
                      ) : (
                        <td className="px-4 py-3">
                          <SlotContentCard
                            publicationId={publicationId}
                            slot={s}
                            variant="reduced"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
