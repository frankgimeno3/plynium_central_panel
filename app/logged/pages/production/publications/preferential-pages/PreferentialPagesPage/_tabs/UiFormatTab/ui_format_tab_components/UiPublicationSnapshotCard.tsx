"use client";

import React, { FC } from "react";
import Link from "next/link";
import { PreferentialSlotBlock } from "../../../../../[id_publication]/_shared";
import { PREFERENTIAL_PAGES_BASE, CONTRACTS_BASE } from "../../../preferential_pages_constants";
import type { PublicationPreferentialSnapshot } from "../../../preferential_pages_types";
import { slotIsSold } from "../../../preferential_pages_types";

type UiPublicationSnapshotCardProps = {
  snapshot: PublicationPreferentialSnapshot;
};

export const UiPublicationSnapshotCard: FC<UiPublicationSnapshotCardProps> = ({ snapshot }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-base font-semibold text-gray-800">
          {snapshot.publication_edition_name || snapshot.publication_id}
        </h3>
        <p className="font-mono text-xs text-gray-500">{snapshot.publication_id}</p>
      </div>
      <Link
        href={`${PREFERENTIAL_PAGES_BASE}/${encodeURIComponent(snapshot.publication_id)}`}
        className="text-sm font-medium text-blue-700 hover:text-blue-900"
      >
        Open publication detail
      </Link>
    </div>
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      {snapshot.slots.map((slot) => (
        <div
          key={`${snapshot.publication_id}:${slot.position_in_magazine}`}
          className="rounded-lg border border-gray-200 bg-white p-3"
        >
          <p className="text-sm font-medium text-gray-800">{slot.section_title}</p>
          <p className="text-xs text-gray-500">{slot.position_in_magazine}</p>
          <PreferentialSlotBlock slot={slot} />
          {slotIsSold(slot) && slot.contract_id ? (
            <Link
              href={`${CONTRACTS_BASE}/${encodeURIComponent(slot.contract_id)}`}
              className="mt-3 block rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 hover:border-emerald-300 hover:shadow-sm"
            >
              <p className="text-[10px] uppercase tracking-wide text-emerald-700">Sold contract</p>
              <p className="font-mono text-xs">{slot.contract_id}</p>
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  </div>
);
