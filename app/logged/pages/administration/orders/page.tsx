"use client";

import React, { FC, useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { BillingService } from "@/app/service/BillingService";
import { formatAdminDate } from "../adminDates";

type OrderRow = {
  order_code: string;
  contract_code: string;
  id_contract?: string;
  invoice_id: string;
  invoice_state?: string;
  collection_date: string;
  payment_status: string;
  client_id: string;
  client_name: string;
  agent?: string;
  id_contact?: string;
  amount_eur: number;
};

const AdministrationOrdersPage: FC = () => {
  const [allOrders, setAllOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await BillingService.getAllOrders();
      setAllOrders(Array.isArray(list) ? list : []);
    } catch {
      setAllOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);
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
    { label: "Administration", href: "/logged/pages/administration/orders" },
    { label: "Orders" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Administration — Orders", breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
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

        <div className="overflow-x-auto mt-6">
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">
                    Loading orders…
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.order_code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        href={`/logged/pages/administration/orders/${encodeURIComponent(row.order_code)}`}
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
                      {formatAdminDate(row.collection_date)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            No orders match the filters.
          </p>
        )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default AdministrationOrdersPage;
