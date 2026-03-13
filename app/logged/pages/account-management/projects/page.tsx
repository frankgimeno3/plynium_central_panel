"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import projectsData from "@/app/contents/projects.json";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";
import servicesData from "@/app/contents/services.json";

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  service: string;
  publication_date: string;
  publication_id?: string;
  pm_events_array?: string[];
};

type Service = { id_service: string; name: string };
type Contract = { id_contract: string; id_customer: string };
type Customer = { id_customer: string; name: string };

const ITEMS_PER_PAGE = 12;

const TAB_CALENDARIZED = "calendarized";
const TAB_PENDING = "pending";
const TAB_FINISHED = "finished";

const STATUS_BY_TAB: Record<string, string[]> = {
  [TAB_CALENDARIZED]: ["calendarized"],
  [TAB_PENDING]: ["pending_materials", "ok_production"],
  [TAB_FINISHED]: ["published", "expired", "cancelled"],
};

const ProjectsPage: FC = () => {
  const router = useRouter();
  const all = (projectsData as Project[]).slice();
  const contracts = contractsData as Contract[];
  const customers = customersData as Customer[];
  const services = servicesData as Service[];
  const getCompanyName = (idContract: string) => {
    const c = contracts.find((x) => x.id_contract === idContract);
    return c ? (customers.find((cust) => cust.id_customer === c.id_customer)?.name ?? c.id_customer) : idContract;
  };
  const getServiceName = (idService: string) =>
    services.find((s) => s.id_service === idService)?.name?.replace(/_/g, " ") ?? idService;

  const [activeTab, setActiveTab] = useState<typeof TAB_CALENDARIZED | typeof TAB_PENDING | typeof TAB_FINISHED>(TAB_PENDING);
  const [filter, setFilter] = useState({ id: "", company: "", service: "" });

  const filtered = useMemo(() => {
    const allowedStatuses = STATUS_BY_TAB[activeTab] ?? [];
    let list = all.filter((p) => allowedStatuses.includes(p.status));
    if (filter.id) list = list.filter((p) => p.id_project.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.company) list = list.filter((p) => getCompanyName(p.id_contract).toLowerCase().includes(filter.company.toLowerCase()));
    if (filter.service) list = list.filter((p) => p.service === filter.service);
    return list;
  }, [all, activeTab, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Account Management", href: "/logged/pages/account-management" },
    { label: "Projects" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Projects", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full mt-12">
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
                <label className="block text-xs text-gray-600 mb-1">Company</label>
                <input
                  type="text"
                  value={filter.company}
                  onChange={(e) => { setFilter((f) => ({ ...f, company: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by company"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Service</label>
                <select
                  value={filter.service}
                  onChange={(e) => { setFilter((f) => ({ ...f, service: e.target.value })); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  {services.map((s) => (
                    <option key={s.id_service} value={s.id_service}>{s.name?.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
            </div>
                </PageContentSection>
                <PageContentSection>
            {/* Tabs: Calendarized | Pending (default) | Finished */}
            <div className="flex flex-col w-full">
            <div className="flex border-b border-gray-200 mt-6 mb-4">
              {([
                { id: TAB_CALENDARIZED, label: "Calendarized", count: all.filter((p) => STATUS_BY_TAB[TAB_CALENDARIZED].includes(p.status)).length },
                { id: TAB_PENDING, label: "Pending", count: all.filter((p) => STATUS_BY_TAB[TAB_PENDING].includes(p.status)).length },
                { id: TAB_FINISHED, label: "Finished", count: all.filter((p) => STATUS_BY_TAB[TAB_FINISHED].includes(p.status)).length },
              ] as const).map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveTab(id); setPage(1); }}
                  className={`
                relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === id
                      ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
              `}
                >
                  {label}
                  <span className="text-xs opacity-80">({count})</span>
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginated.map((p) => (
                    <tr key={p.id_project} onClick={() => router.push(`/logged/pages/account-management/projects/${p.id_project}`)} className={rowClass}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id_project}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{getCompanyName(p.id_contract)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getServiceName(p.service)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${p.status === "published" ? "bg-green-100 text-green-800" :
                            p.status === "ok_production" ? "bg-blue-100 text-blue-800" :
                              p.status === "pending_materials" ? "bg-amber-100 text-amber-800" :
                                p.status === "expired" ? "bg-red-100 text-red-800" :
                                  p.status === "cancelled" ? "bg-gray-200 text-gray-700" :
                                    "bg-gray-100 text-gray-800"
                          }`}>{p.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.publication_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(filtered.length > ITEMS_PER_PAGE || totalPages > 1) && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
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
      </PageContentSection>
    </>
  );
};

export default ProjectsPage;
