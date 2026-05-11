"use client";

import type { CompanyPickerRow } from "./types";

type Props = {
  pageRows: CompanyPickerRow[];
  selected: CompanyPickerRow | null;
  onSelect: (row: CompanyPickerRow) => void;
  excludeSize: number;
};

export function CompanyPickerTable({ pageRows, selected, onSelect, excludeSize }: Props) {
  return (
    <table className="min-w-full text-sm">
      <thead className="bg-gray-50 sticky top-0">
        <tr>
          <th className="text-left px-3 py-2 font-medium text-gray-600">Select</th>
          <th className="text-left px-3 py-2 font-medium text-gray-600">Company</th>
          <th className="text-left px-3 py-2 font-medium text-gray-600">ID</th>
          <th className="text-left px-3 py-2 font-medium text-gray-600">Country</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {pageRows.length === 0 ? (
          <tr>
            <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
              No companies match the filter{excludeSize ? " (or all are already linked)." : "."}
            </td>
          </tr>
        ) : (
          pageRows.map((c) => {
            const isSel = selected?.companyId === c.companyId;
            return (
              <tr
                key={c.companyId}
                className={isSel ? "bg-blue-50" : "hover:bg-gray-50 cursor-pointer"}
                onClick={() => onSelect(c)}
              >
                <td className="px-3 py-2">
                  <input
                    type="radio"
                    name="company-pick"
                    checked={isSel}
                    onChange={() => onSelect(c)}
                    className="cursor-pointer"
                  />
                </td>
                <td className="px-3 py-2 font-medium text-gray-900">{c.commercialName || "—"}</td>
                <td className="px-3 py-2 text-gray-600 font-mono text-xs">{c.companyId}</td>
                <td className="px-3 py-2 text-gray-600">{c.country || "—"}</td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
