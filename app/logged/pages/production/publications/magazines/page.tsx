"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { Magazine } from "@/app/contents/interfaces";

const ITEMS_PER_PAGE = 12;
const BASE = "/logged/pages/production/publications/magazines";

const MagazinesPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ id: "", name: "" });

  const loadMagazines = React.useCallback(() => {
    setFetchError(null);
    setLoading(true);
    MagazineService.getAllMagazines()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data && Array.isArray((data as { data?: unknown }).data) ? (data as { data: Magazine[] }).data : []);
        setAll(list);
      })
      .catch((err) => {
        const message = err?.message ?? (typeof err === "string" ? err : "Failed to load magazines");
        setFetchError(message);
        setAll([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMagazines();
  }, [loadMagazines]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((m) => m.id_magazine.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((m) => m.name?.toLowerCase().includes(filter.name.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Publications", href: "/logged/pages/production/publications/magazines" },
    { label: "Magazine titles" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Magazine titles",
      breadcrumbs,
      buttons: [{ label: "Create magazine", href: "/logged/pages/production/publications/magazines/create" }],
    });
  }, [setPageMeta, breadcrumbs]);

  if (loading && all.length === 0 && !fetchError) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading magazines…</div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          {fetchError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
              <p className="text-sm text-red-800">{fetchError}</p>
              <button
                type="button"
                onClick={loadMagazines}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="overflow-x-auto mt-6">
          <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Starting year</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((m) => (
                <tr
                  key={m.id_magazine}
                  onClick={() => router.push(`${BASE}/${m.id_magazine}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{m.id_magazine}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{m.description ?? "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {m.first_year != null ? String(m.first_year) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(filtered.length > ITEMS_PER_PAGE || totalPages > 1) && (
          <div className="flex items-center justify-between mt-4">
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

export default MagazinesPage;
