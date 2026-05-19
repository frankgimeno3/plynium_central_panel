"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MagazinePageLayout } from "./magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import {
  detectBodyOverflowByMeasurement,
  planBodyChunksAcrossPages,
  planBodyChunksAcrossPagesByMeasurement,
  type BodyDistributionResult,
} from "./articleBodyDistribution";
import {
  currentPreviewBodyDimensions,
  type PreviewBodyDimensions,
} from "./magazinePreviewMeasurement";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import {
  aggregateArticleBodyHtml,
  findHeadingChunk,
  firstArticleSlotContentId,
  isEditableBodyTextChunk,
  type PublicationArticleChunkLike,
} from "./articleContentModel";

/** Safety cap so a runaway paste doesn't append unlimited article pages. */
const MAX_AUTO_PAGES_PER_SAVE = 8;

type ChunkRow = PublicationArticleChunkLike & {
  publication_article_id?: string;
  publication_id?: string;
};

async function patchChunk(chunkId: string, body: Record<string, unknown>): Promise<ChunkRow> {
  const res = await fetch(`/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to update chunk");
  }
  return (await res.json()) as ChunkRow;
}

async function createChunk(
  publicationArticleId: string,
  body: Record<string, unknown>
): Promise<ChunkRow> {
  const res = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to create chunk");
  }
  return (await res.json()) as ChunkRow;
}

async function deleteChunk(chunkId: string): Promise<void> {
  const res = await fetch(`/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to delete chunk");
  }
}

function planBodyChunks(
  html: string,
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout,
  dims: PreviewBodyDimensions | null
): BodyDistributionResult {
  if (dims) {
    return planBodyChunksAcrossPagesByMeasurement(html, pages, dims);
  }
  return planBodyChunksAcrossPages(html, pages, pageFormat);
}

async function syncBodyHtmlToChunks(
  publicationArticleId: string,
  html: string,
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout,
  currentChunks: ChunkRow[],
  dims: PreviewBodyDimensions | null
): Promise<ChunkRow[]> {
  const { pagePlans } = planBodyChunks(html, pages, pageFormat, dims);
  const bodyChunks = currentChunks.filter(isEditableBodyTextChunk);
  const bodyIds = new Set(bodyChunks.map((c) => c.publication_article_chunk_id));
  const keptChunks = currentChunks.filter((c) => !bodyIds.has(c.publication_article_chunk_id));

  for (const chunk of bodyChunks) {
    await deleteChunk(chunk.publication_article_chunk_id);
  }

  const created: ChunkRow[] = [];
  for (const pagePlan of pagePlans) {
    const slotContentId = pagePlan.slotContentId;
    let nextPosition =
      keptChunks
        .filter((c) => chunkPublicationSlotId(c) === slotContentId)
        .reduce((max, c) => Math.max(max, c.chunk_position), -1) + 1;
    for (let i = 0; i < pagePlan.htmlParts.length; i++) {
      const part = pagePlan.htmlParts[i]!;
      if (!part.trim()) continue;
      const row = await createChunk(publicationArticleId, {
        publication_article_chunk_format: "only_text",
        chunk_html: part,
        chunk_position: nextPosition,
        publication_slot_id: slotContentId,
      });
      created.push(row);
      nextPosition++;
    }
  }

  return created;
}

async function syncArticlePagesToCount(
  publicationArticleId: string,
  desiredPageCount: number
): Promise<number[]> {
  const res = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ desired_page_count: desiredPageCount }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to add article page");
  }
  const json = (await res.json()) as { publication_slots_id_array?: number[] };
  return Array.isArray(json.publication_slots_id_array)
    ? json.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];
}

