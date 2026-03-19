"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";

type ServiceType = "newsletter" | "portal" | "magazine" | "other";

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

type Service = {
  id_service: string;
  name: string;
  service_type?: string;
  tariff_price_eur: number;
  publication_date?: string;
};

const ITEMS_PER_PAGE = 12;

const ServicesPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Service[]>([]);
  useEffect(() => {
    ServiceService.getAllServices().then((list) => setAll(Array.isArray(list) ? list : [])).catch(() => setAll([]));
  }, []);
  const [filter, setFilter] = useState({ id: "", name: "", hasPublicationDate: "" });
  const [activeServiceType, setActiveServiceType] = useState<string>("");

  const serviceTypeLabel = (serviceType?: string) => {
    if (!serviceType) return "—";
    return SERVICE_TYPES.find((t) => t.value === (serviceType as ServiceType))?.label ?? serviceType;
  };

  const serviceTypeTabs = useMemo(() => {
    const existingValues = Array.from(new Set(all.map((s) => (s.service_type ?? "").toString()).filter(Boolean)));
    const baseTabs = SERVICE_TYPES.map((t) => ({ value: t.value, label: t.label }));
    const extraValues = existingValues
      .filter((v) => !SERVICE_TYPES.some((t) => t.value === v))
      .sort((a, b) => a.localeCompare(b));
    const extraTabs = extraValues.map((v) => ({ value: v, label: v }));

    return [{ value: "", label: "All" }, ...baseTabs, ...extraTabs];
  }, [all]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (activeServiceType) list = list.filter((s) => (s.service_type ?? "") === activeServiceType);
    if (filter.id) list = list.filter((s) => s.id_service.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((s) => s.name?.toLowerCase().includes(filter.name.toLowerCase()));
    if (filter.hasPublicationDate === "yes") list = list.filter((s) => "publication_date" in s && s.publication_date);
    if (filter.hasPublicationDate === "no") list = list.filter((s) => !("publication_date" in s) || !s.publication_date);
    return list;
  }, [all, filter, activeServiceType]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Services" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Services",
      breadcrumbs,
      buttons: [{ label: "Create Service", href: "/logged/pages/production/services/create" }],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <div className="flex flex-wrap gap-2 mb-6">
                {serviceTypeTabs.map((t) => {
                  const isActive = activeServiceType === t.value;
                  return (
                    <button
                      key={t.value || "all"}
                      type="button"
                      onClick={() => {
                        setActiveServiceType(t.value);
                        setPage(1);
                      }}
                      className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        isActive
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <label className="block text-xs text-gray-600 mb-1">Name</label>
                  <input
                    type="text"
                    value={filter.name}
                    onChange={(e) => { setFilter((f) => ({ ...f, name: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Publication date</label>
                  <select
                    value={filter.hasPublicationDate}
                    onChange={(e) => { setFilter((f) => ({ ...f, hasPublicationDate: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All</option>
                    <option value="yes">With publication date</option>
                    <option value="no">Without publication date</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tariff (€)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginated.map((s) => (
                      <tr
                        key={s.id_service}
                        onClick={() => router.push(`/logged/pages/production/services/${s.id_service}`)}
                        className={rowClass}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.id_service}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{s.name?.replace(/_/g, " ")}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{serviceTypeLabel(s.service_type)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.tariff_price_eur?.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.publication_date ?? "—"}</td>
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
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ServicesPage;
