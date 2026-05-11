"use client";

import React, { FC } from "react";
import type { CompanyPickerRow } from "./types";

type Props = {
  onClose: () => void;
  filter: string;
  onFilterChange: (v: string) => void;
  loading: boolean;
  loadError: string | null;
  pageRows: CompanyPickerRow[];
  page: number;
  totalPages: number;
  filteredLength: number;
  selected: CompanyPickerRow | null;
  onSelectRow: (row: CompanyPickerRow | null) => void;
  onPageChange: (p: number | ((prev: number) => number)) => void;
  confirmLabel: string;
  onConfirm: () => void;
  excludeCount: number;
};

export const CompanyPickerModalPanel: FC<Props> = ({
  onClose,
  filter,
  onFilterChange,
  loading,
  loadError,
  pageRows,
  page,
  totalPages,
  filteredLength,
  selected,
  onSelectRow,
  onPageChange,
  confirmLabel,
  onConfirm,
  excludeCount,
}) => {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-picker-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <h2 id="company-picker-title" className="text-lg font-semibold text-gray-900">
            Select a directory company
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="p-4 border-b border-gray-100 space-y-2">
          <input
            type="search"
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Filter by name, ID, or country…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading && <p className="p-4 text-sm text-gray-500">Loading companies…</p>}
          {loadError && <p className="p-4 text-sm text-red-700">{loadError}</p>}
          {!loading && !loadError && (
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
                      No companies match the filter{excludeCount ? " (or all are already linked)." : "."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((c) => {
                    const isSel = selected?.companyId === c.companyId;
                    return (
                      <tr
                        key={c.companyId}
                        className={isSel ? "bg-blue-50" : "hover:bg-gray-50 cursor-pointer"}
                        onClick={() => onSelectRow(c)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="company-pick"
                            checked={isSel}
                            onChange={() => onSelectRow(c)}
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
          )}
        </div>
        <div className="p-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-gray-500">
            Page {page} of {totalPages} · {filteredLength} shown
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
            >
              Next
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm border border-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={onConfirm}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-950 text-white font-medium disabled:opacity-50"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
