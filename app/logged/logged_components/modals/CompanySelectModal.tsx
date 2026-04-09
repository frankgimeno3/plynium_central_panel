"use client";

import React, { FC, useState, useEffect, useCallback, useMemo } from "react";
import { CompanyService } from "@/app/service/CompanyService";

const PAGE_SIZE = 20;

export interface CompanyRow {
  companyId: string;
  commercialName: string;
  country: string;
  category: string;
  mainEmail: string;
}

interface Publication {
  portalId: number;
  portalName: string;
}

interface CompanySelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCompany: (payload: { companyId: string; commercialName: string }) => void;
  publications: Publication[];
}

const CompanySelectModal: FC<CompanySelectModalProps> = ({
  open,
  onClose,
  onSelectCompany,
  publications,
}) => {
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [page, setPage] = useState(0);

  const fetchCompanies = useCallback(async (portalId: number) => {
    setLoading(true);
    try {
      const data = await CompanyService.getCompaniesByPortal(portalId);
      setCompanies(Array.isArray(data) ? data : []);
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (publications.length === 1) {
      setSelectedPortalId(publications[0].portalId);
    } else {
      setSelectedPortalId(null);
    }
    setNameFilter("");
    setSelectedCompany(null);
    setPage(0);
  }, [open, publications]);

  useEffect(() => {
    if (open && selectedPortalId != null) {
      fetchCompanies(selectedPortalId);
    } else {
      setCompanies([]);
    }
  }, [open, selectedPortalId, fetchCompanies]);

  const filteredCompanies = useMemo(() => {
    const list = [...companies];
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      return list.filter(
        (c) =>
          (c.commercialName ?? "").toLowerCase().includes(q) ||
          (c.companyId ?? "").toLowerCase().includes(q) ||
          (c.country ?? "").toLowerCase().includes(q) ||
          (c.category ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [companies, nameFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * PAGE_SIZE;
  const pageCompanies = useMemo(
    () => filteredCompanies.slice(start, start + PAGE_SIZE),
    [filteredCompanies, start]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [page, totalPages]);

  const handleConfirm = () => {
    if (!selectedCompany) return;
    onSelectCompany({
      companyId: selectedCompany.companyId,
      commercialName: selectedCompany.commercialName ?? selectedCompany.companyId,
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
      aria-labelledby="company-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="company-select-modal-title" className="text-xl font-bold text-gray-800">
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
          {publications.length === 0 ? (
            <p className="text-gray-600">
              Add the article to a portal first (Published in portals). Then you can choose a company from that portal.
            </p>
          ) : (
            <>
              {publications.length > 1 && (
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-700">Portal</label>
                  <select
                    value={selectedPortalId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : null;
                      setSelectedPortalId(v);
                      setPage(0);
                      setSelectedCompany(null);
                    }}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-800"
                  >
                    <option value="">Select a portal…</option>
                    {publications.map((p) => (
                      <option key={p.portalId} value={p.portalId}>
                        {p.portalName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedPortalId != null && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold text-gray-700">Filter by name</label>
                    <input
                      type="text"
                      value={nameFilter}
                      onChange={(e) => {
                        setNameFilter(e.target.value);
                        setPage(0);
                        setSelectedCompany(null);
                      }}
                      placeholder="Type to filter companies…"
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
                                Commercial name
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                Country
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                Category
                              </th>
                              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                                Email
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {pageCompanies.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                                  No companies found
                                </td>
                              </tr>
                            ) : (
                              pageCompanies.map((c) => (
                                <tr
                                  key={c.companyId}
                                  onClick={() => setSelectedCompany(c)}
                                  className={`cursor-pointer hover:bg-blue-50 ${
                                    selectedCompany?.companyId === c.companyId ? "bg-blue-100" : ""
                                  }`}
                                >
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {c.commercialName || c.companyId || "—"}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{c.country || "—"}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{c.category || "—"}</td>
                                  <td className="px-4 py-2 text-sm text-gray-600">{c.mainEmail || "—"}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-2">
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
                            Page {currentPage + 1} of {totalPages} ({filteredCompanies.length} companies)
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
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={!selectedCompany}
                          className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
                        >
                          Confirm
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanySelectModal;
