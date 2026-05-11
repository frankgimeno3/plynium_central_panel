"use client";

import React, { FC } from "react";
import { useRouter } from "next/navigation";
import type { PlannedPublication } from "./types";

const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

type Props = {
  rows: PlannedPublication[];
};

export const PublicationsManagementListTable: FC<Props> = ({ rows }) => {
  const router = useRouter();

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Edition
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Theme
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Publication date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((p) => (
            <tr
              key={p.id_publication}
              onClick={() =>
                router.push(
                  `/logged/pages/production/publications_management/${encodeURIComponent(p.id_publication)}`
                )
              }
              className={rowClass}
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id_publication}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{p.edition_name ?? "—"}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{p.theme ?? "—"}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {p.publication_date ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
