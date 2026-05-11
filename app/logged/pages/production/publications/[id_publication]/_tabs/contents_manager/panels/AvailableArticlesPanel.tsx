"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type AvailableArticlesPanelProps = {
  publicationId: string;
};

type SelectedArticleRow = {
  publication_article_id: string;
  publication_id: string;
  article_id: string;
  publication_slots_id_array: number[];
  desired_page_count: number;
  chunks_count: number;
  publication_article_created_at: string | null;
  publication_article_updated_at: string | null;
  article: {
    article_title: string;
    article_subtitle: string | null;
    article_main_image_url: string | null;
    article_date: string | null;
  } | null;
};

type PortalRow = { portal_id: number; portal_name: string };

type AvailablePortalArticleRow = {
  id_article: string;
  article_title: string;
  article_subtitle: string | null;
  article_main_image_url: string | null;
  article_date: string | null;
  article_published_at: string | null;
  portal_id: number | null;
  portal_name: string | null;
  article_status: string | null;
};

type AvailablePortalArticlesResponse = {
  items: AvailablePortalArticleRow[];
  portals: PortalRow[];
  cutoff_date: string | null;
};

const PORTAL_FILTER_DEBOUNCE_MS = 300;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

/**
 * Top section: every `publication_articles` row already selected for this
 * publication. Bottom section: portal articles that are eligible for selection
 * (filtered by portal of the magazine and date window). The bottom section
 * pushes selections into the top one through POST publication-articles.
 */
