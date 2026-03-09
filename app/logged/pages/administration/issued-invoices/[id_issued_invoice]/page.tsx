"use client";

import React, { FC, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageContentLayout from "@/app/logged/logged_components/PageContentLayout";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import issuedInvoicesData from "@/app/contents/issued_invoices.json";
import type { AdministrationContract, IssuedInvoice, Order } from "@/app/contents/interfaces";

type InvoiceDetail = {
  invoice_id: string;
  contract_code: string;
  id_contract?: string;
  client_name: string;
  client_id: string;
  amount_eur: number;
  issue_date: string;
  invoice_state?: string;
  orders: Order[];
};

function findInvoiceById(contracts: AdministrationContract[], invoiceId: string): InvoiceDetail | null {
  for (const c of contracts) {
    const inv = c.invoices.find((i) => i.invoice_id === invoiceId);
    if (inv) {
      return {
        invoice_id: inv.invoice_id,
        contract_code: c.contract_code,
        id_contract: c.id_contract,
        client_name: c.client_name,
        client_id: c.client_id,
        amount_eur: inv.amount_eur,
        issue_date: inv.issue_date,
        invoice_state: inv.invoice_state,
        orders: inv.orders,
      };
    }
  }
  return null;
}

const IssuedInvoiceDetailPage: FC = () => {
  const params = useParams();
  const id = typeof params?.id_issued_invoice === "string" ? decodeURIComponent(params.id_issued_invoice) : null;

  const invoice = useMemo(() => {
    if (!id) return null;
    return findInvoiceById(issuedInvoicesData as AdministrationContract[], id);
  }, [id]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Issued invoices", href: "/logged/pages/administration/issued-invoices" },
    { label: invoice?.invoice_id ?? id ?? "Detail" },
  ];

  if (!id) {
    return (
      <PageContentLayout
        pageTitle="Invalid issued invoice"
        breadcrumbs={[{ label: "Administration", href: "/logged/pages/administration" }, { label: "Issued invoices", href: "/logged/pages/administration/issued-invoices" }]}
        buttons={[{ label: "Back to Issued invoices", href: "/logged/pages/administration/issued-invoices" }]}
      >
        <PageContentSection>
          <p className="text-gray-500">Invalid issued invoice.</p>
        </PageContentSection>
      </PageContentLayout>
    );
  }

  if (!invoice) {
    return (
      <PageContentLayout
        pageTitle="Issued invoice not found"
        breadcrumbs={[{ label: "Administration", href: "/logged/pages/administration" }, { label: "Issued invoices", href: "/logged/pages/administration/issued-invoices" }, { label: id }]}
        buttons={[{ label: "Back to Issued invoices", href: "/logged/pages/administration/issued-invoices" }]}
      >
        <PageContentSection>
          <p className="text-gray-500">Issued invoice not found: {id}</p>
        </PageContentSection>
      </PageContentLayout>
    );
  }

  return (
    <PageContentLayout
      pageTitle={`Issued invoice — ${invoice.invoice_id}`}
      breadcrumbs={breadcrumbs}
      buttons={[{ label: "Back to Issued invoices", href: "/logged/pages/administration/issued-invoices" }]}
    >
      <PageContentSection>
        <div className="overflow-hidden max-w-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Invoice ID</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.invoice_id}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contract</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.contract_code}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.client_name}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issue date</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.issue_date}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice state</td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      invoice.invoice_state === "ok"
                        ? "bg-green-100 text-green-800"
                        : invoice.invoice_state === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {invoice.invoice_state ?? "—"}
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.amount_eur.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PageContentSection>

      <PageContentSection>
        <p className="text-sm font-medium text-gray-700 mb-2">Orders ({invoice.orders.length})</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {invoice.orders.map((o) => (
              <li key={o.order_code}>
                <Link
                  href={`/logged/pages/administration/${encodeURIComponent(o.order_code)}`}
                  className="text-blue-600 hover:underline"
                >
                  {o.order_code}
                </Link>
                {" — "}
                {o.collection_date} · {o.status} · €{o.amount_eur.toLocaleString()}
              </li>
            ))}
          </ul>
      </PageContentSection>
    </PageContentLayout>
  );
};

export default IssuedInvoiceDetailPage;
