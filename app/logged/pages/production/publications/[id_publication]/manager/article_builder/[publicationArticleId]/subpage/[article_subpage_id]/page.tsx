"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const CHUNK_FORMATS = [
  "title",
  "subtitle",
  "only_text",
  "only_image",
  "text_image",
  "image_text",
] as const;
type ChunkFormat = (typeof CHUNK_FORMATS)[number];

const PAGE_FORMAT_OPTIONS: { id: string; label: string; description: string }[] = [
  {
    id: "only_text",
    label: "Only text",
    description: "A page made entirely of text chunks (paragraphs, titles, subtitles).",
  },
  {
    id: "only_image",
    label: "Only image",
    description: "A page that is dominated by a single image.",
  },
  {
    id: "text_image",
    label: "Text left · Image right",
    description: "Two-column layout with text on the left, image on the right.",
  },
  {
    id: "image_text",
    label: "Image left · Text right",
    description: "Two-column layout with image on the left, text on the right.",
  },
];

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
  publication_article_chunk_format: ChunkFormat;
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

/**
 * `[article_subpage_id]` is encoded as `<publication_slot_id>-<publication_slot_content_id>`
 * so we can navigate from the article builder grid without an extra round-trip.
 * `<publication_slot_content_id>` is `0` when the page exists but the
 * publication_slot_content row hasn't been provisioned yet (defensive).
 */
function parseSubpageId(raw: string): {
  slotId: number | null;
  slotContentId: number | null;
} {
  const parts = String(raw ?? "").split("-");
  const slotId = Number(parts[0]);
  const slotContentId = Number(parts[1]);
  return {
    slotId: Number.isFinite(slotId) && slotId > 0 ? slotId : null,
    slotContentId: Number.isFinite(slotContentId) && slotContentId > 0 ? slotContentId : null,
  };
}

