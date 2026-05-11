"use client";

import React, { FC } from "react";
import type { CompaniesDbRow } from "./types";

type Props = {
  onClose: () => void;
  loading: boolean;
  nameFilter: string;
  idFilter: string;
  countryFilter: string;
  onFilterChange: (next: {
    nameFilter: string;
    idFilter: string;
    countryFilter: string;
  }) => void;
  pageRows: CompaniesDbRow[];
  selected: CompaniesDbRow | null;
  onSelectRow: (row: CompaniesDbRow | null) => void;
  currentPage: number;
  totalPages: number;
  filteredCount: number;
  onPageChange: (p: number) => void;
  onConfirm: () => void;
};

export const CompaniesDbSelectModalPanel: FC<Props> = ({
  onClose,
  loading,
  nameFilter,
  idFilter,
  countryFilter,
  onFilterChange,
  pageRows,
  selected,
  onSelectRow,
  currentPage,
  totalPages,
  filteredCount,
  onPageChange,
  onConfirm,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="companies-db-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 id="companies-db-select-modal-title" className="text-xl font-bold text-gray-800">
              Companies database
            </h2>
            <p className="text-sm text-gray-600">Select a company from the companies DB.</p>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Name</label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) =>
                  onFilterChange({ nameFilter: e.target.value, idFilter, countryFilter })
                }
                placeholder="Filter by commercial name…"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">ID</label>
              <input
                type="text"
                value={idFilter}
                onChange={(e) => onFilterChange({ nameFilter, idFilter: e.target.value, countryFilter })}
                placeholder="Filter by company ID…"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800 font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Country</label>
              <input
                type="text"
                value={countryFilter}
                onChange={(e) =>
                  onFilterChange({ nameFilter, idFilter, countryFilter: e.target.value })
                }
                placeholder="Filter by country…"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500 py-4">Loading companies…</p>
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
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
                          onClick={() => onSelectRow(c)}
                          className={`cursor-pointer hover:bg-blue-50 ${
                            selected?.companyId === c.companyId ? "bg-blue-100" : ""
                          }`}
                        >
                          <td className="px-4 py-2 text-sm font-mono text-gray-900">{c.companyId || "—"}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">
                            {c.commercialName || "—"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{c.country || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages} ({filteredCount} companies)
                  </span>
                  <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2">
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
                    disabled={!selected}
                    className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
                  >
                    Add company
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