export function AvailableArticlesPanel({ publicationId }: AvailableArticlesPanelProps) {
  const [selectedArticles, setSelectedArticles] = useState<SelectedArticleRow[]>([]);
  const [selectedLoading, setSelectedLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<string | null>(null);

  const [available, setAvailable] = useState<AvailablePortalArticlesResponse>({
    items: [],
    portals: [],
    cutoff_date: null,
  });
  const [availableLoading, setAvailableLoading] = useState(true);
  const [availableError, setAvailableError] = useState<string | null>(null);

  const [filterQuery, setFilterQuery] = useState("");
  const [filterPortalId, setFilterPortalId] = useState<number | "">("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyArticleId, setBusyArticleId] = useState<string | null>(null);

  const loadSelected = useCallback(async () => {
    setSelectedLoading(true);
    setSelectedError(null);
    try {
      const res = await fetch(
        `/api/v1/publications/${encodeURIComponent(publicationId)}/publication-articles`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to load selected articles");
      }
      const json = (await res.json()) as { items?: SelectedArticleRow[] };
      setSelectedArticles(Array.isArray(json?.items) ? json.items : []);
    } catch (e: any) {
      setSelectedArticles([]);
      setSelectedError(e?.message ?? "Failed to load selected articles");
    } finally {
      setSelectedLoading(false);
    }
  }, [publicationId]);

  const loadAvailable = useCallback(
    async (params?: { q?: string; portal_id?: number | "" }) => {
      setAvailableLoading(true);
      setAvailableError(null);
      try {
        const search = new URLSearchParams();
        const q = params?.q !== undefined ? params.q : filterQuery;
        const portal = params?.portal_id !== undefined ? params.portal_id : filterPortalId;
        if (q) search.set("q", q);
        if (typeof portal === "number") search.set("portal_id", String(portal));
        const res = await fetch(
          `/api/v1/publications/${encodeURIComponent(
            publicationId
          )}/available-portal-articles${search.toString() ? `?${search.toString()}` : ""}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to load available articles");
        }
        const json = (await res.json()) as AvailablePortalArticlesResponse;
        setAvailable({
          items: Array.isArray(json?.items) ? json.items : [],
          portals: Array.isArray(json?.portals) ? json.portals : [],
          cutoff_date: json?.cutoff_date ?? null,
        });
      } catch (e: any) {
        setAvailable({ items: [], portals: [], cutoff_date: null });
        setAvailableError(e?.message ?? "Failed to load available articles");
      } finally {
        setAvailableLoading(false);
      }
    },
    [publicationId, filterQuery, filterPortalId]
  );

  useEffect(() => {
    void loadSelected();
    void loadAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId]);

  // Debounce filter changes to avoid hammering the API while typing.
  useEffect(() => {
    const t = setTimeout(() => {
      void loadAvailable();
    }, PORTAL_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, filterPortalId]);

  const articleBuilderHref = useCallback(
    (publicationArticleId: string) =>
      `/logged/pages/production/publications/${encodeURIComponent(
        publicationId
      )}/manager/article_builder/${encodeURIComponent(publicationArticleId)}`,
    [publicationId]
  );

  const handleSelectArticle = useCallback(
    async (articleId: string) => {
      if (!articleId) return;
      setActionMessage(null);
      setActionError(null);
      setBusyArticleId(articleId);
      try {
        const res = await fetch(
          `/api/v1/publications/${encodeURIComponent(publicationId)}/publication-articles`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ article_id: articleId }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to select article");
        }
        setActionMessage(`Article ${articleId} selected for this publication.`);
        await Promise.all([loadSelected(), loadAvailable()]);
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to select article");
      } finally {
        setBusyArticleId(null);
      }
    },
    [publicationId, loadSelected, loadAvailable]
  );

  const handleRemoveSelectedArticle = useCallback(
    async (publicationArticleId: string) => {
      if (!publicationArticleId) return;
      const confirmed = window.confirm(
        "Remove this article from the publication? Linked chunks will be deleted; assigned slots are not removed."
      );
      if (!confirmed) return;
      setActionMessage(null);
      setActionError(null);
      setBusyArticleId(publicationArticleId);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to remove article");
        }
        setActionMessage("Article removed.");
        await Promise.all([loadSelected(), loadAvailable()]);
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to remove article");
      } finally {
        setBusyArticleId(null);
      }
    },
    [loadSelected, loadAvailable]
  );

  const portalsLabel = useMemo(() => {
    if (!available.portals.length) return "—";
    return available.portals.map((p) => `${p.portal_name} (#${p.portal_id})`).join(", ");
  }, [available.portals]);

  return (
    <div className="space-y-6">
      {actionError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      ) : null}
      {actionMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      <section className="space-y-3">
        <header>
          <h3 className="text-sm font-semibold text-gray-800">Selected articles</h3>
          <p className="text-xs text-gray-500">
            Articles already linked to this publication. Open the Article
            Builder to lay each one out across magazine pages.
          </p>
        </header>
        {selectedError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {selectedError}
          </div>
        ) : null}
        {selectedLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Loading selected articles…
          </div>
        ) : selectedArticles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No articles selected yet. Pick one from the list below.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {selectedArticles.map((row) => (
              <article
                key={row.publication_article_id}
                className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm flex flex-col gap-2"
              >
                <div className="flex items-start gap-3">
                  {row.article?.article_main_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.article.article_main_image_url}
                      alt={row.article?.article_title ?? row.article_id}
                      className="h-14 w-20 object-cover rounded-md border border-gray-100"
                    />
                  ) : (
                    <div className="h-14 w-20 rounded-md border border-dashed border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                      {row.article?.article_title ?? row.article_id}
                    </p>
                    {row.article?.article_subtitle ? (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {row.article.article_subtitle}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] font-mono text-gray-500 truncate">
                      {row.article_id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600 border-t border-gray-100 pt-2">
                  <span>
                    Pages: <strong className="text-gray-800">{row.desired_page_count}</strong>
                  </span>
                  <span>
                    Chunks: <strong className="text-gray-800">{row.chunks_count}</strong>
                  </span>
                  <span>
                    Slots:{" "}
                    <strong className="text-gray-800">
                      {row.publication_slots_id_array?.length ?? 0}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemoveSelectedArticle(row.publication_article_id)}
                    disabled={busyArticleId === row.publication_article_id}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                  <Link
                    href={articleBuilderHref(row.publication_article_id)}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    Open Article Builder
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Available portal articles
            </h3>
            <p className="text-xs text-gray-500">
              Portals: {portalsLabel}
              {available.cutoff_date ? (
                <>
                  {" "}
                  · Showing articles published after{" "}
                  <strong className="text-gray-700">{formatDate(available.cutoff_date)}</strong>
                </>
              ) : (
                " · Showing every published article in these portals"
              )}
              .
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500">
                Search
              </label>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="id_article or title"
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500">
                Portal
              </label>
              <select
                value={filterPortalId === "" ? "" : String(filterPortalId)}
                onChange={(e) =>
                  setFilterPortalId(e.target.value ? Number(e.target.value) : "")
                }
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All portals</option>
                {available.portals.map((p) => (
                  <option key={p.portal_id} value={p.portal_id}>
                    {p.portal_name} (#{p.portal_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {availableError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {availableError}
          </div>
        ) : null}
        {availableLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Loading portal articles…
          </div>
        ) : available.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            No portal articles match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Article</th>
                  <th className="px-4 py-2 text-left font-medium">Portal</th>
                  <th className="px-4 py-2 text-left font-medium">Published at</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {available.items.map((row) => {
                  const busy = busyArticleId === row.id_article;
                  return (
                    <tr key={row.id_article} className="border-t border-gray-200 hover:bg-gray-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {row.article_main_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.article_main_image_url}
                              alt={row.article_title}
                              className="h-12 w-16 object-cover rounded-md border border-gray-100"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-md border border-dashed border-gray-300 bg-gray-50 text-[10px] flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {row.article_title}
                            </p>
                            {row.article_subtitle ? (
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {row.article_subtitle}
                              </p>
                            ) : null}
                            <p className="text-[10px] font-mono text-gray-500 truncate">
                              {row.id_article}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {row.portal_name ?? "—"}
                        {row.portal_id != null ? (
                          <span className="block text-[10px] font-mono text-gray-500">
                            #{row.portal_id}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {formatDate(row.article_published_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectArticle(row.id_article)}
                          disabled={busy}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busy ? "Selecting…" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
