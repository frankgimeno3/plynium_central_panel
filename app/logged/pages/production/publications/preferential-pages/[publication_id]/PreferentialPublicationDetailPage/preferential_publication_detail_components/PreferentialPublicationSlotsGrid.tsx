"use client";

import React, { FC } from "react";
import Link from "next/link";
import { PreferentialSlotApiRow, PreferentialSlotBlock } from "../../../../[id_publication]/_shared";
import { CONTRACTS_BASE } from "../preferential_publication_constants";

type PreferentialPublicationSlotsGridProps = {
  slots: PreferentialSlotApiRow[];
};

export const PreferentialPublicationSlotsGrid: FC<PreferentialPublicationSlotsGridProps> = ({ slots }) => (
  <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
    {slots.map((slot) => {
      const contractId = String(slot.contract_id ?? "").trim();
      const isSold = String(slot.state ?? "").toLowerCase() === "bought" || Boolean(contractId);
      return (
        <div
          key={`${slot.position_in_magazine}:${slot.preferential_slot_id ?? "missing"}`}
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">{slot.section_title}</p>
              <p className="text-xs text-gray-500">{slot.position_in_magazine}</p>
            </div>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
              {slot.state || "—"}
            </span>
          </div>

          <PreferentialSlotBlock slot={slot} />

          {isSold && contractId ? (
            <Link
              href={`${CONTRACTS_BASE}/${encodeURIComponent(contractId)}`}
              className="mt-3 block rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 hover:border-emerald-300 hover:shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Sold contract</p>
              <p className="font-mono text-xs">{contractId}</p>
            </Link>
          ) : null}
        </div>
      );
    })}
  </div>
);
