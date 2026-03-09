"use client";

import React, { FC, useMemo, useState } from "react";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import issuedInvoicesData from "@/app/contents/issued_invoices.json";
import type { AdministrationContract, OrderRow } from "@/app/contents/interfaces";

function flattenOrders(contracts: AdministrationContract[]): OrderRow[] {
  const rows: OrderRow[] = [];
  for (const c of contracts) {
    for (const inv of c.invoices) {
      for (const order of inv.orders) {
        rows.push({
          order_code: order.order_code,
          contract_code: c.contract_code,
          id_contract: c.id_contract,
          invoice_id: inv.invoice_id,
          invoice_state: inv.invoice_state,
          collection_date: order.collection_date,
          payment_status: order.status,
          client_id: c.client_id,
          client_name: c.client_name,
          agent: order.agent ?? c.agent,
          id_contact: order.id_contact,
          amount_eur: order.amount_eur,
        });
      }
    }
  }
  return rows.sort((a, b) => (a.collection_date > b.collection_date ? -1 : 1));
}

const AdministrationPage: FC = () => {
  const allOrders = useMemo(
    () => flattenOrders(issuedInvoicesData as AdministrationContract[]),
    []
  );
  const [filter, setFilter] = useState({
    order: "",
    agent: "",
    client: "",
    status: "" as "" | "paid" | "pending",
  });

  const filtered = useMemo(() => {
    let list = [...allOrders];
    if (filter.order)
      list = list.filter((o) =>
        o.order_code.toLowerCase().includes(filter.order.toLowerCase())
      );
    if (filter.agent)
      list = list.filter((o) =>
        (o.agent ?? "").toLowerCase().includes(filter.agent.toLowerCase())
      );
    if (filter.client)
      list = list.filter((o) =>
        o.client_name.toLowerCase().includes(filter.client.toLowerCase())
      );
    if (filter.status)
      list = list.filter((o) => o.payment_status === filter.status);
    return list;
  }, [allOrders, filter]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Orders" },
  ];

  return (
    <PageContentLayout pageTitle="Administration — Orders" breadcrumbs={breadcrumbs}>
      <PageContentSection>
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Order</label>
              <input
                type="text"
                value={filter.order}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, order: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. C25.0000011-001"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Agent
              </label>
              <input
                type="text"
                value={filter.agent}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, agent: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agent name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Client</label>
              <input
                type="text"
                value={filter.client}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, client: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) =>
                  setFilter((f) => ({
                    ...f,
                    status: e.target.value as "" | "paid" | "pending",
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
      </PageContentSection>

      <PageContentSection>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice state
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount (€)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((row) => (
                <tr key={row.order_code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/logged/pages/administration/${encodeURIComponent(row.order_code)}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {row.order_code}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.agent ?? "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {row.invoice_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.invoice_state === "ok"
                          ? "bg-green-100 text-green-800"
                          : row.invoice_state === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {row.invoice_state ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.collection_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.payment_status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {row.amount_eur.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No orders match the filters.
          </p>
        )}
      </PageContentSection>
    </PageContentLayout>
  );
};

export default AdministrationPage;
