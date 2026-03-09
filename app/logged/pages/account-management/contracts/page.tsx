"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";

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
  const all = (contractsData as Contract[]).slice();
  const customers = customersData as Customer[];
  const getCompanyName = (id: string) => customers.find((c) => c.id_customer === id)?.name ?? id;
  const [filter, setFilter] = useState({ id: "", company: "", process: "", payment: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((c) => c.id_contract.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.company) list = list.filter((c) => getCompanyName(c.id_customer).toLowerCase().includes(filter.company.toLowerCase()));
    if (filter.process) list = list.filter((c) => c.process_state.toLowerCase().includes(filter.process.toLowerCase()));
    if (filter.payment) list = list.filter((c) => c.payment_state.toLowerCase().includes(filter.payment.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contracts" },
  ];

  return (
    <PageContentLayout pageTitle="Contracts" breadcrumbs={breadcrumbs}>
      <PageContentSection>
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
      </PageContentSection>

      <PageContentSection>
        <div className="overflow-x-auto">
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
              {paginated.map((c) => (
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
              ))}
            </tbody>
          </table>
        </div>

        {(filtered.length > ITEMS_PER_PAGE || totalPages > 1) && (
          <div className="flex items-center justify-between">
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
      </PageContentSection>
    </PageContentLayout>
  );
};

export default ContractsPage;
