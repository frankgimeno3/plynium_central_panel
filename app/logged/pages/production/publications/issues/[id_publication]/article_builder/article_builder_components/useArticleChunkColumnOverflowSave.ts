"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MagazinePageLayout } from "./magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import {
  buildColumnOverflowPlan,
  OVERFLOW_DEFERRED_SLOT_CONTENT_ID,
  type ColumnOverflowPlan,
} from "./magazineChunkColumnOverflow";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { PendingColumnOverflow } from "./ArticleChunkColumnOverflowModal";

type ChunkRow = {
  publication_article_chunk_id: string;
  publication_article_id?: string;
  publication_id?: string;
  publication_slot_id?: number | null;
  /** @deprecated use publication_slot_id */
  publication_slot_content_id?: number | null;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
  chunk_page_weight?: number;
  original_article_content_id?: string | null;
};

async function shiftChunksForwardOnSlot(
  chunks: ChunkRow[],
  slotId: number
): Promise<{ updated: ChunkRow[]; insertPosition: number }> {
  const onPage = chunks
    .filter((c) => chunkPublicationSlotId(c) === slotId)
    .sort((a, b) => b.chunk_position - a.chunk_position);

  const insertPosition =
    onPage.length > 0 ? Math.min(...onPage.map((c) => c.chunk_position)) : 0;

  const updated: ChunkRow[] = [];
  for (const c of onPage) {
    const row = await patchChunk(c.publication_article_chunk_id, {
      chunk_position: c.chunk_position + 1,
    });
    updated.push(row);
  }

  return { updated, insertPosition };
}

async function patchChunk(
  chunkId: string,
  body: Record<string, unknown>
): Promise<ChunkRow> {
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

function resolveArticleSlotId(slotId: number): number {
  if (!Number.isFinite(slotId) || slotId <= 0) {
    throw new Error("Invalid magazine page slot");
  }
  return slotId;
}

async function resolvePlanForExecution(
  publicationArticleId: string,
  plan: ColumnOverflowPlan
): Promise<ColumnOverflowPlan> {
  const needsDeferred = plan.segments.some(
    (s) => s.slotContentId === OVERFLOW_DEFERRED_SLOT_CONTENT_ID
  );
  if (!needsDeferred) return plan;

  const desiredPageCount = plan.totalArticlePages + 1;
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
  const json = (await res.json()) as {
    publication_article?: { publication_id?: string };
    publication_slots_id_array?: number[];
  };
  const publicationId = String(json.publication_article?.publication_id ?? "").trim();
  const slotIds = Array.isArray(json.publication_slots_id_array)
    ? json.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n) && n > 0)
    : [];
  const lastSlotId = slotIds[slotIds.length - 1];
  if (!publicationId || !lastSlotId) {
    throw new Error("Could not resolve the new article page after sync");
  }
  const slotContentId = resolveArticleSlotId(lastSlotId);

  return {
    ...plan,
    willAddArticlePage: false,
    targetPageExists: true,
    targetPageFitsOverflow: true,
    totalArticlePages: desiredPageCount,
    segments: plan.segments.map((seg) =>
      seg.slotContentId === OVERFLOW_DEFERRED_SLOT_CONTENT_ID
        ? { ...seg, slotContentId }
        : seg
    ),
  };
}

async function executeIntraPageColumnSplit(
  publicationArticleId: string,
  plan: ColumnOverflowPlan,
  sourceChunkId: string,
  chunks: ChunkRow[]
): Promise<ChunkRow[]> {
  const updated: ChunkRow[] = [];
  let workingChunks = [...chunks];

  const keptSeg = plan.segments.find((s) => s.existingChunkId);
  const overflowSeg = plan.segments.find((s) => !s.existingChunkId);
  if (!keptSeg?.existingChunkId || !overflowSeg) return updated;

  const source = workingChunks.find(
    (c) => c.publication_article_chunk_id === sourceChunkId
  );
  if (!source) return updated;

  const slotContentId = overflowSeg.slotContentId;
  const insertPosition = source.chunk_position + 1;

  const toShift = workingChunks
    .filter(
      (c) =>
        chunkPublicationSlotId(c) === slotContentId &&
        c.chunk_position >= insertPosition &&
        c.publication_article_chunk_id !== sourceChunkId
    )
    .sort((a, b) => b.chunk_position - a.chunk_position);

  for (const c of toShift) {
    const row = await patchChunk(c.publication_article_chunk_id, {
      chunk_position: c.chunk_position + 1,
    });
    updated.push(row);
    workingChunks = workingChunks.map((x) =>
      x.publication_article_chunk_id === row.publication_article_chunk_id ? row : x
    );
  }

  const patched = await patchChunk(sourceChunkId, {
    chunk_html: keptSeg.html,
    chunk_page_weight: keptSeg.weight,
  });
  updated.push(patched);
  workingChunks = workingChunks.map((c) =>
    c.publication_article_chunk_id === patched.publication_article_chunk_id ? patched : c
  );

  const created = await createChunk(publicationArticleId, {
    publication_article_chunk_format: "only_text",
    chunk_html: overflowSeg.html,
    chunk_page_weight: overflowSeg.weight,
    chunk_position: insertPosition,
    publication_slot_id: slotContentId,
  });
  updated.push(created);

  return updated;
}

