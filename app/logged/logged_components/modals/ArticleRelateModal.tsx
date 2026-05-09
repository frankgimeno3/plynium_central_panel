"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

type PortalRow = {
  id: number;
  key: string;
  name: string;
};

type CompanyRow = {
  companyId: string;
  commercialName: string;
  country?: string;
  region?: string;
};

export type ArticleRelateRow = {
  id_article: string;
  articleTitle: string;
  article_main_image_url?: string;
  company: string;
  article_company_names_array: string[];
  article_company_id_array: string[];
  date: string | null;
};

type DateParts = {
  day: string;
  month: string;
  year: string;
};

interface ArticleRelateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectArticle: (article: ArticleRelateRow) => void;
  currentArticleId?: string | null;
}

const emptyDateParts: DateParts = { day: "", month: "", year: "" };

function partsToIso(parts: DateParts, endOfDay = false): string | null {
  const day = Number(parts.day);
  const month = Number(parts.month);
  const year = Number(parts.year);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (year < 1000 || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return null;
  const dd = String(day).padStart(2, "0");
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-${dd}${endOfDay ? "T23:59:59.999Z" : "T00:00:00.000Z"}`;
}

function datePartsEmpty(parts: DateParts): boolean {
  return !parts.day.trim() && !parts.month.trim() && !parts.year.trim();
}

const ArticleRelateModal: FC<ArticleRelateModalProps> = ({
  open,
  onClose,
  onSelectArticle,
  currentArticleId = null,
}) => {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [selectedPortalId, setSelectedPortalId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyRow | null>(null);
  const [articles, setArticles] = useState<ArticleRelateRow[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleRelateRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [companyFilter, setCompanyFilter] = useState({ id: "", name: "" });
  const [articleFilter, setArticleFilter] = useState({
    id: "",
    title: "",
    from: emptyDateParts,
    to: emptyDateParts,
  });

  const selectedPortal = useMemo(
    () => portals.find((p) => Number(p.id) === Number(selectedPortalId)) ?? null,
    [portals, selectedPortalId]
  );

  const reset = useCallback(() => {
    setPhase(1);
    setSelectedPortalId(null);
    setCompanies([]);
    setSelectedCompany(null);
    setArticles([]);
    setSelectedArticle(null);
    setError(null);
    setCompanyFilter({ id: "", name: "" });
    setArticleFilter({ id: "", title: "", from: emptyDateParts, to: emptyDateParts });
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    let cancelled = false;
    async function loadPortals() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/v1/portals", { cache: "no-store", credentials: "include" });
        if (!res.ok) throw new Error("Failed to load portals");
        const data = (await res.json()) as PortalRow[];
        if (!cancelled) setPortals(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        if (!cancelled) setError((e as Error)?.message ?? "Failed to load portals");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadPortals();
    return () => {
      cancelled = true;
    };
  }, [open, reset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const loadCompaniesForPortal = useCallback(async () => {
    if (!selectedPortalId) return;
    setLoading(true);
    setError(null);
    setSelectedCompany(null);
    try {
      const res = await fetch(`/api/v1/portals/${selectedPortalId}/companies`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load companies for portal");
      const data = (await res.json()) as CompanyRow[];
      setCompanies(Array.isArray(data) ? data : []);
      setPhase(2);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Failed to load companies for portal");
    } finally {
      setLoading(false);
    }
  }, [selectedPortalId]);

  const loadArticlesForCompany = useCallback(
    async (company: CompanyRow) => {
      if (!selectedPortal?.name) return;
      setLoading(true);
      setError(null);
      setSelectedArticle(null);
      try {
        const qs = new URLSearchParams({ portalNames: selectedPortal.name });
        const res = await fetch(`/api/v1/articles?${qs.toString()}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load articles");
        const data = (await res.json()) as ArticleRelateRow[];
        const companyId = String(company.companyId).toLowerCase();
        const companyName = String(company.commercialName).toLowerCase();
        setArticles(
          (Array.isArray(data) ? data : []).filter((article) => {
            const ids = Array.isArray(article.article_company_id_array)
              ? article.article_company_id_array.map((id) => String(id).toLowerCase())
              : [];
            const names = Array.isArray(article.article_company_names_array)
              ? article.article_company_names_array.map((name) => String(name).toLowerCase())
              : [];
            return ids.includes(companyId) || names.includes(companyName);
          })
        );
        setSelectedCompany(company);
        setPhase(3);
      } catch (e: unknown) {
        setError((e as Error)?.message ?? "Failed to load articles");
      } finally {
        setLoading(false);
      }
    },
    [selectedPortal?.name]
  );

  const filteredCompanies = useMemo(() => {
    const id = companyFilter.id.trim().toLowerCase();
    const name = companyFilter.name.trim().toLowerCase();
    return companies.filter((company) => {
      if (id && !String(company.companyId).toLowerCase().includes(id)) return false;
      if (name && !String(company.commercialName).toLowerCase().includes(name)) return false;
      return true;
    });
  }, [companies, companyFilter]);

  const filteredArticles = useMemo(() => {
    const id = articleFilter.id.trim().toLowerCase();
    const title = articleFilter.title.trim().toLowerCase();
    const fromIso = datePartsEmpty(articleFilter.from) ? null : partsToIso(articleFilter.from);
    const toIso = datePartsEmpty(articleFilter.to) ? null : partsToIso(articleFilter.to, true);
    return articles.filter((article) => {
      if (id && !String(article.id_article).toLowerCase().includes(id)) return false;
      if (title && !String(article.articleTitle).toLowerCase().includes(title)) return false;
      const articleDate = article.date ? new Date(article.date).toISOString() : "";
      if (fromIso && (!articleDate || articleDate < fromIso)) return false;
      if (toIso && (!articleDate || articleDate > toIso)) return false;
      return true;
    });
  }, [articles, articleFilter]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-relate-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 id="article-relate-modal-title" className="text-xl font-bold text-gray-800">
              Relate to article
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Phase {phase} of 3
              {selectedPortal ? ` · ${selectedPortal.name}` : ""}
              {selectedCompany ? ` · ${selectedCompany.commercialName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {phase === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Portal
                </label>
                <select
                  value={selectedPortalId ?? ""}
                  onChange={(e) => setSelectedPortalId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                >
                  <option value="">Select a portal</option>
                  {portals.map((portal) => (
                    <option key={portal.id} value={portal.id}>
                      {portal.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!selectedPortalId || loading}
                onClick={() => void loadCompaniesForPortal()}
                className="px-4 py-2 rounded-lg bg-blue-950 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Continue"}
              </button>
            </div>
          ) : null}

          {phase === 2 ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={companyFilter.name}
                  onChange={(e) => setCompanyFilter((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Filter by company name"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={companyFilter.id}
                  onChange={(e) => setCompanyFilter((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Filter by company ID"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Country
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                          No companies found.
                        </td>
                      </tr>
                    ) : (
                      filteredCompanies.map((company) => (
                        <tr
                          key={company.companyId}
                          onClick={() => void loadArticlesForCompany(company)}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {company.commercialName || "—"}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-gray-600">
                            {company.companyId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {company.country || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <button type="button" onClick={() => setPhase(1)} className="text-sm text-gray-600 hover:text-gray-900">
                  Back
                </button>
                <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {phase === 3 ? (
            <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={articleFilter.id}
                  onChange={(e) => setArticleFilter((f) => ({ ...f, id: e.target.value }))}
                  placeholder="Filter by article ID"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={articleFilter.title}
                  onChange={(e) => setArticleFilter((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Filter by article title"
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-600 mb-2">Publication date</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["from", "to"] as const).map((side) => (
                    <div key={side} className="flex items-center gap-2">
                      <span className="w-10 text-xs uppercase text-gray-500">{side}</span>
                      {(["day", "month", "year"] as const).map((part) => (
                        <input
                          key={part}
                          type="text"
                          inputMode="numeric"
                          value={articleFilter[side][part]}
                          onChange={(e) =>
                            setArticleFilter((f) => ({
                              ...f,
                              [side]: { ...f[side], [part]: e.target.value.replace(/\D/g, "") },
                            }))
                          }
                          placeholder={part === "day" ? "dd" : part === "month" ? "mm" : "yyyy"}
                          maxLength={part === "year" ? 4 : 2}
                          className="w-16 px-2 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[240px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Article ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredArticles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                          No articles found for this company and portal.
                        </td>
                      </tr>
                    ) : (
                      filteredArticles.map((article) => {
                        const selected = selectedArticle?.id_article === article.id_article;
                        return (
                          <tr
                            key={article.id_article}
                            onClick={() => setSelectedArticle(article)}
                            className={`cursor-pointer ${selected ? "bg-blue-100" : "hover:bg-gray-50"}`}
                          >
                            <td className="px-3 py-2">
                              {article.article_main_image_url ? (
                                <img
                                  src={article.article_main_image_url}
                                  alt=""
                                  className="w-12 h-12 object-cover rounded border border-gray-200"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {article.articleTitle || "—"}
                            </td>
                            <td className="px-4 py-3 text-sm font-mono text-gray-600">
                              {article.id_article}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {article.date || "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <button type="button" onClick={() => setPhase(2)} className="text-sm text-gray-600 hover:text-gray-900">
                  Back
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedArticle}
                    onClick={() => selectedArticle && onSelectArticle(selectedArticle)}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentArticleId && selectedArticle?.id_article === currentArticleId
                      ? "Keep selected article"
                      : "Relate article"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ArticleRelateModal;
