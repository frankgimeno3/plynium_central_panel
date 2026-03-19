"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { fetchFlatplans, getFlatplans } from "@/app/contents/publicationsHelpers";
import type { PublicationUnified, Magazine, MagazineIssue } from "@/app/contents/interfaces";
import { MagazineService } from "@/app/service/MagazineService";
import { encodeForecastedIssueId } from "@/app/logged/pages/production/publications/flatplans/forecastedIssueRoute";

const ITEMS_PER_PAGE = 12;
const BASE = "/logged/pages/production/publications/flatplans";

type TabId = "development" | "forecast";

/** One row for the forecasted issues table: an issue that has no flatplan yet. */
type ForecastedIssueRow = {
  year: number;
  id_magazine: string;
  magazineName: string;
  issue_number: number;
  is_special_edition: boolean;
  special_topic?: string;
  /** Forecasted publication month (1-12). Used for display and sort order. */
  forecasted_publication_month?: number;
};

const FlatplansPage: FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("development");
  const [publicationsData, setPublicationsData] = useState<PublicationUnified[]>([]);
  const [magazines, setMagazines] = useState<Magazine[]>([]);

  useEffect(() => {
    fetchFlatplans()
      .then(setPublicationsData)
      .catch(() => setPublicationsData([]));
  }, []);

  useEffect(() => {
    MagazineService.getAllMagazines()
      .then((data) => setMagazines(Array.isArray(data) ? data : []))
      .catch(() => setMagazines([]));
  }, []);

  const all = useMemo(() => getFlatplans(publicationsData), [publicationsData]);
  const [filter, setFilter] = useState({ id: "", edition: "", theme: "" });

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((f) => f.id_flatplan.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.edition) list = list.filter((f) => f.edition_name?.toLowerCase().includes(filter.edition.toLowerCase()));
    if (filter.theme) list = list.filter((f) => f.theme?.toLowerCase().includes(filter.theme.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const nextYear = currentYear + 1;
  const flatplanKeys = useMemo(() => {
    const set = new Set<string>();
    all.forEach((f) => {
      if (f.id_magazine != null && f.year != null && f.issue_number != null) {
        set.add(`${f.id_magazine}|${f.year}|${f.issue_number}`);
      }
    });
    return set;
  }, [all]);

  const forecastedIssues = useMemo((): ForecastedIssueRow[] => {
    const rows: ForecastedIssueRow[] = [];
    const years = [currentYear, nextYear];
    magazines.forEach((mag) => {
      years.forEach((year) => {
        const issues = mag.issues_by_year?.[String(year)] ?? [];
        issues.forEach((issue: MagazineIssue) => {
          const key = `${mag.id_magazine}|${year}|${issue.issue_number}`;
          if (!flatplanKeys.has(key)) {
            rows.push({
              year,
              id_magazine: mag.id_magazine,
              magazineName: mag.name ?? mag.id_magazine,
              issue_number: issue.issue_number,
              is_special_edition: issue.is_special_edition ?? false,
              special_topic: issue.special_topic,
              forecasted_publication_month: issue.forecasted_publication_month,
            });
          }
        });
      });
    });
    rows.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthA = a.forecasted_publication_month ?? 99;
      const monthB = b.forecasted_publication_month ?? 99;
      if (monthA !== monthB) return monthA - monthB;
      const nameA = a.magazineName.toLowerCase();
      const nameB = b.magazineName.toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return a.issue_number - b.issue_number;
    });
    return rows;
  }, [magazines, currentYear, flatplanKeys]);

  const rowClass = "cursor-pointer hover:bg-blue-50/80 transition-colors";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Publications", href: "/logged/pages/production/publications/magazines" },
    { label: "Flatplans" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Flatplans",
      breadcrumbs,
      buttons: [{ label: "Create Flatplan", href: `${BASE}/create` }],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
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
              Flatplans in development
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("forecast")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "forecast"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Forecasted issues {currentYear}–{nextYear}
            </button>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "development" && (
                <>
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
                  <label className="block text-xs text-gray-600 mb-1">Edition name</label>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edition name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magazine</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((f) => (
                <tr
                  key={f.id_flatplan}
                  onClick={() => router.push(`${BASE}/${f.id_flatplan}`)}
                  className={rowClass}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.id_flatplan}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{f.edition_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.theme}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{f.publication_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.id_magazine ?? "—"}</td>
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
                </>
              )}

              {activeTab === "forecast" && (
                <>
                  <p className="text-sm text-gray-600 mb-3">
                    Issues planned for {currentYear} and {nextYear} that do not yet have a flatplan.
                  </p>
                  <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forecasted month</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Magazine</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special edition</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special topic</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {forecastedIssues.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                              No forecasted issues without a flatplan for {currentYear}–{nextYear}.
                            </td>
                          </tr>
                        ) : (
                          forecastedIssues.map((row) => (
                            <tr
                              key={`${row.id_magazine}|${row.year}|${row.issue_number}`}
                              onClick={() =>
                                router.push(`${BASE}/forecasted/${encodeForecastedIssueId(row.id_magazine, row.year, row.issue_number)}`)
                              }
                              className={rowClass}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.year}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.forecasted_publication_month != null && row.forecasted_publication_month >= 1 && row.forecasted_publication_month <= 12
                                  ? new Date(2000, row.forecasted_publication_month - 1, 1).toLocaleString("default", { month: "long" })
                                  : "—"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{row.magazineName}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{row.issue_number}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{row.is_special_edition ? "Yes" : "—"}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{row.special_topic ?? "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default FlatplansPage;