async function executeColumnOverflowPlan(
  publicationArticleId: string,
  plan: ColumnOverflowPlan,
  chunks: ChunkRow[]
): Promise<ChunkRow[]> {
  const updated: ChunkRow[] = [];
  let workingChunks = [...chunks];

  for (const seg of plan.segments) {
    if (seg.existingChunkId) {
      const row = await patchChunk(seg.existingChunkId, {
        chunk_html: seg.html,
        chunk_page_weight: seg.weight,
      });
      updated.push(row);
      workingChunks = workingChunks.map((c) =>
        c.publication_article_chunk_id === row.publication_article_chunk_id ? row : c
      );
      continue;
    }

    const { updated: shifted, insertPosition } = await shiftChunksForwardOnSlot(
      workingChunks,
      seg.slotContentId
    );
    updated.push(...shifted);
    for (const row of shifted) {
      workingChunks = workingChunks.map((c) =>
        c.publication_article_chunk_id === row.publication_article_chunk_id ? row : c
      );
    }

    const row = await createChunk(publicationArticleId, {
      publication_article_chunk_format: "only_text",
      chunk_html: seg.html,
      chunk_page_weight: seg.weight,
      chunk_position: insertPosition,
      publication_slot_id: seg.slotContentId,
    });
    updated.push(row);
    workingChunks = [...workingChunks, row];
  }

  return updated;
}

