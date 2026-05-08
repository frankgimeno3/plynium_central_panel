"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CompanyService } from "@/app/service/CompanyService";

const PAGE_SIZE = 15;

type CompanyRow = {
  companyId: string;
  commercialName: string;
  country: string;
  region: string;
};

interface CompanyPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional list of company IDs to hide (already linked). */
  excludeCompanyIds?: string[];
  onSelectCompany: (row: { companyId: string; commercialName: string }) => void;
  confirmLabel?: string;
}

const CompanyPickerModal: FC<CompanyPickerModalProps> = ({
  open,
  onClose,
  excludeCompanyIds = [],
  onSelectCompany,
  confirmLabel = "Link company",
}) => {
  const [all, setAll] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CompanyRow | null>(null);

  const exclude = useMemo(() => new Set((excludeCompanyIds || []).map((x) => String(x).trim())), [excludeCompanyIds]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await CompanyService.getAllCompanies();
      const list = Array.isArray(data)
        ? data
            .filter((c) => c && typeof (c as CompanyRow).companyId === "string")
            .map((c) => c as CompanyRow)
        : [];
      setAll(list);
    } catch (e) {
      setAll([]);
      setLoadError(e instanceof Error ? e.message : "Could not load companies.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setFilter("");
      setPage(1);
      setSelected(null);
      setLoadError(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    let list = all.filter((c) => !exclude.has(c.companyId));
    const q = filter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          (c.commercialName || "").toLowerCase().includes(q) ||
          (c.companyId || "").toLowerCase().includes(q) ||
          (c.country || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [all, filter, exclude]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
            onChange={(e) => setFilter(e.target.value)}
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
                      No companies match the filter{exclude.size ? " (or all are already linked)." : "."}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((c) => {
                    const isSel = selected?.companyId === c.companyId;
                    return (
                      <tr
                        key={c.companyId}
                        className={isSel ? "bg-blue-50" : "hover:bg-gray-50 cursor-pointer"}
                        onClick={() => setSelected(c)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="radio"
                            name="company-pick"
                            checked={isSel}
                            onChange={() => setSelected(c)}
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
            Page {page} of {totalPages} · {filtered.length} shown
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
              onClick={() => {
                if (!selected) return;
                onSelectCompany({ companyId: selected.companyId, commercialName: selected.commercialName || selected.companyId });
                onClose();
              }}
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

export default CompanyPickerModal;
