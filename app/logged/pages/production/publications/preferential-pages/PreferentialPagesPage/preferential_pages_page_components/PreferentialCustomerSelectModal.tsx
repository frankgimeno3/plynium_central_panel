"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { CustomerService } from "@/app/service/CustomerService";
import type { CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";

type PreferentialCustomerSelectModalProps = {
  open: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: CustomerRow) => void;
};

export const PreferentialCustomerSelectModal: FC<PreferentialCustomerSelectModalProps> = ({
  open,
  onClose,
  onSelectCustomer,
}) => {
  const [allCustomers, setAllCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [filter, setFilter] = useState({ id: "", name: "", country: "" });

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await CustomerService.getAllCustomers();
      setAllCustomers(
        Array.isArray(list) ? list.filter((customer) => customer && typeof customer.id_customer === "string") : []
      );
    } catch (error: unknown) {
      setAllCustomers([]);
      setLoadError(error instanceof Error ? error.message : "Could not load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void loadCustomers();
  }, [open, loadCustomers]);

  useEffect(() => {
    if (!open) {
      setSelectedCustomer(null);
      setFilter({ id: "", name: "", country: "" });
      setLoadError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    let list = [...allCustomers];
    if (filter.id) {
      list = list.filter((customer) =>
        customer.id_customer.toLowerCase().includes(filter.id.toLowerCase())
      );
    }
    if (filter.name) {
      list = list.filter((customer) =>
        (customer.name || "").toLowerCase().includes(filter.name.toLowerCase())
      );
    }
    if (filter.country) {
      list = list.filter((customer) =>
        (customer.country || "").toLowerCase().includes(filter.country.toLowerCase())
      );
    }
    return list;
  }, [allCustomers, filter]);

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
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preferential-customer-select-title"
        className="mx-4 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="preferential-customer-select-title" className="text-lg font-semibold text-gray-900">
            Select customer
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-600">Name</label>
              <input
                type="text"
                value={filter.name}
                onChange={(event) => setFilter((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Filter by name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Country</label>
              <input
                type="text"
                value={filter.country}
                onChange={(event) => setFilter((prev) => ({ ...prev, country: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Filter by country"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-600">Customer ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(event) => setFilter((prev) => ({ ...prev, id: event.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Filter by ID"
              />
            </div>
          </div>

          {loading ? <p className="text-sm text-gray-500">Loading customers…</p> : null}
          {loadError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {loadError}
            </p>
          ) : null}

          <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Country</th>
                  <th className="px-3 py-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => {
                  const selected = selectedCustomer?.id_customer === customer.id_customer;
                  return (
                    <tr
                      key={customer.id_customer}
                      className={`cursor-pointer border-t border-gray-100 ${
                        selected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <td className="px-3 py-2 text-gray-900">{customer.name || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{customer.country || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-600">
                        {customer.id_customer}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-sm text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCustomer}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Select customer
          </button>
        </div>
      </div>
    </div>
  );
};
