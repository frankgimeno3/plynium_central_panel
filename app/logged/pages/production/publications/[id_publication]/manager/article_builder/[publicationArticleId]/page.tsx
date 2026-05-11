"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { publicationArticleSubpageHref } from "@/app/logged/pages/production/publications/subpage/ArticleSubpagePage/subpage_page_components/types";

type ArticleMeta = {
  id_article: string;
  article_title: string;
  article_subtitle: string | null;
  article_main_image_url: string | null;
  article_date: string | null;
};

type PublicationArticleRow = {
  publication_article_id: string;
  publication_id: string;
  article_id: string;
  publication_slots_id_array: number[];
  desired_page_count: number;
};

type PublicationArticleChunk = {
  publication_article_chunk_id: string;
  publication_article_id: string;
  publication_id: string;
  publication_slot_content_id: number | null;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
  original_article_content_id: string | null;
};

type SlotContentRow = {
  publication_slot_content_id: number;
  publication_id: string;
  publication_slot_id: number;
  publication_slot_position: number;
  slot_content_format: string;
  slot_content_object_array: unknown[];
  article_id: string | null;
};

const ArticleBuilderPage: FC<{
  params: Promise<{ id_publication: string; publicationArticleId: string }>;
}> = ({ params }) => {
  const { id_publication, publicationArticleId } = use(params);
  const { setPageMeta } = usePageContent();

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [articleMeta, setArticleMeta] = useState<ArticleMeta | null>(null);
  const [pageContents, setPageContents] = useState<SlotContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageCountInput, setPageCountInput] = useState<number>(1);
  const [syncing, setSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyChunkId, setBusyChunkId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to load publication_article");
      }
      const json = (await res.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
      };
      const pa = json?.publication_article ?? null;
      setPublicationArticle(pa);
      setChunks(Array.isArray(json?.chunks) ? json.chunks : []);
      setPageCountInput(pa?.desired_page_count ?? 1);

      // Load source article metadata for the header.
      if (pa?.article_id) {
        try {
          const aRes = await fetch(
            `/api/v1/articles/${encodeURIComponent(pa.article_id)}`,
            { cache: "no-store", credentials: "include" }
          );
          if (aRes.ok) {
            setArticleMeta((await aRes.json()) as ArticleMeta);
          } else {
            setArticleMeta(null);
          }
        } catch {
          setArticleMeta(null);
        }
      } else {
        setArticleMeta(null);
      }

      // Load slot contents for each linked publication_slot_id so we can show
      // each magazine page (one slot ⇒ one publication_slot_content row of
      // slot_content_format='article').
      const slotIds = Array.isArray(pa?.publication_slots_id_array)
        ? pa.publication_slots_id_array
        : [];
      if (slotIds.length) {
        try {
          const allContents: SlotContentRow[] = [];
          for (const slotId of slotIds) {
            const cRes = await fetch(
              `/api/v1/publications-db/${encodeURIComponent(
                id_publication
              )}/slots/${slotId}/contents`,
              { cache: "no-store", credentials: "include" }
            );
            if (cRes.ok) {
              const list = (await cRes.json()) as SlotContentRow[];
              for (const c of Array.isArray(list) ? list : []) allContents.push(c);
            }
          }
          setPageContents(allContents);
        } catch {
          setPageContents([]);
        }
      } else {
        setPageContents([]);
      }
    } catch (e: any) {
      setPublicationArticle(null);
      setChunks([]);
      setArticleMeta(null);
      setPageContents([]);
      setError(e?.message ?? "Failed to load publication_article");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId, id_publication]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article Builder",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: "/logged/pages/production/publications/issues" },
        {
          label: `Issue ${id_publication}`,
          href: `/logged/pages/production/publications/${encodeURIComponent(id_publication)}`,
        },
        { label: "Article Builder" },
      ],
      buttons: [
        {
          label: "Back to publication",
          href: `/logged/pages/production/publications/${encodeURIComponent(id_publication)}`,
        },
      ],
    });
  }, [setPageMeta, id_publication]);

  /** Map publication_slot_id ⇒ matching publication_slot_content row (article). */
  const pageSlotContentMap = useMemo(() => {
    const m = new Map<number, SlotContentRow>();
    for (const c of pageContents) {
      if (
        String(c.slot_content_format ?? "").toLowerCase() === "article" &&
        c.publication_slot_id != null
      ) {
        m.set(Number(c.publication_slot_id), c);
      }
    }
    return m;
  }, [pageContents]);

  /** Pages presented to the user (1-indexed). */
  const pages = useMemo(() => {
    const arr = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle!.publication_slots_id_array
      : [];
    return arr.map((slotId, index) => {
      const sc = pageSlotContentMap.get(Number(slotId)) ?? null;
      const chunkIds = chunks
        .filter((ch) => sc && ch.publication_slot_content_id === sc.publication_slot_content_id)
        .map((ch) => ch.publication_article_chunk_id);
      return {
        index: index + 1,
        publication_slot_id: Number(slotId),
        publication_slot_content_id: sc?.publication_slot_content_id ?? null,
        chunkIds,
      };
    });
  }, [publicationArticle, pageSlotContentMap, chunks]);

  const subpageHref = useCallback(
    (slotId: number, slotContentId: number | null) =>
      publicationArticleSubpageHref(id_publication, publicationArticleId, slotId, slotContentId),
    [id_publication, publicationArticleId]
  );

  const handleSyncPages = useCallback(async () => {
    if (!publicationArticle) return;
    const target = Math.max(1, Math.floor(Number(pageCountInput) || 1));
    setSyncing(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ desired_page_count: target }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to sync pages");
      }
      setActionMessage(`Pages synchronized to ${target}.`);
      await load();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to sync pages");
    } finally {
      setSyncing(false);
    }
  }, [publicationArticle, pageCountInput, publicationArticleId, load]);

  const handleInitializeChunks = useCallback(async () => {
    if (!publicationArticle) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          publicationArticleId
        )}/initialize-chunks-from-source`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to initialize chunks from source");
      }
      const json = (await res.json()) as {
        initialized: boolean;
        created_count?: number;
        reason?: string;
      };
      setActionMessage(
        json.initialized
          ? `Imported ${json.created_count ?? 0} chunks from source article.`
          : `Nothing imported (${json.reason ?? "no source content"}).`
      );
      await load();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to initialize chunks from source");
    }
  }, [publicationArticle, publicationArticleId, load]);

  const handleAssignChunkToPage = useCallback(
    async (chunkId: string, slotContentId: number | null) => {
      setActionMessage(null);
      setActionError(null);
      setBusyChunkId(chunkId);
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_slot_content_id: slotContentId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to assign chunk to page");
        }
        await load();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to assign chunk to page");
      } finally {
        setBusyChunkId(null);
      }
    },
    [load]
  );

  const handleAddBlankChunk = useCallback(async () => {
    if (!publicationArticle) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            publication_article_chunk_format: "only_text",
            chunk_html: "",
            chunk_position: chunks.length,
          }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to add chunk");
      }
      await load();
    } catch (e: any) {
      setActionError(e?.message ?? "Failed to add chunk");
    }
  }, [publicationArticle, publicationArticleId, chunks.length, load]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading article builder…</div>
      </PageContentSection>
    );
  }

  if (!publicationArticle) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "publication_article not found."}</p>
          <Link
            href={`/logged/pages/production/publications/${encodeURIComponent(id_publication)}`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to publication
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const pageOptions = pages.filter((p) => p.publication_slot_content_id != null);

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <header className="flex items-start gap-4">
          {articleMeta?.article_main_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={articleMeta.article_main_image_url}
              alt={articleMeta.article_title}
              className="h-20 w-32 object-cover rounded-md border border-gray-200"
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-xs font-mono text-gray-500">
              {publicationArticle.article_id}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              {articleMeta?.article_title || publicationArticle.article_id}
            </h1>
            {articleMeta?.article_subtitle ? (
              <p className="text-sm text-gray-600">{articleMeta.article_subtitle}</p>
            ) : null}
          </div>
        </header>

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

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-gray-500">
                Number of magazine pages
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={pageCountInput}
                onChange={(e) => setPageCountInput(Number(e.target.value) || 1)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={handleSyncPages}
              disabled={syncing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {syncing ? "Syncing…" : "Apply page count"}
            </button>
            <button
              type="button"
              onClick={handleInitializeChunks}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Import chunks from source article
            </button>
            <span className="text-xs text-gray-500">
              {pages.length} page{pages.length === 1 ? "" : "s"} provisioned ·{" "}
              {chunks.length} chunk{chunks.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-800">Pages</h2>
          {pages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Set a page count above to provision magazine pages for this article.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {pages.map((p) => (
                <Link
                  key={`${p.publication_slot_id}-${p.publication_slot_content_id ?? "x"}`}
                  href={subpageHref(p.publication_slot_id, p.publication_slot_content_id)}
                  className="group rounded-lg border border-gray-200 bg-white p-3 hover:border-blue-300 hover:shadow-sm transition"
                >
                  <div className="aspect-[3/4] rounded-md border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-3xl font-semibold text-gray-300 group-hover:text-blue-400">
                    {p.index}
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-700">
                    Page {p.index}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono truncate">
                    slot #{p.publication_slot_id}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {p.chunkIds.length} chunk{p.chunkIds.length === 1 ? "" : "s"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Chunks</h2>
            <button
              type="button"
              onClick={handleAddBlankChunk}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              + Add blank chunk
            </button>
          </header>
          {chunks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No chunks yet. Use "Import chunks from source article" to bring in
              the portal article paragraphs, or add a blank chunk to start
              writing from scratch.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">#</th>
                    <th className="px-3 py-2 text-left font-medium">Format</th>
                    <th className="px-3 py-2 text-left font-medium">Preview</th>
                    <th className="px-3 py-2 text-left font-medium">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {chunks
                    .slice()
                    .sort((a, b) => a.chunk_position - b.chunk_position)
                    .map((chunk) => (
                      <tr key={chunk.publication_article_chunk_id} className="border-t border-gray-200">
                        <td className="px-3 py-2 font-mono text-[11px] text-gray-500">
                          {chunk.chunk_position}
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {chunk.publication_article_chunk_format}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div
                            className="max-w-md text-xs text-gray-700 line-clamp-3 prose prose-sm"
                            dangerouslySetInnerHTML={{
                              __html:
                                chunk.chunk_html ||
                                "<em class='text-gray-400'>(empty)</em>",
                            }}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={chunk.publication_slot_content_id ?? ""}
                            onChange={(e) =>
                              handleAssignChunkToPage(
                                chunk.publication_article_chunk_id,
                                e.target.value ? Number(e.target.value) : null
                              )
                            }
                            disabled={busyChunkId === chunk.publication_article_chunk_id}
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Unassigned</option>
                            {pageOptions.map((p) => (
                              <option
                                key={p.publication_slot_content_id as number}
                                value={p.publication_slot_content_id as number}
                              >
                                Page {p.index} (slot #{p.publication_slot_id})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageContentSection>
  );
};

export default ArticleBuilderPage;
