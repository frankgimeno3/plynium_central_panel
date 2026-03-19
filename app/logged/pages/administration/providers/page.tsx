"use client";

import React, { FC, useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ProviderService } from "@/app/service/ProviderService.js";

type Provider = {
  id_provider: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
};

const PROVIDERS_BASE = "/logged/pages/administration/providers";

const ProvidersPage: FC = () => {
  const [all, setAll] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ name: "", id: "" });

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const list = await ProviderService.getAllProviders();
      setAll(Array.isArray(list) ? list : []);
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id)
      list = list.filter((p) =>
        p.id_provider.toLowerCase().includes(filter.id.toLowerCase())
      );
    if (filter.name)
      list = list.filter((p) =>
        p.name.toLowerCase().includes(filter.name.toLowerCase())
      );
    return list;
  }, [all, filter]);

  const breadcrumbs = [
    { label: "Administration", href: "/logged/pages/administration" },
    { label: "Providers" },
  ];

  const buttons = [
    { label: "Create provider", href: "/logged/pages/administration/providers/create" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Providers", breadcrumbs, buttons });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full ">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">ID</label>
                <input
                  type="text"
                  value={filter.id}
                  onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provider ID"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={filter.name}
                  onChange={(e) => setFilter((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provider name"
                />
              </div>
            </div>

            <div className="overflow-x-auto mt-6">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        Loading providers…
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No providers match the filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id_provider} className="hover:bg-gray-100 transition-colors">
                        <td colSpan={4} className="p-0">
                          <Link
                            href={`${PROVIDERS_BASE}/${encodeURIComponent(p.id_provider)}`}
                            className="grid grid-cols-4 gap-4 px-6 py-4 text-sm text-gray-300 cursor-pointer items-center"
                            aria-label={`View provider ${p.name}`}
                          >
                            <span className="whitespace-nowrap font-medium ">{p.id_provider}</span>
                            <span className="whitespace-nowrap ">{p.name}</span>
                            <span className="whitespace-nowrap ">{p.contact_email ?? "—"}</span>
                            <span className="whitespace-nowrap ">{p.contact_phone ?? "—"}</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filtered.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No providers match the filters.</p>
            )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ProvidersPage;
