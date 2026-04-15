"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { CompanyService } from "@/app/service/CompanyService";

const PAGE_SIZE = 10;

export interface CompaniesDbRow {
  companyId: string;
  commercialName: string;
  country: string;
  category?: string;
}

interface CompaniesDbSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (payload: { companyId: string; commercialName: string; country?: string }) => void;
}

const CompaniesDbSelectModal: FC<CompaniesDbSelectModalProps> = ({
  open,
  onClose,
  onSelectCompany,
}) => {
  const [companies, setCompanies] = useState<CompaniesDbRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CompaniesDbRow | null>(null);
  const [page, setPage] = useState(0);

  const [nameFilter, setNameFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelected(null);
    setPage(0);
    setNameFilter("");
    setIdFilter("");
    setCountryFilter("");
    CompanyService.getAllCompanies()
      .then((data: unknown) => {
        setCompanies(Array.isArray(data) ? (data as CompaniesDbRow[]) : []);
      })
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = [...companies];
    const qName = nameFilter.trim().toLowerCase();
    const qId = idFilter.trim().toLowerCase();
    const qCountry = countryFilter.trim().toLowerCase();
    if (qName) {
      list = list.filter((c) => (c.commercialName ?? "").toLowerCase().includes(qName));
    }
    if (qId) {
      list = list.filter((c) => (c.companyId ?? "").toLowerCase().includes(qId));
    }
    if (qCountry) {
      list = list.filter((c) => (c.country ?? "").toLowerCase().includes(qCountry));
    }
    return list;
  }, [companies, nameFilter, idFilter, countryFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageRows = useMemo(() => filtered.slice(start, start + PAGE_SIZE), [filtered, start]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [page, totalPages]);

  const handleConfirm = () => {
    if (!selected) return;
    onSelectCompany({
      companyId: selected.companyId,
      commercialName: selected.commercialName ?? selected.companyId,
      country: selected.country ?? "",
    });
    onClose();
  };

  if (!open) return null;

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
                onChange={(e) => {
                  setNameFilter(e.target.value);
                  setPage(0);
                  setSelected(null);
                }}
                placeholder="Filter by commercial name…"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">ID</label>
              <input
                type="text"
                value={idFilter}
                onChange={(e) => {
                  setIdFilter(e.target.value);
                  setPage(0);
                  setSelected(null);
                }}
                placeholder="Filter by company ID…"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl text-gray-800 font-mono text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Country</label>
              <input
                type="text"
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setPage(0);
                  setSelected(null);
                }}
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
                          onClick={() => setSelected(c)}
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
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages} ({filtered.length} companies)
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
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
                    onClick={handleConfirm}
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

export default CompaniesDbSelectModal;