export function useArticleContentSave<T extends ChunkRow>(options: {
  publicationArticleId: string;
  chunks: T[];
  articleFlowPages: MagazineArticleFlowPageInput[];
  pageFormat: MagazinePageLayout;
  setChunks: React.Dispatch<React.SetStateAction<T[]>>;
  onReload?: () => void | Promise<void>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
  /** Snapshot of the live preview body for accurate column measurement. */
  getPreviewBodyDimensions?: () => PreviewBodyDimensions | null;
}) {
  const {
    publicationArticleId,
    chunks,
    articleFlowPages,
    pageFormat,
    setChunks,
    onReload,
    onSaveMessage,
    onSaveError,
    getPreviewBodyDimensions,
  } = options;

  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const pagesRef = useRef(articleFlowPages);
  pagesRef.current = articleFlowPages;
  const formatRef = useRef(pageFormat);
  formatRef.current = pageFormat;
  const dimsProviderRef = useRef(getPreviewBodyDimensions);
  dimsProviderRef.current = getPreviewBodyDimensions;

  const readPreviewDimensions = useCallback((): PreviewBodyDimensions | null => {
    const provider = dimsProviderRef.current;
    const fromProvider = provider ? provider() : null;
    return fromProvider ?? currentPreviewBodyDimensions();
  }, []);

  const [savingField, setSavingField] = useState<"title" | "subtitle" | "content" | null>(null);

  const firstSlotId = firstArticleSlotContentId(articleFlowPages);

  const aggregatedBody = useMemo(
    () => aggregateArticleBodyHtml(articleFlowPages),
    [articleFlowPages]
  );

  const [titleDraft, setTitleDraft] = useState("");
  const [subtitleDraft, setSubtitleDraft] = useState("");
  const [bodyDraft, setBodyDraft] = useState("");
  const lastSyncedBodyRef = useRef("");

  useEffect(() => {
    setTitleDraft(findHeadingChunk(chunks, "title", firstSlotId)?.chunk_html ?? "");
    setSubtitleDraft(findHeadingChunk(chunks, "subtitle", firstSlotId)?.chunk_html ?? "");
  }, [chunks, firstSlotId]);

  useEffect(() => {
    if (savingField === "content") return;
    // Only push aggregated body into the draft when it actually changed (i.e. after a
    // server reload). This prevents transient re-renders from wiping the draft.
    if (aggregatedBody === lastSyncedBodyRef.current) return;
    lastSyncedBodyRef.current = aggregatedBody;
    setBodyDraft(aggregatedBody);
  }, [aggregatedBody, savingField]);

  useEffect(() => {
    lastSyncedBodyRef.current = aggregatedBody;
    setBodyDraft(aggregatedBody);
    setTitleDraft(findHeadingChunk(chunks, "title", firstSlotId)?.chunk_html ?? "");
    setSubtitleDraft(findHeadingChunk(chunks, "subtitle", firstSlotId)?.chunk_html ?? "");
  }, [publicationArticleId]);

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
      if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);
    },
    []
  );

  const ensureHeadingChunk = useCallback(
    async (format: "title" | "subtitle", html: string): Promise<string> => {
      const existing = findHeadingChunk(chunksRef.current, format, firstSlotId);
      if (existing) return existing.publication_article_chunk_id;

      if (firstSlotId == null) {
        throw new Error("Article page 1 is not provisioned yet.");
      }

      const created = await createChunk(publicationArticleId, {
        publication_article_chunk_format: format,
        chunk_html: html,
        chunk_position: format === "title" ? 0 : 1,
        publication_slot_id: firstSlotId,
      });
      setChunks((prev) => [...prev, created as T]);
      return created.publication_article_chunk_id;
    },
    [firstSlotId, publicationArticleId, setChunks]
  );

  const saveTitleHtml = useCallback(
    async (html: string) => {
      setSavingField("title");
      onSaveError?.(null);
      try {
        const chunkId = await ensureHeadingChunk("title", html);
        const updated = await patchChunk(chunkId, { chunk_html: html });
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === chunkId ? ({ ...c, ...updated } as T) : c
          )
        );
        onSaveMessage?.("Title saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save title");
      } finally {
        setSavingField(null);
      }
    },
    [ensureHeadingChunk, onSaveError, onSaveMessage, setChunks]
  );

  const saveSubtitleHtml = useCallback(
    async (html: string) => {
      setSavingField("subtitle");
      onSaveError?.(null);
      try {
        const chunkId = await ensureHeadingChunk("subtitle", html);
        const updated = await patchChunk(chunkId, { chunk_html: html });
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === chunkId ? ({ ...c, ...updated } as T) : c
          )
        );
        onSaveMessage?.("Subtitle saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save subtitle");
      } finally {
        setSavingField(null);
      }
    },
    [ensureHeadingChunk, onSaveError, onSaveMessage, setChunks]
  );

  /**
   * Persist the body HTML by:
   *   1. Reading live preview dimensions for accurate column measurement.
   *   2. While the content still overflows the current last page, auto-create
   *      a new article page via `/sync-pages` and re-measure (capped at
   *      `MAX_AUTO_PAGES_PER_SAVE` to guard against runaway pastes).
   *   3. Once everything fits, distribute and save chunks.
   *
   * This is the Word-style flow the user asked for: each column is filled to
   * the brim before content spills to the next column, and a new page is only
   * created when the very last column on the very last page is full.
   */
  const persistBodyHtml = useCallback(
    async (html: string) => {
      setSavingField("content");
      onSaveError?.(null);
      try {
        // Local working set, mutated as pages are auto-added.
        let workingPages: MagazineArticleFlowPageInput[] = [...pagesRef.current];
        const dims = readPreviewDimensions();
        let createdPages = 0;

        // Auto-expand pages until the content fits. Without measurement we fall
        // back to a single attempt (legacy heuristic placement).
        if (dims) {
          while (workingPages.length > 0) {
            const overflow = detectBodyOverflowByMeasurement(html, workingPages, dims);
            if (!overflow) break;
            if (createdPages >= MAX_AUTO_PAGES_PER_SAVE) {
              onSaveMessage?.(
                `Reached the safety cap of ${MAX_AUTO_PAGES_PER_SAVE} auto-added pages. ` +
                  `Some content still does not fit — shorten the text or add pages manually.`
              );
              break;
            }
            const desiredCount = workingPages.length + 1;
            const slotIds = await syncArticlePagesToCount(
              publicationArticleId,
              desiredCount
            );
            if (slotIds.length < desiredCount) {
              throw new Error("Server did not return the expected new article page.");
            }
            const existingPagesById = new Map(
              workingPages.map((p) => [p.slotContentId, p])
            );
            workingPages = slotIds.map((slotId) => {
              const existing = existingPagesById.get(slotId);
              return existing ?? { slotContentId: slotId, chunks: [] };
            });
            createdPages += 1;
          }
        }

        if (workingPages.length === 0) {
          workingPages = pagesRef.current;
        }

        const created = await syncBodyHtmlToChunks(
          publicationArticleId,
          html,
          workingPages,
          formatRef.current,
          chunksRef.current,
          dims
        );
        setChunks((prev) => {
          const kept = prev.filter((c) => !isEditableBodyTextChunk(c));
          return [...kept, ...(created as T[])].sort(
            (a, b) =>
              a.chunk_position - b.chunk_position ||
              a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
          );
        });

        if (createdPages === 0) {
          onSaveMessage?.("Content distributed across pages.");
        } else if (createdPages === 1) {
          onSaveMessage?.(
            `Added article page ${workingPages.length}; content continues there.`
          );
        } else {
          onSaveMessage?.(
            `Added ${createdPages} article pages; content continues across them.`
          );
        }

        // Await reload so aggregatedBody/articleFlowPages are in sync before we
        // clear savingField (otherwise the body-draft effect could briefly reset
        // to a stale value).
        await Promise.resolve(onReload?.());
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save content");
        await Promise.resolve(onReload?.());
      } finally {
        setSavingField(null);
      }
    },
    [
      onReload,
      onSaveError,
      onSaveMessage,
      publicationArticleId,
      readPreviewDimensions,
      setChunks,
    ]
  );

  const saveBodyHtml = useCallback(
    async (html: string) => {
      await persistBodyHtml(html);
    },
    [persistBodyHtml]
  );

  const scheduleTitleChange = useCallback(
    (html: string) => {
      setTitleDraft(html);
      setChunks((prev) => {
        const id = findHeadingChunk(prev, "title", firstSlotId)?.publication_article_chunk_id;
        if (!id) return prev;
        return prev.map((c) =>
          c.publication_article_chunk_id === id ? { ...c, chunk_html: html } : c
        );
      });
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      titleTimerRef.current = setTimeout(() => {
        titleTimerRef.current = null;
        void saveTitleHtml(html);
      }, 700);
    },
    [firstSlotId, saveTitleHtml, setChunks]
  );

  const scheduleSubtitleChange = useCallback(
    (html: string) => {
      setSubtitleDraft(html);
      setChunks((prev) => {
        const id = findHeadingChunk(prev, "subtitle", firstSlotId)?.publication_article_chunk_id;
        if (!id) return prev;
        return prev.map((c) =>
          c.publication_article_chunk_id === id ? { ...c, chunk_html: html } : c
        );
      });
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
      subtitleTimerRef.current = setTimeout(() => {
        subtitleTimerRef.current = null;
        void saveSubtitleHtml(html);
      }, 700);
    },
    [firstSlotId, saveSubtitleHtml, setChunks]
  );

  const scheduleBodyChange = useCallback(
    (html: string) => {
      setBodyDraft(html);
      if (bodyTimerRef.current) clearTimeout(bodyTimerRef.current);
      bodyTimerRef.current = setTimeout(() => {
        bodyTimerRef.current = null;
        void saveBodyHtml(html);
      }, 900);
    },
    [saveBodyHtml]
  );

  return {
    titleHtml: titleDraft,
    subtitleHtml: subtitleDraft,
    bodyHtml: bodyDraft,
    savingField,
    scheduleTitleChange,
    scheduleSubtitleChange,
    scheduleBodyChange,
  };
}

export function filterPreviewChunksForPage<T extends ChunkRow>(
  chunks: T[],
  slotId: number | null
): T[] {
  if (slotId == null) return [];
  return chunks
    .filter((c) => chunkPublicationSlotId(c) === slotId)
    .sort((a, b) => a.chunk_position - b.chunk_position);
}
