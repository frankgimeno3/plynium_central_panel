"use client";

import Link from "next/link";

import {
  allowedSlotContentTypes,
  articlePageSlotEntryKey,
  BASE,
  DEFAULT_SLOT_CONTENT_TYPE,
  flatplanWorkingLabel,
  isArticlePageSlotRow,
  isPaddingSlot,
  normalizeSlotContentType,
  SlotContentCard,
  spreadIndexLabel,
} from "../../../_shared";

import type { FlatplanTabProps } from "./types";

type FlatplanSlotsTablePanelProps = Pick<
  FlatplanTabProps,
  | "publicationId"
  | "slots"
  | "sortedSlotsForFlatplan"
  | "slotKeyToWorkingIndex"
  | "maxNumericSlotKey"
  | "slotsReduced"
  | "setSlotsReduced"
  | "setHoveredSlotId"
  | "handleSlotsTableTypeChange"
>;

export function FlatplanSlotsTablePanel({
  publicationId,
  slots,
  sortedSlotsForFlatplan,
  slotKeyToWorkingIndex,
  maxNumericSlotKey,
  slotsReduced,
  setSlotsReduced,
  setHoveredSlotId,
  handleSlotsTableTypeChange,
}: FlatplanSlotsTablePanelProps) {
  return (
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
                const flatplanLookupKey = isArticlePageSlotRow(s)
                  ? articlePageSlotEntryKey(s.publication_slot_id)
                  : String(s.slot_key);
                const wi = slotKeyToWorkingIndex.get(flatplanLookupKey);
                const spreadLine =
                  wi != null
                    ? isArticlePageSlotRow(s)
                      ? `Article page #${s.publication_slot_id}`
                      : `Spread ${flatplanWorkingLabel(wi)}`
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
                          <div className="text-xs text-white/80 mt-0.5">{spreadLine}</div>
                          <div className="text-xs text-white/70">#{s.publication_slot_id}</div>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
