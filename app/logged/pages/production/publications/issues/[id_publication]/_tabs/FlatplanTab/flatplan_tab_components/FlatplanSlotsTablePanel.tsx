"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import {
  BASE,
  DEFAULT_SLOT_CONTENT_TYPE,
  effectiveSlotTableContentTypes,
  flatplanEntryKeyFromSlot,
  flatplanWorkingLabel,
  isArticlePageSlotRow,
  isCoreStructuralMagazineSlot,
  isPaddingSlot,
  magazineSlotsTablePrimaryLabel,
  magazineSlotsTableReducedLabel,
  normalizeSlotContentType,
  SlotContentCard,
  spreadIndexLabel,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

import type { FlatplanTabProps } from "./types";
import { isEndSlotRow, isStructuralPreferentialNineSlotRow } from "./flatplanInsertPlacement";

type FlatplanSlotsTablePanelProps = Pick<
  FlatplanTabProps,
  | "publicationId"
  | "slots"
  | "sortedSlotsForFlatplan"
  | "slotKeyToWorkingIndex"
  | "maxPreferentialInteriorPage"
  | "slotsReduced"
  | "setSlotsReduced"
  | "setHoveredSlotId"
  | "handleSlotsTableTypeChange"
  | "onFlatplanAddSlotAfterNine"
  | "onFlatplanAddSlotBeforeEnd"
>;

function SlotTableDividerRow({
  colSpan,
  label,
  onClick,
}: {
  colSpan: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <tr className="bg-slate-50/90">
      <td colSpan={colSpan} className="px-3 py-2 border-y border-dashed border-gray-400">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onClick}
            className="rounded-md border border-gray-400 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
          >
            {label}
          </button>
        </div>
      </td>
    </tr>
  );
}

function slotPublicationPageDisplay(slot: { publication_page?: number | null }): string {
  const pp = slot.publication_page;
  if (pp != null && Number.isFinite(Number(pp))) return String(Number(pp));
  return "—";
}

export function FlatplanSlotsTablePanel({
  publicationId,
  slots,
  sortedSlotsForFlatplan,
  slotKeyToWorkingIndex,
  maxPreferentialInteriorPage,
  slotsReduced,
  setSlotsReduced,
  setHoveredSlotId,
  handleSlotsTableTypeChange,
  onFlatplanAddSlotAfterNine,
  onFlatplanAddSlotBeforeEnd,
}: FlatplanSlotsTablePanelProps) {
  const colSpan = slotsReduced ? 2 : 5;

  return (
    <div
      className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,box-shadow,border-radius,padding,margin,border-color] duration-[1400ms] ${
        slotsReduced
          ? "flex-[1] min-w-[280px] max-w-[38%] relative z-10 rounded-l-xl border-l border-y border-gray-200 bg-white shadow-lg pl-3"
          : "flex-1 min-w-[320px] border border-transparent pl-0 shadow-none"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase bg-white border-l border-gray-200">
                    Page
                  </th>
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
                  colSpan={colSpan}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No slots found for this issue.
                </td>
              </tr>
            ) : (
              sortedSlotsForFlatplan.flatMap((s): ReactNode[] => {
                const flatplanLookupKey = flatplanEntryKeyFromSlot(s);
                const wi = slotKeyToWorkingIndex.get(flatplanLookupKey);
                const spreadLine =
                  wi != null
                    ? isArticlePageSlotRow(s)
                      ? `Article page #${s.publication_slot_id}`
                      : `Spread ${flatplanWorkingLabel(wi)}`
                    : `Spread ${spreadIndexLabel(s, maxPreferentialInteriorPage)}`;

                const padding = isPaddingSlot(s);
                const coreStructural = !padding && isCoreStructuralMagazineSlot(s);
                const allowedTypes = effectiveSlotTableContentTypes(s);
                const normalizedType = normalizeSlotContentType(s.slot_content_type);
                const currentType = allowedTypes.includes(normalizedType)
                  ? normalizedType
                  : DEFAULT_SLOT_CONTENT_TYPE;

                const rows: ReactNode[] = [];

                if (isEndSlotRow(s) && onFlatplanAddSlotBeforeEnd) {
                  rows.push(
                    <SlotTableDividerRow
                      key={`divider-before-end-${s.publication_slot_id}`}
                      colSpan={colSpan}
                      label="Add page above"
                      onClick={onFlatplanAddSlotBeforeEnd}
                    />
                  );
                }

                rows.push(
                  <tr
                    key={s.publication_slot_id}
                    className={`align-top ${
                      padding
                        ? "bg-red-100"
                        : coreStructural
                          ? "!bg-gradient-to-br !from-indigo-100 !to-mist-400"
                          : ""
                    }`}
                  >
                    <td
                      className={`px-4 py-3 text-sm ${
                        padding
                          ? "bg-red-700 text-white"
                          : coreStructural
                            ? "border-r border-indigo-400/30 bg-white/35 text-indigo-950 backdrop-blur-[1px]"
                            : "bg-slate-900 text-white"
                      }`}
                      onMouseEnter={() => setHoveredSlotId(s.publication_slot_id)}
                      onMouseLeave={() => setHoveredSlotId(null)}
                      onFocus={() => setHoveredSlotId(s.publication_slot_id)}
                      onBlur={() => setHoveredSlotId(null)}
                    >
                      <Link
                        href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${s.publication_slot_id}`}
                        className={`font-medium ${
                          coreStructural
                            ? "text-indigo-950 hover:text-indigo-700"
                            : "text-white hover:text-gray-200"
                        }`}
                      >
                        {slotsReduced ? magazineSlotsTableReducedLabel(s) : magazineSlotsTablePrimaryLabel(s)}
                      </Link>
                      {!slotsReduced ? (
                        <>
                          <div
                            className={
                              coreStructural
                                ? "text-xs text-indigo-900/75 mt-0.5"
                                : "text-xs text-white/80 mt-0.5"
                            }
                          >
                            {spreadLine}
                          </div>
                          <div
                            className={
                              coreStructural ? "text-xs text-indigo-900/65" : "text-xs text-white/70"
                            }
                          >
                            #{s.publication_slot_id}
                          </div>
                        </>
                      ) : null}
                    </td>
                    {!slotsReduced ? (
                      <>
                        <td
                          className="px-4 py-3 text-sm text-gray-900 bg-white border-l border-gray-200 align-top font-mono tabular-nums"
                          onMouseEnter={() => setHoveredSlotId(s.publication_slot_id)}
                          onMouseLeave={() => setHoveredSlotId(null)}
                          onFocus={() => setHoveredSlotId(s.publication_slot_id)}
                          onBlur={() => setHoveredSlotId(null)}
                        >
                          {slotPublicationPageDisplay(s)}
                        </td>
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
                        <td className="px-4 py-3 text-sm text-gray-800">
                          <span className="inline-block w-32 px-2 py-1">
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

                if (isStructuralPreferentialNineSlotRow(s) && onFlatplanAddSlotAfterNine) {
                  rows.push(
                    <SlotTableDividerRow
                      key={`divider-after-9-${s.publication_slot_id}`}
                      colSpan={colSpan}
                      label="Add page below"
                      onClick={onFlatplanAddSlotAfterNine}
                    />
                  );
                }

                return rows;
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
