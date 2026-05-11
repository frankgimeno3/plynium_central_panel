"use client";

import React from "react";
import type { PreferentialSlotApiRow } from "../../../_shared";
import { PreferentialSlotBlock } from "../../../_shared";
import type { MoveContentTypeModalState } from "./types";

export type DataPreferentialPlacementsSectionProps = {
  preferentialSlots: PreferentialSlotApiRow[];
  setMoveContentTypeModal: React.Dispatch<
    React.SetStateAction<MoveContentTypeModalState>
  >;
};

export function DataPreferentialPlacementsSection({
  preferentialSlots,
  setMoveContentTypeModal,
}: DataPreferentialPlacementsSectionProps) {
  return (
    <div className="pt-4 mt-2 border-t border-gray-200 space-y-3 min-w-0">
      <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-gray-900">Preferential placements</p>
          <p className="text-xs text-gray-500 mt-1">
            Summary of <span className="font-mono">publication_preferential_slots</span> for this
            publication.
          </p>
        </div>
        <div className="flex flex-row items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setMoveContentTypeModal({
                contentType: "summary",
                initialTarget: null,
              })
            }
            className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
          >
            Change Summary Location
          </button>
          <button
            type="button"
            onClick={() =>
              setMoveContentTypeModal({
                contentType: "index",
                initialTarget: null,
              })
            }
            className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
          >
            Change Index Location
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 max-h-[min(70vh,720px)] overflow-y-auto pr-1 auto-rows-min">
        {preferentialSlots.length === 0 ? (
          <p className="col-span-2 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
            No preferential slot data returned. If this is a magazine issue, ensure slots were
            provisioned for this publication.
          </p>
        ) : (
          preferentialSlots.map((slot) => (
            <div
              key={slot.position_in_magazine}
              className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/90 p-3 sm:p-4 shadow-sm"
            >
              <h3 className="text-sm font-semibold text-gray-900">{slot.section_title}</h3>
              <PreferentialSlotBlock slot={slot} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
