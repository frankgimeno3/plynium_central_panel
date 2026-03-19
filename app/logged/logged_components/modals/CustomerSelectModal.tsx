"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { CustomerService } from "@/app/service/CustomerService";

export interface CustomerRow {
  id_customer: string;
  name: string;
  cif: string;
  country: string;
  contact?: { name: string; role: string; email: string; phone: string };
  proposals?: string[];
  contracts?: string[];
  projects?: string[];
}

const DEFAULT_PAGE_SIZE = 10;

interface CustomerSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerRow) => void;
  /** Table page size (default 10). Use e.g. 20 for "20 per page". */
  pageSize?: number;
  /** Confirm button label (default "Select account"). Use e.g. "Continue" for link-to-account flow. */
  confirmLabel?: string;
}

const CustomerSelectModal: FC<CustomerSelectModalProps> = ({
  open,
  onClose,
  onSelectCustomer,
  pageSize: pageSizeProp,
  confirmLabel = "Select account",
}) => {
  const pageSize = pageSizeProp ?? DEFAULT_PAGE_SIZE;
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [filter, setFilter] = useState({ id: "", name: "", cif: "", country: "" });
  const [currentPage, setCurrentPage] = useState(1);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await CustomerService.getAllCustomers();
      setAllCustomers(Array.isArray(list) ? list.filter((c) => c && typeof c.id_customer === "string") : []);
    } catch (err) {
      setAllCustomers([]);
      const message = err instanceof Error ? err.message : "Could not load customers from database.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadCustomers();
  }, [open, loadCustomers]);

  const filtered = useMemo(() => {
    let list = [...allCustomers];
    if (filter.id) list = list.filter((c) => c.id_customer.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((c) => (c.name || "").toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.cif) list = list.filter((c) => (c.cif || "").toLowerCase().includes(filter.cif.toLowerCase()));
    if (filter.country) list = list.filter((c) => (c.country || "").toLowerCase().includes(filter.country.toLowerCase()));
    return list;
  }, [allCustomers, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  useEffect(() => {
    if (!open) {
      setSelectedCustomer(null);
      setFilter({ id: "", name: "", cif: "", country: "" });
      setCurrentPage(1);
      setLoadError(null);
    }
  }, [open]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter.id, filter.name, filter.cif, filter.country]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleConfirm = () => {
    if (!selectedCustomer) return;
    onSelectCustomer(selectedCustomer);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-select-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="customer-select-modal-title" className="text-xl font-bold text-gray-800">
            Select customer account
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
          <p className="text-sm text-gray-600">Filter and select a customer account.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">CIF</label>
              <input
                type="text"
                value={filter.cif}
                onChange={(e) => setFilter((f) => ({ ...f, cif: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by CIF"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Country</label>
              <input
                type="text"
                value={filter.country}
                onChange={(e) => setFilter((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                placeholder="Search by country"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIF</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      Loading customers…
                    </td>
                  </tr>
                ) : loadError ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <p className="text-amber-700 font-medium">Could not load customers</p>
                      <p className="text-sm text-gray-600 mt-1">{loadError}</p>
                      <p className="text-xs text-gray-500 mt-2">Check .env (DATABASE_*) and that the customers_db table exists in your RDS.</p>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((c) => {
                    const isSelected = selectedCustomer?.id_customer === c.id_customer;
                    return (
                      <tr
                        key={c.id_customer}
                        onClick={() => setSelectedCustomer(c)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-blue-100 hover:bg-blue-100" : "hover:bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{c.id_customer}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.cif || "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.country || "—"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{c.contact?.name ? `${c.contact.name} (${c.contact.role || ""})` : "—"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.proposals || []).length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.contracts || []).length}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(c.projects || []).length}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Previous page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  aria-label="Next page"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}

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
              onClick={handleConfirm}
              disabled={!selectedCustomer}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSelectModal;
