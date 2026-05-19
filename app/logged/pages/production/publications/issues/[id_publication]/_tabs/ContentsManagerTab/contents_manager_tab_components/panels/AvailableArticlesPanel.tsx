"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BASE } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type AvailableArticlesPanelProps = {
  publicationId: string;
};

type PortalRow = { portal_id: number; portal_name: string };

type LinkedPublicationRow = {
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  magazine_id: string | null;
  is_current_publication: boolean;
};

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
  linked_publications: LinkedPublicationRow[];
  in_publication: boolean;
  in_current_publication: boolean;
};

type AvailablePortalArticlesResponse = {
  items: AvailablePortalArticleRow[];
  portals: PortalRow[];
  cutoff_date: string | null;
  magazine: { magazine_id: string; magazine_name: string } | null;
};

const PORTAL_FILTER_DEBOUNCE_MS = 300;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function publicationIssueHref(publicationId: string): string {
  return `${BASE}/${encodeURIComponent(publicationId)}`;
}

function PublicationLinksCell({ links }: { links: LinkedPublicationRow[] }) {
  if (!links.length) {
    return <span className="text-white">Not in any publication</span>;
  }

  return (
    <div className="space-y-1">
      {links.map((link) => {
        const label =
          link.publication_edition_name?.trim() ||
          link.publication_id ||
          "Untitled publication";
        return (
          <div key={`${link.publication_id}-${label}`}>
            <Link
              href={publicationIssueHref(link.publication_id)}
              className="text-sky-300 hover:text-sky-200 hover:underline"
            >
              {label}
            </Link>
            {link.is_current_publication ? (
              <span className="ml-1 rounded-full border border-sky-500/50 bg-sky-950/60 px-1.5 py-0.5 text-[10px] font-medium text-sky-200">
                This publication
              </span>
            ) : null}
            <span className="block text-[10px] font-mono text-slate-400">
              {link.publication_id}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Portal articles eligible for selection in this publication. */
export function AvailableArticlesPanel({ publicationId }: AvailableArticlesPanelProps) {
  const [available, setAvailable] = useState<AvailablePortalArticlesResponse>({
    items: [],
    portals: [],
    cutoff_date: null,
    magazine: null,
  });
  const [availableLoading, setAvailableLoading] = useState(true);
  const [availableError, setAvailableError] = useState<string | null>(null);

  const [filterQuery, setFilterQuery] = useState("");
  const [filterPortalId, setFilterPortalId] = useState<number | "">("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyArticleId, setBusyArticleId] = useState<string | null>(null);

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
          magazine: json?.magazine ?? null,
        });
      } catch (e: any) {
        setAvailable({ items: [], portals: [], cutoff_date: null, magazine: null });
        setAvailableError(e?.message ?? "Failed to load available articles");
      } finally {
        setAvailableLoading(false);
      }
    },
    [publicationId, filterQuery, filterPortalId]
  );

  useEffect(() => {
    void loadAvailable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicationId]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadAvailable();
    }, PORTAL_FILTER_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, filterPortalId]);

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
        await loadAvailable();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to select article");
      } finally {
        setBusyArticleId(null);
      }
    },
    [publicationId, loadAvailable]
  );

  const portalsLabel = useMemo(() => {
    if (!available.portals.length) return "No portals linked to this magazine";
    return available.portals.map((p) => `${p.portal_name} (#${p.portal_id})`).join(", ");
  }, [available.portals]);

  return (
    <div className="space-y-4">
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

      <section className="space-y-3 rounded-xl border border-slate-600 bg-slate-950 p-4 text-white">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Available portal articles</h3>
            <p className="text-xs text-slate-300">
              Magazine:{" "}
              <strong className="text-white">
                {available.magazine?.magazine_name ?? available.magazine?.magazine_id ?? "—"}
              </strong>
              {" · "}Portals: {portalsLabel}
              {available.cutoff_date ? (
                <>
                  {" "}
                  · Showing articles published after{" "}
                  <strong className="text-white">{formatDate(available.cutoff_date)}</strong>
                </>
              ) : (
                " · Showing every published article in these portals"
              )}
              .
            </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400">
                Search
              </label>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="id_article or title"
                className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-slate-400">
                Portal
              </label>
              <select
                value={filterPortalId === "" ? "" : String(filterPortalId)}
                onChange={(e) =>
                  setFilterPortalId(e.target.value ? Number(e.target.value) : "")
                }
                className="rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
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
          <div className="rounded-md border border-red-400/50 bg-red-950/50 px-3 py-2 text-xs text-red-200">
            {availableError}
          </div>
        ) : null}
        {availableLoading ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 text-center text-sm text-slate-300">
            Loading portal articles…
          </div>
        ) : available.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/80 p-6 text-center text-sm text-slate-300">
            No portal articles match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-600 bg-slate-950 text-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800 text-white">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-white">Article</th>
                  <th className="px-4 py-2 text-left font-medium text-white">Portal</th>
                  <th className="px-4 py-2 text-left font-medium text-white">Published at</th>
                  <th className="px-4 py-2 text-left font-medium text-white">Magazine publication</th>
                  <th className="px-4 py-2 text-right font-medium text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {available.items.map((row) => {
                  const busy = busyArticleId === row.id_article;
                  const rowKey = `${row.id_article}-${row.portal_id ?? "na"}`;
                  return (
                    <tr key={rowKey} className="border-t border-slate-700 hover:bg-slate-900/80">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {row.article_main_image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.article_main_image_url}
                              alt={row.article_title}
                              className="h-12 w-16 object-cover rounded-md border border-slate-600"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-md border border-dashed border-slate-500 bg-slate-900 text-[10px] flex items-center justify-center text-slate-400">
                              No image
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white line-clamp-2">
                              {row.article_title}
                            </p>
                            {row.article_subtitle ? (
                              <p className="text-xs text-slate-300 line-clamp-1">
                                {row.article_subtitle}
                              </p>
                            ) : null}
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              {row.id_article}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {row.portal_name ?? "—"}
                        {row.portal_id != null ? (
                          <span className="block text-[10px] font-mono text-slate-400">
                            #{row.portal_id}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {formatDate(row.article_published_at)}
                      </td>
                      <td className="px-4 py-3 text-white">
                        <PublicationLinksCell links={row.linked_publications ?? []} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.in_current_publication ? (
                          <span className="text-xs text-slate-300">Already selected</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectArticle(row.id_article)}
                            disabled={busy}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busy ? "Selecting…" : "Select"}
                          </button>
                        )}
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
