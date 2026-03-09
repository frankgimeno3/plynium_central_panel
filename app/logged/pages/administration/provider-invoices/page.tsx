"use client";

import React, { FC, useMemo, useState } from "react";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import providerInvoicesData from "@/app/contents/provider_invoices.json";
import type { ProviderInvoice } from "@/app/contents/interfaces";

const ProviderInvoicesPage: FC = () => {
  const all = (providerInvoicesData as ProviderInvoice[]).slice();
  const [filter, setFilter] = useState({
    provider: "",
    fromDate: "",
    toDate: "",
  });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.provider)
      list = list.filter(
        (r) =>
          r.provider_name.toLowerCase().includes(filter.provider.toLowerCase()) ||
          r.id_provider.toLowerCase().includes(filter.provider.toLowerCase())
      );
    if (filter.fromDate)
      list = list.filter((r) => r.payment_date >= filter.fromDate);
    if (filter.toDate)
      list = list.filter((r) => r.payment_date <= filter.toDate);
    return list;
  }, [all, filter]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Provider invoices" },
  ];

  return (
    <PageContentLayout pageTitle="Provider invoices" breadcrumbs={breadcrumbs}>
      <PageContentSection>
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Provider</label>
              <input
                type="text"
                value={filter.provider}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, provider: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Provider name or ID"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">From date</label>
              <input
                type="date"
                value={filter.fromDate}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, fromDate: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To date</label>
              <input
                type="date"
                value={filter.toDate}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, toDate: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
      </PageContentSection>

      <PageContentSection>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <Link
                      href={`/logged/pages/administration/provider-invoices/${encodeURIComponent(r.id)}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {r.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.provider_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.payment_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{r.amount_eur.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No provider invoices match the filters.</p>
        )}
      </PageContentSection>
    </PageContentLayout>
  );
};

export default ProviderInvoicesPage;
