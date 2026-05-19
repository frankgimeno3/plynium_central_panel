"use client";

import React, { FC } from "react";
import { useRouter } from "next/navigation";
import type { PublicationDbRow } from "./types";
import { PUBLICATIONS_ISSUES_BASE } from "./constants";
import { monthName } from "./utils";

export type IssuesDataTableProps = {
  rows: PublicationDbRow[];
};

const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

export const IssuesDataTable: FC<IssuesDataTableProps> = ({ rows }) => {
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
              Edition name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expected month
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magazine</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-6 text-center text-sm text-gray-500">
                No issues found for this view.
              </td>
            </tr>
          ) : (
            rows.map((p) => (
              <tr
                key={p.publication_id}
                onClick={() =>
                  router.push(`${PUBLICATIONS_ISSUES_BASE}/issues/${encodeURIComponent(p.publication_id)}`)
                }
                className={rowClass}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.publication_id}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{p.publication_edition_name || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.publication_theme || "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {p.publication_year != null ? p.publication_year : "—"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {monthName(p.publication_expected_publication_month)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{p.magazine_id ?? "—"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.publication_format}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {p.publication_status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
