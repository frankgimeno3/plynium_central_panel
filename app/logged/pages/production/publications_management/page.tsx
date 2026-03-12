"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import plannedPublicationsData from "@/app/contents/planned_publications.json";

type PlannedPublication = {
  id_planned_publication: string;
  edition_name: string;
  theme: string;
  publication_date: string;
};

const ITEMS_PER_PAGE = 12;

const PublicationsManagementPage: FC = () => {
  const router = useRouter();
  const all = (plannedPublicationsData as PlannedPublication[]).slice();
  const [filter, setFilter] = useState({ id: "", edition: "", theme: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((p) => p.id_planned_publication.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.edition) list = list.filter((p) => p.edition_name?.toLowerCase().includes(filter.edition.toLowerCase()));
    if (filter.theme) list = list.filter((p) => p.theme?.toLowerCase().includes(filter.theme.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Planned Publications" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Planned Publications", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
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
                  <label className="block text-xs text-gray-600 mb-1">Edition</label>
                  <input
                    type="text"
                    value={filter.edition}
                    onChange={(e) => { setFilter((f) => ({ ...f, edition: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by edition"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Theme</label>
                  <input
                    type="text"
                    value={filter.theme}
                    onChange={(e) => { setFilter((f) => ({ ...f, theme: e.target.value })); setPage(1); }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Search by theme"
                  />
                </div>
              </div>

              <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contents</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((p) => (
                <tr
                  key={p.id_planned_publication}
                  onClick={() => router.push(`/logged/pages/production/publications_management/${p.id_planned_publication}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id_planned_publication}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.edition_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.theme}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.publication_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">13 slots</td>
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

export default PublicationsManagementPage;
