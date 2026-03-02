"use client";

import React, { FC, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import projectsData from "@/app/contents/projects.json";
import contractsData from "@/app/contents/contracts.json";
import customersData from "@/app/contents/customers.json";

type Project = {
  id_project: string;
  id_contract: string;
  title: string;
  status: string;
  project_type: string;
  publication_date: string;
  publication_id?: string;
  pm_events_array?: string[];
};

type Contract = { id_contract: string; id_customer: string };
type Customer = { id_customer: string; name: string };

const ITEMS_PER_PAGE = 12;

const ProjectsPage: FC = () => {
  const router = useRouter();
  const all = (projectsData as Project[]).slice();
  const contracts = contractsData as Contract[];
  const customers = customersData as Customer[];
  const getCompanyName = (idContract: string) => {
    const c = contracts.find((x) => x.id_contract === idContract);
    return c ? (customers.find((cust) => cust.id_customer === c.id_customer)?.name ?? c.id_customer) : idContract;
  };
  const [filter, setFilter] = useState({ id: "", company: "", status: "", project_type: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((p) => p.id_project.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.company) list = list.filter((p) => getCompanyName(p.id_contract).toLowerCase().includes(filter.company.toLowerCase()));
    if (filter.status) list = list.filter((p) => p.status.toLowerCase().includes(filter.status.toLowerCase()));
    if (filter.project_type) list = list.filter((p) => p.project_type?.toLowerCase().includes(filter.project_type.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <div className="flex flex-col w-full bg-white">
      <div className="text-center bg-blue-950/70 p-5 text-white">
        <p className="text-2xl">Projects</p>
      </div>

      <div className="flex flex-col w-full gap-4 p-12">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                value={filter.status}
                onChange={(e) => { setFilter((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="calendarized">calendarized</option>
                <option value="pending_materials">pending_materials</option>
                <option value="ok_production">ok_production</option>
                <option value="published">published</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Project type</label>
              <select
                value={filter.project_type}
                onChange={(e) => { setFilter((f) => ({ ...f, project_type: e.target.value })); setPage(1); }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All</option>
                <option value="newsletter">newsletter</option>
                <option value="portal_article">portal_article</option>
                <option value="portal_premium_profile">portal_premium_profile</option>
                <option value="magazine_advertisement">magazine_advertisement</option>
                <option value="portal_banner">portal_banner</option>
                <option value="magazine_article">magazine_article</option>
              </select>
            </div>
          </div>
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
                <tr key={p.id_project} onClick={() => router.push(`/logged/pages/pm/projects/${p.id_project}`)} className={rowClass}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id_project}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{getCompanyName(p.id_contract)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.project_type?.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      p.status === "published" ? "bg-green-100 text-green-800" :
                      p.status === "ok_production" ? "bg-blue-100 text-blue-800" :
                      p.status === "pending_materials" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800"
                    }`}>{p.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.publication_date}</td>
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
  );
};

export default ProjectsPage;
