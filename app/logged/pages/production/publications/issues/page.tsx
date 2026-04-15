"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

type PublicationDbRow = {
  publication_id: string;
  magazine_id: string | null;
  publication_year: number | null;
  publication_edition_name: string;
  magazine_general_issue_number: number | null;
  magazine_this_year_issue: number | null;
  publication_expected_publication_month: number | null;
  real_publication_month_date: string | null;
  publication_materials_deadline: string | null;
  is_special_edition: boolean;
  publication_theme: string;
  publication_status: "planned" | "draft" | "published" | string;
  publication_format: "flipbook" | "informer" | string;
  publication_main_image_url: string;
};

type TabId = "development" | "forecasted" | "published";

const BASE = "/logged/pages/production/publications";

function monthName(m: number | null): string {
  if (m == null || m < 1 || m > 12) return "—";
  return new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" });
}

const IssuesPage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("development");
  const [all, setAll] = useState<PublicationDbRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState({ id: "", edition: "", magazine: "" });

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/publications-db", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load issues");
      const data = (await res.json()) as PublicationDbRow[];
      setAll(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setAll([]);
      setError(e?.message ?? "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Issues",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues" },
      ],
    });
  }, [setPageMeta]);

  useEffect(() => {
    load();
  }, [load]);

  const inDevelopment = useMemo(
    () => all.filter((p) => p.publication_status === "draft"),
    [all]
  );
  const forecasted = useMemo(
    () => all.filter((p) => p.publication_status === "planned"),
    [all]
  );
  const published = useMemo(
    () => all.filter((p) => p.publication_status === "published"),
    [all]
  );

  const listForTab = useMemo(() => {
    if (activeTab === "development") return inDevelopment;
    if (activeTab === "forecasted") return forecasted;
    return published;
  }, [activeTab, inDevelopment, forecasted, published]);

  const filtered = useMemo(() => {
    let list = [...listForTab];
    if (filter.id) list = list.filter((p) => p.publication_id.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.edition)
      list = list.filter((p) => (p.publication_edition_name ?? "").toLowerCase().includes(filter.edition.toLowerCase()));
    if (filter.magazine)
      list = list.filter((p) => (p.magazine_id ?? "").toLowerCase().includes(filter.magazine.toLowerCase()));
    return list;
  }, [listForTab, filter]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setActiveTab("development")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "development"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            In development
            <span className="ml-2 text-xs text-gray-500">({inDevelopment.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("forecasted")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "forecasted"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Forecasted
            <span className="ml-2 text-xs text-gray-500">({forecasted.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("published")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "published"
                ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            Published
            <span className="ml-2 text-xs text-gray-500">({published.length})</span>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 my-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="bg-white rounded-b-lg overflow-hidden">
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                >
                  Retry
                </button>
              </div>
            )}

            <p className="text-sm font-semibold text-gray-700 mb-3">Filter</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Publication ID</label>
                <input
                  type="text"
                  value={filter.id}
                  onChange={(e) => setFilter((f) => ({ ...f, id: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by ID"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Edition name</label>
                <input
                  type="text"
                  value={filter.edition}
                  onChange={(e) => setFilter((f) => ({ ...f, edition: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by edition name"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Magazine ID</label>
                <input
                  type="text"
                  value={filter.magazine}
                  onChange={(e) => setFilter((f) => ({ ...f, magazine: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by magazine"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Loading issues…</div>
            ) : (
              <div className="overflow-x-auto mt-6">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edition name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Theme
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expected month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Magazine
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                          No issues found for this view.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr
                          key={p.publication_id}
                          onClick={() => router.push(`${BASE}/${encodeURIComponent(p.publication_id)}`)}
                          className={rowClass}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.publication_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{p.publication_edition_name || "—"}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{p.publication_theme || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {p.publication_year != null ? p.publication_year : "—"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {monthName(p.publication_expected_publication_month)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{p.magazine_id ?? "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.publication_format}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {p.publication_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default IssuesPage;  