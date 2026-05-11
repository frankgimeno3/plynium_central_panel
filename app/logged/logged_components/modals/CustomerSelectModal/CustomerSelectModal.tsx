"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { CustomerService } from "@/app/service/CustomerService";
import { CUSTOMER_SELECT_DEFAULT_PAGE_SIZE } from "./modal_customer_select_components/constants";
import { CustomerSelectFilters } from "./modal_customer_select_components/CustomerSelectFilters";
import { CustomerSelectPaginationControls } from "./modal_customer_select_components/CustomerSelectPaginationControls";
import { CustomerSelectTableRows } from "./modal_customer_select_components/CustomerSelectTableRows";
import type {
  CustomerRow,
  CustomerSelectFilterState,
  CustomerSelectModalProps,
} from "./modal_customer_select_components/types";

export type { CustomerRow } from "./modal_customer_select_components/types";

const EMPTY_FILTER: CustomerSelectFilterState = { id: "", name: "", cif: "", country: "" };

const CustomerSelectModal: FC<CustomerSelectModalProps> = ({
  open,
  onClose,
  onSelectCustomer,
  pageSize: pageSizeProp,
  confirmLabel = "Select account",
}) => {
  const pageSize = pageSizeProp ?? CUSTOMER_SELECT_DEFAULT_PAGE_SIZE;
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [filter, setFilter] = useState<CustomerSelectFilterState>(EMPTY_FILTER);
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
    if (filter.country)
      list = list.filter((c) => (c.country || "").toLowerCase().includes(filter.country.toLowerCase()));
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
      setFilter(EMPTY_FILTER);
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
          <CustomerSelectFilters filter={filter} onChange={setFilter} />

          <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CIF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proposals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contracts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Projects
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <CustomerSelectTableRows
                  loading={loading}
                  loadError={loadError}
                  paginated={paginated}
                  selectedCustomer={selectedCustomer}
                  onSelect={setSelectedCustomer}
                />
              </tbody>
            </table>
          </div>

          <CustomerSelectPaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
            onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          />

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
