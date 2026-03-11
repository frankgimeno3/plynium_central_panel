"use client";

import React, { FC, useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import issuedInvoicesData from "@/app/contents/issued_invoices.json";
import type { AdministrationContract, IssuedInvoice, Order } from "@/app/contents/interfaces";

type InvoiceRow = {
  contract_code: string;
  client_name: string;
  invoice_id: string;
  amount_eur: number;
  issue_date: string;
  orders_summary: string;
  paid_count: number;
  pending_count: number;
};

function toInvoiceRows(contracts: AdministrationContract[]): InvoiceRow[] {
  const rows: InvoiceRow[] = [];
  for (const c of contracts) {
    for (const inv of c.invoices) {
      const paid = inv.orders.filter((o: Order) => o.status === "paid").length;
      const pending = inv.orders.filter((o: Order) => o.status === "pending").length;
      rows.push({
        contract_code: c.contract_code,
        client_name: c.client_name,
        invoice_id: inv.invoice_id,
        amount_eur: inv.amount_eur,
        issue_date: inv.issue_date,
        orders_summary: `${inv.orders.length} order(s)`,
        paid_count: paid,
        pending_count: pending,
      });
    }
  }
  return rows;
}

const IssuedInvoicesPage: FC = () => {
  const all = useMemo(
    () => toInvoiceRows(issuedInvoicesData as AdministrationContract[]),
    []
  );
  const [filter, setFilter] = useState({
    contract: "",
    client: "",
    invoice: "",
  });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.contract)
      list = list.filter((r) =>
        r.contract_code.toLowerCase().includes(filter.contract.toLowerCase())
      );
    if (filter.client)
      list = list.filter((r) =>
        r.client_name.toLowerCase().includes(filter.client.toLowerCase())
      );
    if (filter.invoice)
      list = list.filter((r) =>
        r.invoice_id.toLowerCase().includes(filter.invoice.toLowerCase())
      );
    return list;
  }, [all, filter]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Issued invoices" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Issued invoices", breadcrumbs });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Contract</label>
              <input
                type="text"
                value={filter.contract}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, contract: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contract code"
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
              <label className="block text-xs text-gray-600 mb-1">Invoice ID</label>
              <input
                type="text"
                value={filter.invoice}
                onChange={(e) =>
                  setFilter((f) => ({ ...f, invoice: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Invoice ID"
              />
            </div>
          </div>
      </PageContentSection>

      <PageContentSection>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Paid / Pending</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((r) => (
                <tr key={r.invoice_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{r.contract_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.client_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <Link
                      href={`/logged/pages/administration/issued-invoices/${encodeURIComponent(r.invoice_id)}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {r.invoice_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.issue_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{r.amount_eur.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="text-green-600">{r.paid_count} paid</span>
                    {r.pending_count > 0 && (
                      <span className="text-amber-600 ml-2">{r.pending_count} pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">No issued invoices match the filters.</p>
        )}
      </PageContentSection>
    </>
  );
};

export default IssuedInvoicesPage;
