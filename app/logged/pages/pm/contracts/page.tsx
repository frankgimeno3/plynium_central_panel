"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import contractsData from "@/app/contents/contracts.json";

type Contract = {
  id_contract: string;
  id_proposal: string;
  id_customer: string;
  process_state: string;
  payment_state: string;
  title: string;
};

const ITEMS_PER_PAGE = 12;

const ContractsPage: FC = () => {
  const router = useRouter();
  const all = (contractsData as Contract[]).slice();
  const [filter, setFilter] = useState({ id: "", title: "", process: "", payment: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((c) => c.id_contract.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.title) list = list.filter((c) => c.title.toLowerCase().includes(filter.title.toLowerCase()));
    if (filter.process) list = list.filter((c) => c.process_state.toLowerCase().includes(filter.process.toLowerCase()));
    if (filter.payment) list = list.filter((c) => c.payment_state.toLowerCase().includes(filter.payment.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Contracts</p>
      </div>

      <div className="flex flex-col w-full gap-4 p-12">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
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
              <label className="block text-xs text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={filter.title}
                onChange={(e) => { setFilter((f) => ({ ...f, title: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by title"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Process state</label>
              <input
                type="text"
                value={filter.process}
                onChange={(e) => { setFilter((f) => ({ ...f, process: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="active, expired"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Payment state</label>
              <input
                type="text"
                value={filter.payment}
                onChange={(e) => { setFilter((f) => ({ ...f, payment: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="pending, paid"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((c) => (
                <tr key={c.id_contract} onClick={() => router.push(`/logged/pages/pm/contracts/${c.id_contract}`)} className={rowClass}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.id_contract}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.process_state === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}>{c.process_state}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${c.payment_state === "paid" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{c.payment_state}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length > ITEMS_PER_PAGE && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {start + 1}–{Math.min(start + ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
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
  );
};

export default ContractsPage;
