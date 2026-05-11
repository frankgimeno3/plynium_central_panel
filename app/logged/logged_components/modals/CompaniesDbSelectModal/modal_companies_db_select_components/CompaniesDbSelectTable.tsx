"use client";

import type { CompaniesDbRow } from "./types";

type Props = {
  pageRows: CompaniesDbRow[];
  selected: CompaniesDbRow | null;
  onSelect: (row: CompaniesDbRow) => void;
};

export function CompaniesDbSelectTable({ pageRows, selected, onSelect }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Company ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
              Commercial name
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Country</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                No companies found
              </td>
            </tr>
          ) : (
            pageRows.map((c) => (
              <tr
                key={c.companyId}
                onClick={() => onSelect(c)}
                className={`cursor-pointer hover:bg-blue-50 ${
                  selected?.companyId === c.companyId ? "bg-blue-100" : ""
                }`}
              >
                <td className="px-4 py-2 text-sm font-mono text-gray-900">{c.companyId || "—"}</td>
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.commercialName || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{c.country || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
