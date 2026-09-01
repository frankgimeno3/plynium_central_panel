"use client";

import React, { FC } from "react";
import type { PreferentialSlotApiRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
  isPreferentialSelectable,
  preferentialStatusClass,
  preferentialStatusLabel,
  preferentialUiStatus,
  premiumPreferentialSlots,
} from "./preferentialSlotUi";

type PreferentialFlatplanMiniProps = {
  slots: PreferentialSlotApiRow[];
  selectedPosition: string | null;
  onSelectPosition: (position: string, slot: PreferentialSlotApiRow) => void;
};

function pageNumber(slot: PreferentialSlotApiRow): string {
  return String(slot.position_in_magazine ?? "").replace(/[^\d]/g, "") || "?";
}

const PageButton: FC<{
  slot: PreferentialSlotApiRow;
  selectedPosition: string | null;
  onSelectPosition: (position: string, slot: PreferentialSlotApiRow) => void;
}> = ({ slot, selectedPosition, onSelectPosition }) => {
  const pos = String(slot.position_in_magazine ?? "").trim();
  const status = preferentialUiStatus(slot);
  const selectable = isPreferentialSelectable(status);
  const selected = selectedPosition === pos;
  return (
    <button
      type="button"
      disabled={!selectable}
      onClick={() => selectable && onSelectPosition(pos, slot)}
      className={`w-full rounded-md border px-2 py-3 text-left transition-colors ${preferentialStatusClass(status, selected)}`}
    >
      <p className="text-xs font-bold">Preferential page {pageNumber(slot)}</p>
      <p className="text-[10px] mt-1 leading-tight">{preferentialStatusLabel(status)}</p>
    </button>
  );
};

export const PreferentialFlatplanMini: FC<PreferentialFlatplanMiniProps> = ({
  slots,
  selectedPosition,
  onSelectPosition,
}) => {
  const premiumSlots = premiumPreferentialSlots(slots);

  if (!premiumSlots.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        No preferential pages for this edition yet.
      </div>
    );
  }

  const pageOne = premiumSlots.find((s) => pageNumber(s) === "1") ?? null;
  const rest = premiumSlots.filter((s) => pageNumber(s) !== "1");

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Preferential Premium pages 1–9</p>
      <div className="space-y-2">
        {pageOne && (
          <div className="grid grid-cols-2 gap-2">
            <div aria-hidden className="min-h-[1px]" />
            <PageButton slot={pageOne} selectedPosition={selectedPosition} onSelectPosition={onSelectPosition} />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {rest.map((slot) => (
            <PageButton
              key={String(slot.position_in_magazine ?? "").trim()}
              slot={slot}
              selectedPosition={selectedPosition}
              onSelectPosition={onSelectPosition}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
