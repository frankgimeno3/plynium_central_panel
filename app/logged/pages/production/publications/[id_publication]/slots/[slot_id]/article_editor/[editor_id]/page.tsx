"use client";

import React, { FC, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { RichTextContent, RichTextEditor } from "@/app/logged/logged_components/RichTextEditor";

const BASE = "/logged/pages/production/publications";
const REGULAR_SLOT_POSITION = 0;

const CHUNK_FORMATS = [
  "title",
  "subtitle",
  "only_text",
  "only_image",
  "text_image",
  "image_text",
] as const;
type ChunkFormat = (typeof CHUNK_FORMATS)[number];

type SlotRow = {
  publication_slot_id: number;
  slot_key: string;
  slot_content_type: string;
  slot_article_id: string | null;
};

type SlotContentRow = {
  publication_slot_content_id: number;
  publication_slot_position: number;
  slot_content_format: string;
  article_id: string | null;
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
  publication_slot_content_id: number | null;
  publication_article_chunk_format: ChunkFormat;
  chunk_html: string;
  chunk_position: number;
};

type ArticleMeta = {
  id_article: string;
  article_title: string;
  article_subtitle: string | null;
  article_main_image_url: string | null;
};

function articleBuilderHref(publicationId: string, publicationArticleId: string): string {
  return `${BASE}/${encodeURIComponent(publicationId)}/manager/article_builder/${encodeURIComponent(
    publicationArticleId
  )}`;
}

function pickArticleSlotContent(contents: SlotContentRow[]): SlotContentRow | null {
  const articleRows = contents.filter(
    (row) => String(row.slot_content_format ?? "").toLowerCase() === "article"
  );
  if (!articleRows.length) return null;
  const atRegularPosition = articleRows.find(
    (row) => Number(row.publication_slot_position) === REGULAR_SLOT_POSITION
  );
  return atRegularPosition ?? articleRows[0] ?? null;
}

const MagazineArticleEditorPage: FC<{
  params: Promise<{ id_publication: string; slot_id: string; editor_id: string }>;
}> = ({ params }) => {
  const { id_publication, slot_id, editor_id } = use(params);
  const slotIdNum = Number(slot_id);
  const { setPageMeta } = usePageContent();

  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [slotContents, setSlotContents] = useState<SlotContentRow[]>([]);
  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [articleMeta, setArticleMeta] = useState<ArticleMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const slotBackHref = `${BASE}/${encodeURIComponent(id_publication)}/slots/${encodeURIComponent(
    String(slotIdNum)
  )}`;

  const load = useCallback(async () => {
    if (!Number.isFinite(slotIdNum) || slotIdNum <= 0) {
      setError("Invalid slot id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [slotRes, contentsRes, publicationArticlesRes] = await Promise.all([
        fetch(`/api/v1/publication-slots/${slotIdNum}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          `/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents`,
          { cache: "no-store", credentials: "include" }
        ),
        fetch(`/api/v1/publications/${encodeURIComponent(id_publication)}/publication-articles`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      if (!slotRes.ok) {
        const txt = await slotRes.text().catch(() => "");
        throw new Error(txt || "Failed to load slot");
      }

      const slotData = (await slotRes.json()) as SlotRow;
      const contentsData = contentsRes.ok ? ((await contentsRes.json()) as SlotContentRow[]) : [];
      const contents = Array.isArray(contentsData) ? contentsData : [];
      const articleContent = pickArticleSlotContent(contents);
      const relatedArticleId =
        slotData.slot_article_id ?? articleContent?.article_id ?? null;

      const publicationArticlesJson = publicationArticlesRes.ok
        ? ((await publicationArticlesRes.json()) as { items?: PublicationArticleRow[] })
        : { items: [] };
      const publicationArticles = Array.isArray(publicationArticlesJson.items)
        ? publicationArticlesJson.items
        : [];

      const publicationArticleMatch =
        publicationArticles.find((item) =>
          item.publication_slots_id_array.some((slotId) => Number(slotId) === slotIdNum)
        ) ??
        publicationArticles.find((item) => relatedArticleId && item.article_id === relatedArticleId) ??
        null;

      setSlot(slotData);
      setSlotContents(contents);
      setPublicationArticle(publicationArticleMatch);

      if (publicationArticleMatch?.publication_article_id) {
        const paRes = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(
            publicationArticleMatch.publication_article_id
          )}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!paRes.ok) {
          const txt = await paRes.text().catch(() => "");
          throw new Error(txt || "Failed to load publication article chunks");
        }
        const paJson = (await paRes.json()) as {
          publication_article: PublicationArticleRow;
          chunks: PublicationArticleChunk[];
        };
        setPublicationArticle(paJson.publication_article ?? publicationArticleMatch);
        setChunks(Array.isArray(paJson.chunks) ? paJson.chunks : []);
      } else {
        setChunks([]);
      }

      const articleId = publicationArticleMatch?.article_id ?? relatedArticleId;
      if (articleId) {
        try {
          const articleRes = await fetch(`/api/v1/articles/${encodeURIComponent(articleId)}`, {
            cache: "no-store",
            credentials: "include",
          });
          setArticleMeta(articleRes.ok ? ((await articleRes.json()) as ArticleMeta) : null);
        } catch {
          setArticleMeta(null);
        }
      } else {
        setArticleMeta(null);
      }
    } catch (e: unknown) {
      setSlot(null);
      setSlotContents([]);
      setPublicationArticle(null);
      setChunks([]);
      setArticleMeta(null);
      setError(e instanceof Error ? e.message : "Failed to load article editor");
    } finally {
      setLoading(false);
    }
  }, [id_publication, slotIdNum]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return () => {
      for (const timer of saveTimersRef.current.values()) {
        clearTimeout(timer);
      }
      saveTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article editor",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: id_publication, href: `${BASE}/${encodeURIComponent(id_publication)}` },
        { label: `Slot #${slot_id}`, href: slotBackHref },
        { label: `Article editor: ${editor_id}` },
      ],
      buttons: [{ label: "Back to slot", href: slotBackHref }],
    });
  }, [setPageMeta, id_publication, slot_id, editor_id, slotBackHref]);

  const slotContentId = useMemo(() => {
    const articleContent = pickArticleSlotContent(slotContents);
    return articleContent?.publication_slot_content_id ?? null;
  }, [slotContents]);

  const pageChunks = useMemo(() => {
    if (!slotContentId) return [];
    return chunks
      .filter((chunk) => Number(chunk.publication_slot_content_id) === slotContentId)
      .slice()
      .sort((a, b) => a.chunk_position - b.chunk_position);
  }, [chunks, slotContentId]);

  const pageIndex = useMemo(() => {
    if (!publicationArticle) return null;
    const index = publicationArticle.publication_slots_id_array.findIndex(
      (slotId) => Number(slotId) === slotIdNum
    );
    return index >= 0 ? index + 1 : null;
  }, [publicationArticle, slotIdNum]);

  const persistChunkHtml = useCallback(
    async (chunkId: string, chunkHtml: string) => {
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
            body: JSON.stringify({ chunk_html: chunkHtml }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to save chunk");
        }
        setActionMessage("Chunk saved.");
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to save chunk");
      } finally {
        setSavingChunkId(null);
      }
    },
    []
  );

  const scheduleChunkSave = useCallback(
    (chunkId: string, chunkHtml: string) => {
      const existing = saveTimersRef.current.get(chunkId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        saveTimersRef.current.delete(chunkId);
        void persistChunkHtml(chunkId, chunkHtml);
      }, 700);
      saveTimersRef.current.set(chunkId, timer);
    },
    [persistChunkHtml]
  );

  const handleChunkHtmlChange = useCallback(
    (chunkId: string, chunkHtml: string) => {
      setChunks((prev) =>
        prev.map((chunk) =>
          chunk.publication_article_chunk_id === chunkId ? { ...chunk, chunk_html: chunkHtml } : chunk
        )
      );
      scheduleChunkSave(chunkId, chunkHtml);
    },
    [scheduleChunkSave]
  );

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
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to update chunk");
      } finally {
        setSavingChunkId(null);
      }
    },
    [load]
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
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to delete chunk");
      }
    },
    [load]
  );

  const addChunkAtPosition = useCallback(
    async (position: number) => {
      if (!publicationArticle || !slotContentId) return;
      setActionError(null);
      setActionMessage(null);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(
            publicationArticle.publication_article_id
          )}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_text",
              chunk_html: "",
              chunk_position: position,
              publication_slot_content_id: slotContentId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to add chunk");
        }
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to add chunk");
      }
    },
    [publicationArticle, slotContentId, load]
  );

  const moveChunkBy = useCallback(
    async (chunkId: string, delta: number) => {
      const sorted = pageChunks;
      const idx = sorted.findIndex((chunk) => chunk.publication_article_chunk_id === chunkId);
      if (idx === -1) return;
      const swapWith = sorted[idx + delta];
      if (!swapWith) return;
      const current = sorted[idx];
      await updateChunk(current.publication_article_chunk_id, {
        chunk_position: swapWith.chunk_position,
      });
      await updateChunk(swapWith.publication_article_chunk_id, {
        chunk_position: current.chunk_position,
      });
    },
    [pageChunks, updateChunk]
  );

  if (editor_id !== "magazine") {
    return (
      <PageContentSection>
        <div className="max-w-md mx-auto text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
          <h1 className="text-xl font-semibold text-gray-900">Editor not available</h1>
          <p className="mt-3 text-sm text-gray-600">
            The <span className="font-mono text-gray-800">{editor_id}</span> editor is not
            supported yet.
          </p>
          <Link
            href={slotBackHref}
            className="mt-6 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-950/90"
          >
            Back to slot
          </Link>
        </div>
      </PageContentSection>
    );
  }

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading article editor…</div>
      </PageContentSection>
    );
  }

  if (!slot) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Slot not found."}</p>
          <Link
            href={`${BASE}/${encodeURIComponent(id_publication)}`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Flatplan
          </Link>
        </div>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-gray-500">
              Slot {slot.slot_key} · #{slot.publication_slot_id}
            </p>
            <h1 className="text-xl font-semibold text-gray-900">
              {articleMeta?.article_title || publicationArticle?.article_id || "Magazine article"}
            </h1>
            {articleMeta?.article_subtitle ? (
              <p className="text-sm text-gray-600">{articleMeta.article_subtitle}</p>
            ) : null}
            {pageIndex ? (
              <p className="mt-1 text-xs text-gray-500">Magazine page {pageIndex}</p>
            ) : null}
          </div>
          {publicationArticle ? (
            <Link
              href={articleBuilderHref(id_publication, publicationArticle.publication_article_id)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Open Article Builder
            </Link>
          ) : null}
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        ) : null}
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

        {!publicationArticle ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This slot does not have a linked publication article yet. Relate an article on the slot
            page, then provision pages from the Article Builder before editing chunks here.
          </div>
        ) : null}

        {publicationArticle && !slotContentId ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            This slot does not yet have article slot content. Re-apply the page count in the Article
            Builder to provision it.
          </div>
        ) : null}

        {publicationArticle && slotContentId ? (
          <section className="space-y-2">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Chunks on this page</h2>
              <button
                type="button"
                onClick={() => addChunkAtPosition(pageChunks.length)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                + Add chunk
              </button>
            </header>

            {pageChunks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
                No chunks assigned to this page yet. Use &quot;Add chunk&quot;.
              </div>
            ) : (
              <ul className="space-y-3">
                {pageChunks.map((chunk, idx) => (
                  <li
                    key={chunk.publication_article_chunk_id}
                    className="rounded-xl border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-gray-500">#{idx + 1}</span>
                        <select
                          value={chunk.publication_article_chunk_format}
                          onChange={(event) =>
                            updateChunk(chunk.publication_article_chunk_id, {
                              publication_article_chunk_format: event.target.value as ChunkFormat,
                            })
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {CHUNK_FORMATS.map((format) => (
                            <option key={format} value={format}>
                              {format}
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
                          disabled={idx === pageChunks.length - 1}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:opacity-30"
                          aria-label="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => removeChunk(chunk.publication_article_chunk_id)}
                          className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                        Content
                      </label>
                      <RichTextEditor
                        value={chunk.chunk_html}
                        onChange={(value) =>
                          handleChunkHtmlChange(chunk.publication_article_chunk_id, value)
                        }
                        minHeight="160px"
                        placeholder="Write the chunk content…"
                      />
                    </div>

                    <div className="mt-3 rounded-md bg-gray-50 p-2 text-xs text-gray-700">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                        Live preview
                      </p>
                      <RichTextContent
                        htmlOrPlain={chunk.chunk_html}
                        className="prose prose-sm max-w-none"
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
        ) : null}
      </div>
    </PageContentSection>
  );
};

export default MagazineArticleEditorPage;
