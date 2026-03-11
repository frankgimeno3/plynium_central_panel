"use client";

import React, { FC, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import providerInvoicesData from "@/app/contents/provider_invoices.json";
import type { ProviderInvoice } from "@/app/contents/interfaces";

const ProviderInvoiceDetailPage: FC = () => {
  const params = useParams();
  const id = typeof params?.id_provider_invoice === "string" ? decodeURIComponent(params.id_provider_invoice) : null;

  const invoice = useMemo(() => {
    if (!id) return null;
    return (providerInvoicesData as ProviderInvoice[]).find((r) => r.id === id) ?? null;
  }, [id]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (invoice) {
      setPageMeta({
        pageTitle: `Provider invoice — ${invoice.id}`,
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Provider invoices", href: "/logged/pages/administration/provider-invoices" },
          { label: invoice.id },
        ],
        buttons: [{ label: "Back to Provider invoices", href: "/logged/pages/administration/provider-invoices" }],
      });
    } else if (id) {
      setPageMeta({
        pageTitle: "Provider invoice not found",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Provider invoices", href: "/logged/pages/administration/provider-invoices" },
          { label: id },
        ],
        buttons: [{ label: "Back to Provider invoices", href: "/logged/pages/administration/provider-invoices" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Invalid provider invoice",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Provider invoices", href: "/logged/pages/administration/provider-invoices" },
        ],
        buttons: [{ label: "Back to Provider invoices", href: "/logged/pages/administration/provider-invoices" }],
      });
    }
  }, [setPageMeta, invoice, id]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Provider invoices", href: "/logged/pages/administration/provider-invoices" },
    { label: invoice?.id ?? id ?? "Detail" },
  ];

  if (!id) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Invalid provider invoice.</p>
        </PageContentSection>
      </>
    );
  }

  if (!invoice) {
    return (
      <>
        <PageContentSection>
          <p className="text-gray-500">Provider invoice not found: {id}</p>
        </PageContentSection>
      </>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="overflow-hidden max-w-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">ID</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.id}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.provider_name}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Provider ID</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.id_provider}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment date</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.payment_date}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</td>
                <td className="px-6 py-3 text-sm text-gray-900">{invoice.amount_eur.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </PageContentSection>
    </>
  );
};

export default ProviderInvoiceDetailPage;
