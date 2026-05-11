"use client";

import React, { FC } from "react";
import type { Company } from "@/app/contents/interfaces";

type Props = {
  onClose: () => void;
  loading: boolean;
  nameFilter: string;
  onFilterChange: (name: string) => void;
  filteredCompanies: Company[];
  selectedCompany: Company | null;
  onSelectCompanyRow: (c: Company) => void;
  onConfirm: () => void;
};

export const CompanyDirectorySelectModalPanel: FC<Props> = ({
  onClose,
  loading,
  nameFilter,
  onFilterChange,
  filteredCompanies,
  selectedCompany,
  onSelectCompanyRow,
  onConfirm,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-directory-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="company-directory-select-modal-title" className="text-xl font-bold text-gray-800">
            Select company
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          <p className="text-sm text-gray-600">
            Choose a company from the directory. Required for portal assignment.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">Filter</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => onFilterChange(e.target.value)}
              placeholder="Filter by name, ID, country, category…"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
            />
          </div>

          {loading ? (
            <p className="text-gray-500 py-4">Loading companies…</p>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        Company ID
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        Commercial name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        Country
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        Category
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                          No companies found
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((c) => (
                        <tr
                          key={c.companyId}
                          onClick={() => onSelectCompanyRow(c)}
                          className={`cursor-pointer hover:bg-blue-50 ${
                            selectedCompany?.companyId === c.companyId ? "bg-blue-100" : ""
                          }`}
                        >
                          <td className="px-4 py-2 text-sm font-mono text-gray-900">{c.companyId || "—"}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {c.commercialName || "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{c.country || "—"}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{c.category || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  disabled={!selectedCompany}
                  className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
                >
                  Select company
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
