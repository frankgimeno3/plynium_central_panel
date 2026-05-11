"use client";

import type { CompanyRow } from "./types";

type CompanyFilter = { id: string; name: string };

type Props = {
  companyFilter: CompanyFilter;
  onCompanyFilterChange: (next: CompanyFilter) => void;
  filteredCompanies: CompanyRow[];
  onPickCompany: (company: CompanyRow) => void;
  onBack: () => void;
  onCancel: () => void;
};

export function ArticleRelatePhase2({
  companyFilter,
  onCompanyFilterChange,
  filteredCompanies,
  onPickCompany,
  onBack,
  onCancel,
}: Props) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={companyFilter.name}
          onChange={(e) => onCompanyFilterChange({ ...companyFilter, name: e.target.value })}
          placeholder="Filter by company name"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
        <input
          type="text"
          value={companyFilter.id}
          onChange={(e) => onCompanyFilterChange({ ...companyFilter, id: e.target.value })}
          placeholder="Filter by company ID"
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
      </div>
      <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Country
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  No companies found.
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr
                  key={company.companyId}
                  onClick={() => void onPickCompany(company)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900">{company.commercialName || "—"}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{company.companyId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{company.country || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between border-t border-gray-200 pt-3">
        <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">
          Back
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-900">
          Cancel
        </button>
      </div>
    </div>
  );
}