export function useArticleChunkColumnOverflowSave<T extends ChunkRow>(options: {
  publicationArticleId: string;
  chunks: T[];
  articleFlowPages: MagazineArticleFlowPageInput[];
  pageFormat: MagazinePageLayout;
  /** Editor page — only chunks on this slot content are checked for overflow. */
  activeSlotContentId?: number | null;
  mergeChunkFromApi: (chunk: T) => void;
  setChunks: React.Dispatch<React.SetStateAction<T[]>>;
  onAfterApply?: () => void;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
}) {
  const {
    publicationArticleId,
    chunks,
    articleFlowPages,
    pageFormat,
    activeSlotContentId,
    mergeChunkFromApi,
    setChunks,
    onAfterApply,
    onSaveMessage,
    onSaveError,
  } = options;

  const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const overflowCheckTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;

  const savedHtmlRef = useRef<Map<string, string>>(new Map());
  const overflowScannedArticleRef = useRef<string | null>(null);

  const [pendingOverflow, setPendingOverflow] = useState<PendingColumnOverflow | null>(null);
  const [overflowSaving, setOverflowSaving] = useState(false);
  const [overflowError, setOverflowError] = useState<string | null>(null);
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);

  useEffect(() => {
    for (const c of chunks) {
      savedHtmlRef.current.set(c.publication_article_chunk_id, c.chunk_html);
    }
  }, [chunks]);

  useEffect(() => {
    overflowScannedArticleRef.current = null;
    setPendingOverflow(null);
    setOverflowError(null);
  }, [activeSlotContentId]);

  useEffect(() => {
    const activeId =
      activeSlotContentId != null && Number(activeSlotContentId) > 0
        ? Number(activeSlotContentId)
        : null;
    if (!publicationArticleId || articleFlowPages.length === 0 || activeId == null) return;

    const scanKey = `${publicationArticleId}:${activeId}`;
    if (overflowScannedArticleRef.current === scanKey) return;
    overflowScannedArticleRef.current = scanKey;

    for (const chunk of chunksRef.current) {
      if (chunkPublicationSlotId(chunk) !== activeId) continue;
      if (String(chunk.publication_article_chunk_format).toLowerCase() !== "only_text") {
        continue;
      }
      const plan = buildColumnOverflowPlan(
        articleFlowPages,
        pageFormat,
        chunk,
        chunk.chunk_html
      );
      if (plan?.scope === "inter_page") {
        setOverflowError(null);
        setPendingOverflow({
          chunkId: chunk.publication_article_chunk_id,
          pendingHtml: chunk.chunk_html,
          plan,
        });
        break;
      }
    }
  }, [publicationArticleId, articleFlowPages, pageFormat, activeSlotContentId]);

  const persistChunkHtmlDirect = useCallback(
    async (chunkId: string, chunkHtml: string) => {
      setSavingChunkId(chunkId);
      onSaveError?.(null);
      try {
        const updated = await patchChunk(chunkId, { chunk_html: chunkHtml });
        mergeChunkFromApi(updated as T);
        savedHtmlRef.current.set(chunkId, chunkHtml);
        onSaveMessage?.("Chunk saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save chunk");
        throw e;
      } finally {
        setSavingChunkId(null);
      }
    },
    [mergeChunkFromApi, onSaveError, onSaveMessage]
  );

  const buildOverflowPlanForChunk = useCallback(
    (chunkId: string, chunkHtml: string) => {
      const chunk = chunksRef.current.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk) return null;

      const fmt = String(chunk.publication_article_chunk_format).toLowerCase();
      if (fmt !== "only_text") return null;

      const activeId =
        activeSlotContentId != null && Number(activeSlotContentId) > 0
          ? Number(activeSlotContentId)
          : null;
      if (
        activeId != null &&
        chunkPublicationSlotId(chunk) !== activeId
      ) {
        return null;
      }

      const hypotheticalPages = articleFlowPages.map((p) => {
        const liveOnPage = chunksRef.current.filter(
          (c) => chunkPublicationSlotId(c) === p.slotContentId
        );
        const chunksForPage =
          liveOnPage.length > 0
            ? liveOnPage.map((c) =>
                c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: chunkHtml } : c
              )
            : p.chunks.map((c) =>
                c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: chunkHtml } : c
              );
        return { ...p, chunks: chunksForPage };
      });

      return buildColumnOverflowPlan(
        hypotheticalPages,
        pageFormat,
        { ...chunk, chunk_html: chunkHtml },
        chunkHtml
      );
    },
    [articleFlowPages, pageFormat, activeSlotContentId]
  );

  const applyChunkUpdates = useCallback(
    (applied: ChunkRow[]) => {
      setChunks((prev) => {
        const byId = new Map(prev.map((c) => [c.publication_article_chunk_id, c]));
        for (const row of applied) {
          const existing = byId.get(row.publication_article_chunk_id);
          const merged = (existing ? { ...existing, ...row } : row) as T;
          byId.set(row.publication_article_chunk_id, merged);
          savedHtmlRef.current.set(row.publication_article_chunk_id, row.chunk_html);
        }
        return [...byId.values()].sort(
          (a, b) =>
            a.chunk_position - b.chunk_position ||
            a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
        );
      });
      for (const row of applied) {
        const existing = chunksRef.current.find(
          (c) => c.publication_article_chunk_id === row.publication_article_chunk_id
        );
        mergeChunkFromApi((existing ? { ...existing, ...row } : row) as T);
      }
    },
    [mergeChunkFromApi, setChunks]
  );

  const handleOverflowForChunk = useCallback(
    async (chunkId: string, chunkHtml: string, depth = 0): Promise<void> => {
      if (depth > 6) {
        await persistChunkHtmlDirect(chunkId, chunkHtml);
        return;
      }

      const plan = buildOverflowPlanForChunk(chunkId, chunkHtml);
      if (!plan) {
        await persistChunkHtmlDirect(chunkId, chunkHtml);
        return;
      }

      if (plan.scope === "intra_page_column") {
        setSavingChunkId(chunkId);
        onSaveError?.(null);
        try {
          const applied = await executeIntraPageColumnSplit(
            publicationArticleId,
            plan,
            chunkId,
            chunksRef.current
          );
          applyChunkUpdates(applied);

          const created = applied.find(
            (r) => r.publication_article_chunk_id !== chunkId
          );
          onSaveMessage?.(
            `Text moved to column ${plan.overflowStartsAtColumn} on article page ${plan.sourceArticlePage}.`
          );
          onAfterApply?.();

          if (created) {
            await handleOverflowForChunk(
              created.publication_article_chunk_id,
              created.chunk_html,
              depth + 1
            );
          }
        } catch (e: unknown) {
          onSaveError?.(
            e instanceof Error ? e.message : "Failed to split across columns"
          );
        } finally {
          setSavingChunkId(null);
        }
        return;
      }

      setOverflowError(null);
      setPendingOverflow({ chunkId, pendingHtml: chunkHtml, plan });
    },
    [
      applyChunkUpdates,
      buildOverflowPlanForChunk,
      onAfterApply,
      onSaveError,
      onSaveMessage,
      persistChunkHtmlDirect,
      publicationArticleId,
    ]
  );

  const tryPersistChunkHtml = useCallback(
    async (chunkId: string, chunkHtml: string) => {
      const chunk = chunksRef.current.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk) return;

      const fmt = String(chunk.publication_article_chunk_format).toLowerCase();
      if (fmt !== "only_text") {
        await persistChunkHtmlDirect(chunkId, chunkHtml);
        return;
      }

      await handleOverflowForChunk(chunkId, chunkHtml);
    },
    [handleOverflowForChunk, persistChunkHtmlDirect]
  );

  const scheduleChunkSave = useCallback(
    (chunkId: string, chunkHtml: string) => {
      const existing = saveTimersRef.current.get(chunkId);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => {
        saveTimersRef.current.delete(chunkId);
        void tryPersistChunkHtml(chunkId, chunkHtml);
      }, 700);
      saveTimersRef.current.set(chunkId, timer);
    },
    [tryPersistChunkHtml]
  );

  const handleChunkHtmlChange = useCallback(
    (chunkId: string, chunkHtml: string) => {
      setChunks((prev) =>
        prev.map((chunk) =>
          chunk.publication_article_chunk_id === chunkId ? { ...chunk, chunk_html: chunkHtml } : chunk
        )
      );

      const saveTimer = saveTimersRef.current.get(chunkId);
      if (saveTimer) clearTimeout(saveTimer);

      const checkTimer = overflowCheckTimersRef.current.get(chunkId);
      if (checkTimer) clearTimeout(checkTimer);

      overflowCheckTimersRef.current.set(
        chunkId,
        setTimeout(() => {
          overflowCheckTimersRef.current.delete(chunkId);

          void handleOverflowForChunk(chunkId, chunkHtml);
        }, 400)
      );
    },
    [handleOverflowForChunk, setChunks]
  );

  const cancelOverflow = useCallback(() => {
    if (overflowSaving || !pendingOverflow) return;
    const { chunkId } = pendingOverflow;
    const saved = savedHtmlRef.current.get(chunkId);
    if (saved != null) {
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: saved } : c
        )
      );
    }
    setPendingOverflow(null);
    setOverflowError(null);
  }, [overflowSaving, pendingOverflow, setChunks]);

  const confirmOverflow = useCallback(async () => {
    if (!pendingOverflow || pendingOverflow.plan.segments.length === 0) return;
    if (pendingOverflow.plan.scope !== "inter_page") return;

    setOverflowSaving(true);
    setOverflowError(null);
    const { plan } = pendingOverflow;

    try {
      const resolvedPlan = await resolvePlanForExecution(publicationArticleId, plan);
      const applied = await executeColumnOverflowPlan(
        publicationArticleId,
        resolvedPlan,
        chunksRef.current
      );
      applyChunkUpdates(applied);
      setPendingOverflow(null);
      onAfterApply?.();
      onSaveMessage?.("Chunk split across pages.");
    } catch (e: unknown) {
      setOverflowError(e instanceof Error ? e.message : "Failed to split chunk");
    } finally {
      setOverflowSaving(false);
    }
  }, [
    pendingOverflow,
    publicationArticleId,
    applyChunkUpdates,
    onAfterApply,
    onSaveMessage,
  ]);

  const clearSaveTimers = useCallback(() => {
    for (const t of saveTimersRef.current.values()) clearTimeout(t);
    saveTimersRef.current.clear();
    for (const t of overflowCheckTimersRef.current.values()) clearTimeout(t);
    overflowCheckTimersRef.current.clear();
  }, []);

  return {
    savingChunkId: overflowSaving ? pendingOverflow?.chunkId ?? null : savingChunkId,
    handleChunkHtmlChange,
    pendingOverflow,
    overflowSaving,
    overflowError,
    cancelOverflow,
    confirmOverflow,
    clearSaveTimers,
  };
}
