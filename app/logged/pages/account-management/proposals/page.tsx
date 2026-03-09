"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import proposalsData from "@/app/contents/proposals.json";
import customersData from "@/app/contents/customers.json";
import servicesData from "@/app/contents/services.json";

type Proposal = {
  id_proposal: string;
  id_customer: string;
  status: string;
  title: string;
  amount_eur: number;
  date_created: string;
  servicesArray?: { id_service: string; price: number; description: string }[];
};

type Customer = { id_customer: string; name: string };
type Service = { id_service: string; name: string };

const ITEMS_PER_PAGE = 12;

const ProposalsPage: FC = () => {
  const router = useRouter();
  const all = (proposalsData as Proposal[]).slice();
  const customers = customersData as Customer[];
  const services = servicesData as Service[];
  const getCompanyName = (id: string) => customers.find((c) => c.id_customer === id)?.name ?? id;
  const getServiceName = (id: string) => services.find((s) => s.id_service === id)?.name?.replace(/_/g, " ") ?? id;
  const [filter, setFilter] = useState({ id: "", company: "", status: "", service: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((p) => p.id_proposal.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.company) list = list.filter((p) => getCompanyName(p.id_customer).toLowerCase().includes(filter.company.toLowerCase()));
    if (filter.status) list = list.filter((p) => p.status.toLowerCase().includes(filter.status.toLowerCase()));
    if (filter.service) list = list.filter((p) => p.servicesArray?.some((s) => s.id_service === filter.service));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Proposals" },
  ];

  return (
    <PageContentLayout
      pageTitle="Proposals"
      breadcrumbs={breadcrumbs}
      buttons={[{ label: "Crear", href: "/logged/pages/account-management/proposals/create" }]}
    >
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
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => { setFilter((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="pending">pending</option>
                <option value="accepted">accepted</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Service</label>
              <select
                value={filter.service}
                onChange={(e) => { setFilter((f) => ({ ...f, service: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                {services.map((s) => (
                  <option key={s.id_service} value={s.id_service}>{s.name?.replace(/_/g, " ")}</option>
                ))}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((p) => (
                <tr key={p.id_proposal} onClick={() => router.push(`/logged/pages/account-management/proposals/${p.id_proposal}`)} className={rowClass}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id_proposal}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getCompanyName(p.id_customer)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === "accepted" ? "bg-green-100 text-green-800" :
                      p.status === "rejected" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.servicesArray?.length
                      ? p.servicesArray.map((s) => getServiceName(s.id_service)).join(", ") || "—"
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.amount_eur?.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.date_created}</td>
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

export default ProposalsPage;
