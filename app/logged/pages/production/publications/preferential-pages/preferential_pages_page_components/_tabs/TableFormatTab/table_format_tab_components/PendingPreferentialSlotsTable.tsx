"use client";

import React, { FC } from "react";
import { useRouter } from "next/navigation";
import { PREFERENTIAL_PAGES_BASE } from "../../../preferential_pages_constants";
import type { PendingPreferentialSlotRow } from "../../../preferential_pages_types";

type PendingPreferentialSlotsTableProps = {
  tableLoading: boolean;
  tableRows: PendingPreferentialSlotRow[];
};

export const PendingPreferentialSlotsTable: FC<PendingPreferentialSlotsTableProps> = ({
  tableLoading,
  tableRows,
}) => {
  const router = useRouter();
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-3 py-2">Portal</th>
            <th className="px-3 py-2">Magazine</th>
            <th className="px-3 py-2">Publication ID</th>
            <th className="px-3 py-2">Publication name</th>
            <th className="px-3 py-2">Position</th>
            <th className="px-3 py-2">Service group</th>
            <th className="px-3 py-2">State</th>
          </tr>
        </thead>
        <tbody>
          {tableLoading ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                Loading preferential pages…
              </td>
            </tr>
          ) : tableRows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                No pending preferential pages found.
              </td>
            </tr>
          ) : (
            tableRows.map((row) => (
              <tr
                key={`${row.preferential_slot_id}:${row.publication_id}:${row.position_in_magazine}`}
                className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/70"
                onClick={() =>
                  router.push(`${PREFERENTIAL_PAGES_BASE}/${encodeURIComponent(row.publication_id)}`)
                }
              >
                <td className="px-3 py-2 text-gray-700">{row.portal_names || "—"}</td>
                <td className="px-3 py-2 text-gray-700">
                  {row.magazine_name || row.magazine_id || "—"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-gray-700">{row.publication_id}</td>
                <td className="px-3 py-2 text-gray-900">{row.publication_edition_name || "—"}</td>
                <td className="px-3 py-2 text-gray-700">{row.section_title}</td>
                <td className="px-3 py-2 text-gray-700">{row.service_group_name}</td>
                <td className="px-3 py-2 text-gray-700">{row.state || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
