"use client";

import type { CompanyRow } from "./types";

type Props = {
  rows: CompanyRow[];
  selectedCompany: CompanyRow | null;
  onSelectCompany: (c: CompanyRow) => void;
};

export function CompanySelectCompaniesTable({ rows, selectedCompany, onSelectCompany }: Props) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Commercial name</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Country</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Region</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                No companies found
              </td>
            </tr>
          ) : (
            rows.map((c) => (
              <tr
                key={c.companyId}
                onClick={() => onSelectCompany(c)}
                className={`cursor-pointer hover:bg-blue-50 ${
                  selectedCompany?.companyId === c.companyId ? "bg-blue-100" : ""
                }`}
              >
                <td className="px-4 py-2 text-sm font-medium text-gray-900">{c.commercialName || c.companyId || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{c.country || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{c.region || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-600">{c.mainEmail || "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
