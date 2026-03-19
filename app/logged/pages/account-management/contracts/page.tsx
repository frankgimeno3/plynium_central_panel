"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CustomerService } from "@/app/service/CustomerService";
import { ContractService } from "@/app/service/ContractService";

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  process_state: string;
  payment_state: string;
  title: string;
  amount_eur?: number;
};

type Customer = { id_customer: string; name: string };

const ITEMS_PER_PAGE = 12;

const ContractsPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  useEffect(() => {
    CustomerService.getAllCustomers()
      .then((list: Customer[]) => setCustomers(Array.isArray(list) ? list : []))
      .catch(() => setCustomers([]));
  }, []);
  const loadContracts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ContractService.getAllContracts();
      setAll(Array.isArray(list) ? list : []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);
  const getCompanyName = (id: string) => customers.find((c) => c.id_customer === id)?.name ?? id;
  const [filter, setFilter] = useState({ id: "", company: "", process: "", payment: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((c) => c.id_contract.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.company) list = list.filter((c) => getCompanyName(c.id_customer).toLowerCase().includes(filter.company.toLowerCase()));
    if (filter.process) list = list.filter((c) => c.process_state.toLowerCase().includes(filter.process.toLowerCase()));
    if (filter.payment) list = list.filter((c) => c.payment_state.toLowerCase().includes(filter.payment.toLowerCase()));
    return list;
  }, [all, filter, customers]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contracts" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Contracts", breadcrumbs });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID</label>
              <input
                type="text"
                value={filter.id}
                onChange={(e) => { setFilter((f) => ({ ...f, id: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Company</label>
              <input
                type="text"
                value={filter.company}
                onChange={(e) => { setFilter((f) => ({ ...f, company: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by company"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Process state</label>
              <select
                value={filter.process}
                onChange={(e) => { setFilter((f) => ({ ...f, process: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="active">active</option>
                <option value="expired">expired</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payment state</label>
              <select
                value={filter.payment}
                onChange={(e) => { setFilter((f) => ({ ...f, payment: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="paid">paid</option>
                <option value="pending">pending</option>
              </select>
            </div>
          </div>

        <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Loading contracts…
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No contracts yet.
                  </td>
                </tr>
              ) : (
              paginated.map((c) => (
                <tr key={c.id_contract} onClick={() => router.push(`/logged/pages/account-management/contracts/${c.id_contract}`)} className={rowClass}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.id_contract}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getCompanyName(c.id_customer)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.process_state === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{c.process_state}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.payment_state === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{c.payment_state}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.amount_eur != null ? c.amount_eur.toLocaleString() : "—"}</td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {(filtered.length > ITEMS_PER_PAGE || totalPages > 1) && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {start + 1}–{Math.min(start + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages || 1}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </div>
        )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ContractsPage;
