"use client";

import React, { FC, useEffect, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ProviderService } from "@/app/service/ProviderService.js";
import { formatAdminDate } from "../adminDates";

type Provider = {
  id_provider: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
};

type ProviderInvoice = {
  id: string;
  id_provider: string;
  provider_name: string;
  amount_eur: number;
  payment_date: string;
};

const ProviderDetailPage: FC = () => {
  const params = useParams();
  const idProvider =
    typeof params?.id_provider === "string"
      ? decodeURIComponent(params.id_provider)
      : null;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [invoices, setInvoices] = useState<ProviderInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!idProvider) return;
    setLoading(true);
    try {
      const data = await ProviderService.getProviderById(idProvider);
      // API devuelve { provider, invoices }
      setProvider(data?.provider ?? null);
      setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
    } catch {
      setProvider(null);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [idProvider]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (provider) {
      setPageMeta({
        pageTitle: `Provider — ${provider.name}`,
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Providers", href: "/logged/pages/administration/providers" },
          { label: provider.name },
        ],
        buttons: [{ label: "Back to Providers", href: "/logged/pages/administration/providers" }],
      });
    } else if (idProvider) {
      setPageMeta({
        pageTitle: "Provider not found",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Providers", href: "/logged/pages/administration/providers" },
          { label: idProvider },
        ],
        buttons: [{ label: "Back to Providers", href: "/logged/pages/administration/providers" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Invalid provider",
        breadcrumbs: [
          { label: "Administration", href: "/logged/pages/administration" },
          { label: "Providers", href: "/logged/pages/administration/providers" },
        ],
        buttons: [{ label: "Back to Providers", href: "/logged/pages/administration/providers" }],
      });
    }
  }, [setPageMeta, provider, idProvider]);

  if (!idProvider) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">Invalid provider.</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!provider) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-gray-500">Provider not found: {idProvider}</p>
          </div>
        </div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        {loading && (
          <p className="text-gray-500 mb-4">Loading provider…</p>
        )}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider details</h2>
        <div className="overflow-hidden max-w-2xl">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Provider ID</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.id_provider}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.name}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact email</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.contact_email ?? "—"}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact phone</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.contact_phone ?? "—"}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Address</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.address ?? "—"}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ID</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.tax_id ?? "—"}</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</td>
                <td className="px-6 py-3 text-sm text-gray-900">{provider.notes ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider invoices ({invoices.length})</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500">No invoices for this provider.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (€)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        href={`/logged/pages/administration/provider-invoices/${encodeURIComponent(inv.id)}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {inv.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAdminDate(inv.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{inv.amount_eur.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ProviderDetailPage;