const ArticleSubpageBuilderPage: FC<{
  params: Promise<{
    id_publication: string;
    publicationArticleId: string;
    article_subpage_id: string;
  }>;
}> = ({ params }) => {
  const { id_publication, publicationArticleId, article_subpage_id } = use(params);
  const { setPageMeta } = usePageContent();

  const { slotId, slotContentId: parsedSlotContentId } = useMemo(
    () => parseSubpageId(article_subpage_id),
    [article_subpage_id]
  );

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [slotContent, setSlotContent] = useState<SlotContentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const [pageFormatDraft, setPageFormatDraft] = useState<string>("only_text");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const paRes = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!paRes.ok) {
        const txt = await paRes.text().catch(() => "");
        throw new Error(txt || "Failed to load publication_article");
      }
      const paJson = (await paRes.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
      };
      setPublicationArticle(paJson?.publication_article ?? null);
      setChunks(Array.isArray(paJson?.chunks) ? paJson.chunks : []);

      if (slotId && parsedSlotContentId) {
        try {
          const cRes = await fetch(
            `/api/v1/publications-db/${encodeURIComponent(
              id_publication
            )}/slots/${slotId}/contents`,
            { cache: "no-store", credentials: "include" }
          );
          if (cRes.ok) {
            const list = (await cRes.json()) as SlotContentRow[];
            const found = (Array.isArray(list) ? list : []).find(
              (c) => Number(c.publication_slot_content_id) === parsedSlotContentId
            );
            setSlotContent(found ?? null);
          }
        } catch {
          setSlotContent(null);
        }
      } else {
        setSlotContent(null);
      }
    } catch (e: any) {
      setPublicationArticle(null);
      setChunks([]);
      setSlotContent(null);
      setError(e?.message ?? "Failed to load subpage");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId, id_publication, slotId, parsedSlotContentId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article Subpage",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        {
          label: "Publications",
          href: "/logged/pages/production/publications/issues",
        },
        {
          label: `Issue ${id_publication}`,
          href: `/logged/pages/production/publications/${encodeURIComponent(id_publication)}`,
        },
        {
          label: "Article Builder",
          href: `/logged/pages/production/publications/${encodeURIComponent(
            id_publication
          )}/manager/article_builder/${encodeURIComponent(publicationArticleId)}`,
        },
        { label: "Subpage" },
      ],
      buttons: [
        {
          label: "Back to Article Builder",
          href: `/logged/pages/production/publications/${encodeURIComponent(
            id_publication
          )}/manager/article_builder/${encodeURIComponent(publicationArticleId)}`,
        },
      ],
    });
  }, [setPageMeta, id_publication, publicationArticleId]);

  const subpageChunks = useMemo(() => {
    if (!parsedSlotContentId) return [];
    return chunks
      .filter((c) => Number(c.publication_slot_content_id) === parsedSlotContentId)
      .slice()
      .sort((a, b) => a.chunk_position - b.chunk_position);
  }, [chunks, parsedSlotContentId]);

  /** Lookup pages list to render the "Move to page" select on each chunk. */
  const allPages = useMemo(() => {
    return Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle!.publication_slots_id_array.map((sid, index) => ({
          index: index + 1,
          publication_slot_id: Number(sid),
        }))
      : [];
  }, [publicationArticle]);

  const updateChunk = useCallback(
    async (chunkId: string, payload: Partial<PublicationArticleChunk>) => {
      setActionError(null);
      setActionMessage(null);
      setSavingChunkId(chunkId);
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to update chunk");
        }
        await loadAll();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to update chunk");
      } finally {
        setSavingChunkId(null);
      }
    },
    [loadAll]
  );

  const removeChunk = useCallback(
    async (chunkId: string) => {
      const ok = window.confirm("Delete this chunk?");
      if (!ok) return;
      setActionError(null);
      setActionMessage(null);
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to delete chunk");
        }
        await loadAll();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to delete chunk");
      }
    },
    [loadAll]
  );

  const addChunkAtPosition = useCallback(
    async (position: number) => {
      if (!publicationArticle || !parsedSlotContentId) return;
      setActionError(null);
      setActionMessage(null);
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
              chunk_position: position,
              publication_slot_content_id: parsedSlotContentId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to add chunk");
        }
        await loadAll();
      } catch (e: any) {
        setActionError(e?.message ?? "Failed to add chunk");
      }
    },
    [publicationArticle, parsedSlotContentId, publicationArticleId, loadAll]
  );

  const moveChunkBy = useCallback(
    async (chunkId: string, delta: number) => {
      const sorted = subpageChunks;
      const idx = sorted.findIndex((c) => c.publication_article_chunk_id === chunkId);
      if (idx === -1) return;
      const swapWith = sorted[idx + delta];
      if (!swapWith) return;
      const a = sorted[idx];
      // Swap positions atomically (best-effort: two PATCH calls).
      await updateChunk(a.publication_article_chunk_id, { chunk_position: swapWith.chunk_position });
      await updateChunk(swapWith.publication_article_chunk_id, { chunk_position: a.chunk_position });
    },
    [subpageChunks, updateChunk]
  );

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading subpage…</div>
      </PageContentSection>
    );
  }

  if (!publicationArticle || !slotId) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Subpage not found."}</p>
          <Link
            href={`/logged/pages/production/publications/${encodeURIComponent(
              id_publication
            )}/manager/article_builder/${encodeURIComponent(publicationArticleId)}`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Article Builder
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const pageIndex =
    publicationArticle.publication_slots_id_array.findIndex(
      (sid) => Number(sid) === Number(slotId)
    ) + 1;

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <header className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">
              {publicationArticle.article_id} · slot #{slotId}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              Page {pageIndex || "?"}
            </h1>
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
          <h2 className="text-sm font-semibold text-gray-800">Page format</h2>
          <p className="text-xs text-gray-500 mb-3">
            Pick the layout used to render this page in the magazine. The
            current chunks adapt to the chosen format.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAGE_FORMAT_OPTIONS.map((opt) => {
              const active = pageFormatDraft === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPageFormatDraft(opt.id)}
                  className={`text-left rounded-lg border px-3 py-2 transition ${
                    active
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                  <p className="text-[11px] text-gray-500">{opt.description}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            The page format is purely a presentational hint until the magazine
            renderer reads it. It is stored in the chunk format itself for
            now; richer per-page metadata can be added later.
          </p>
        </section>

        <section className="space-y-2">
          <header className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Chunks on this page</h2>
            <button
              type="button"
              onClick={() => addChunkAtPosition(subpageChunks.length)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              + Add chunk
            </button>
          </header>

          {!parsedSlotContentId ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              This page does not yet have a publication_slot_content row.
              Returning to the Article Builder and re-applying the page count
              should provision it.
            </div>
          ) : subpageChunks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              No chunks assigned to this page yet. Use “Add chunk”.
            </div>
          ) : (
            <ul className="space-y-3">
              {subpageChunks.map((chunk, idx) => (
                <li
                  key={chunk.publication_article_chunk_id}
                  className="rounded-xl border border-gray-200 bg-white p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500">#{idx + 1}</span>
                      <select
                        value={chunk.publication_article_chunk_format}
                        onChange={(e) =>
                          updateChunk(chunk.publication_article_chunk_id, {
                            publication_article_chunk_format: e.target.value as ChunkFormat,
                          })
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CHUNK_FORMATS.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveChunkBy(chunk.publication_article_chunk_id, -1)}
                        disabled={idx === 0}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
                        aria-label="Move up"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveChunkBy(chunk.publication_article_chunk_id, 1)}
                        disabled={idx === subpageChunks.length - 1}
                        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
                        aria-label="Move down"
                      >
                        ↓
                      </button>
                      <select
                        value={chunk.publication_slot_content_id ?? ""}
                        onChange={(e) =>
                          updateChunk(chunk.publication_article_chunk_id, {
                            publication_slot_content_id: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        title="Move to another page"
                      >
                        <option value={parsedSlotContentId ?? ""}>
                          Stay on this page
                        </option>
                        {allPages
                          .filter((p) => p.publication_slot_id !== slotId)
                          .map((p) => (
                            <option
                              key={p.publication_slot_id}
                              value={`${p.publication_slot_id}`}
                            >
                              Move to page {p.index}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeChunk(chunk.publication_article_chunk_id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={5}
                    value={chunk.chunk_html}
                    onChange={(e) =>
                      setChunks((prev) =>
                        prev.map((c) =>
                          c.publication_article_chunk_id === chunk.publication_article_chunk_id
                            ? { ...c, chunk_html: e.target.value }
                            : c
                        )
                      )
                    }
                    onBlur={(e) =>
                      updateChunk(chunk.publication_article_chunk_id, {
                        chunk_html: e.target.value,
                      })
                    }
                    placeholder="<p>Write HTML here…</p>"
                    className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                      Live preview
                    </p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: chunk.chunk_html || "<em class='text-gray-400'>(empty)</em>",
                      }}
                    />
                  </div>
                  {savingChunkId === chunk.publication_article_chunk_id ? (
                    <p className="mt-1 text-[10px] text-blue-500">Saving…</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageContentSection>
  );
};

export default ArticleSubpageBuilderPage;
