"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import issuedInvoicesData from "@/app/contents/issued_invoices.json";
import providerInvoicesData from "@/app/contents/provider_invoices.json";
import type { AdministrationContract, ProviderInvoice } from "@/app/contents/interfaces";

type ForecastItem = {
  id: string;
  type: "revenue" | "payment";
  label: string;
  date: string;
  amount_eur: number;
  reference: string;
};

function getForecastedRevenues(contracts: AdministrationContract[]): ForecastItem[] {
  const items: ForecastItem[] = [];
  for (const c of contracts) {
    for (const inv of c.invoices) {
      for (const order of inv.orders) {
        if (order.status === "pending") {
          items.push({
            id: `rev-${order.order_code}`,
            type: "revenue",
            label: `Order ${order.order_code} (${c.client_name})`,
            date: order.collection_date,
            amount_eur: order.amount_eur,
            reference: order.order_code,
          });
        }
      }
    }
  }
  return items.sort((a, b) => (a.date > b.date ? 1 : -1));
}

function getForecastedPayments(invoices: ProviderInvoice[]): ForecastItem[] {
  return invoices.map((inv): ForecastItem => ({
    id: `pay-${inv.id}`,
    type: "payment",
    label: `${inv.provider_name} — ${inv.id}`,
    date: inv.payment_date,
    amount_eur: inv.amount_eur,
    reference: inv.id,
  })).sort((a, b) => (a.date > b.date ? 1 : -1));
}

const BanksPage: FC = () => {
  const revenues = useMemo(
    () => getForecastedRevenues(issuedInvoicesData as AdministrationContract[]),
    []
  );
  const payments = useMemo(
    () => getForecastedPayments(providerInvoicesData as ProviderInvoice[]),
    []
  );
  const [activeTab, setActiveTab] = useState<"revenues" | "payments" | "all">("all");

  const combined = useMemo(() => {
    const all: ForecastItem[] = [...revenues, ...payments];
    return all.sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [revenues, payments]);

  const displayList = activeTab === "revenues" ? revenues : activeTab === "payments" ? payments : combined;

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Banks — Cash flow forecast" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Banks — Cash flow forecast", breadcrumbs });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <p className="text-gray-600 mb-2">
          Forecast of collections (issued invoices, orders pending) and payments (provider invoices). Based on current issued and provider invoice data.
        </p>
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`
              relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === "all" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
            `}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("revenues")}
            className={`
              relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === "revenues" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
            `}
          >
            Forecasted revenues
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`
              relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
              ${activeTab === "payments" ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}
            `}
          >
            Forecasted payments
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label / Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayList.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        row.type === "revenue" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {row.type === "revenue" ? "Revenue" : "Payment"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{row.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {row.type === "payment" ? "-" : ""}{row.amount_eur.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayList.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No forecast items in this view.</p>
        )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default BanksPage;
