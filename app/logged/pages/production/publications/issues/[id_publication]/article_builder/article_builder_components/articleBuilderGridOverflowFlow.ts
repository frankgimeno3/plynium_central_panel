"use client";

import {
  assignGridAreaCodesToOrphanTextChunks,
  buildGridPageTextChunks,
  computeGridTextOverflowUpdates,
  distributeCarryThroughOrderedChunks,
  gridCellOverflowOrder,
} from "./articleChunkGridOverflow";
import type {
  PublicationArticleChunk,
  PublicationArticleRow,
} from "./article_builder_page/types";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";

export type SyncArticlePagesResult = {
  slotIds: number[];
  chunks: PublicationArticleChunk[];
  publicationArticle: PublicationArticleRow;
};

const MAX_OVERFLOW_PAGE_CREATIONS = 48;

export async function syncPublicationArticlePages(
  publicationArticleId: string,
  desiredPageCount: number
): Promise<SyncArticlePagesResult> {
  const syncRes = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ desired_page_count: desiredPageCount }),
    }
  );
  if (!syncRes.ok) {
    const txt = await syncRes.text().catch(() => "");
    throw new Error(txt || "Failed to add article page");
  }

  const loadRes = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}?ensure_all_magazine_slots=1`,
    { cache: "no-store", credentials: "include" }
  );
  if (!loadRes.ok) {
    const txt = await loadRes.text().catch(() => "");
    throw new Error(txt || "Failed to reload article after adding page");
  }

  const json = (await loadRes.json()) as {
    publication_article: PublicationArticleRow;
    chunks: PublicationArticleChunk[];
  };

  const slotIds = Array.isArray(json.publication_article?.publication_slots_id_array)
    ? json.publication_article.publication_slots_id_array
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0)
    : [];

  return {
    slotIds,
    chunks: Array.isArray(json.chunks) ? json.chunks : [],
    publicationArticle: json.publication_article,
  };
}

function applyChunkHtmlUpdates(
  workingChunks: PublicationArticleChunk[],
  updates: Map<string, string>
): PublicationArticleChunk[] {
  if (!updates.size) return workingChunks;
  const byId = new Map(updates);
  return workingChunks.map((c) => {
    const html = byId.get(c.publication_article_chunk_id);
    if (html == null) return c;
    return { ...c, chunk_html: html };
  });
}

/** Keep in-memory overflow edits when a sync-pages reload returns stale `chunk_html`. */
export function mergeChunksAfterArticleReload(
  workingChunks: PublicationArticleChunk[],
  reloadedChunks: PublicationArticleChunk[]
): PublicationArticleChunk[] {
  const htmlById = new Map(
    workingChunks.map((c) => [c.publication_article_chunk_id, c.chunk_html])
  );
  const reloadedIds = new Set(
    reloadedChunks.map((c) => c.publication_article_chunk_id)
  );
  const merged = reloadedChunks.map((c) => {
    const html = htmlById.get(c.publication_article_chunk_id);
    return html != null ? { ...c, chunk_html: html } : c;
  });
  for (const c of workingChunks) {
    if (!reloadedIds.has(c.publication_article_chunk_id)) {
      merged.push(c);
    }
  }
  return merged;
}

async function prepareSlotGridChunks(options: {
  publicationArticleId: string;
  slotId: number;
  columnCount: number;
  workingChunks: PublicationArticleChunk[];
}): Promise<PublicationArticleChunk[]> {
  let workingChunks = await assignGridAreaCodesToOrphanTextChunks({
    slotId: options.slotId,
    columnCount: options.columnCount,
    chunks: options.workingChunks,
  });
  return ensureGridTextChunksForSlot({
    publicationArticleId: options.publicationArticleId,
    slotId: options.slotId,
    columnCount: options.columnCount,
    workingChunks,
  });
}

async function ensureGridTextChunksForSlot(options: {
  publicationArticleId: string;
  slotId: number;
  columnCount: number;
  workingChunks: PublicationArticleChunk[];
}): Promise<PublicationArticleChunk[]> {
  const { publicationArticleId, slotId, columnCount } = options;
  let workingChunks = [...options.workingChunks];
  const order = gridCellOverflowOrder(columnCount);
  const existingCodes = new Set(
    buildGridPageTextChunks(slotId, workingChunks, columnCount).map((c) => c.areaCode)
  );

  const slotChunks = workingChunks.filter((c) => chunkPublicationSlotId(c) === slotId);
  let baseLastPos = slotChunks.reduce((acc, c) => Math.max(acc, c.chunk_position), -1);

  for (const code of order) {
    if (existingCodes.has(code)) continue;
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
            chunk_position: baseLastPos + 1,
            publication_slot_id: slotId,
            chunk_area_array: [code],
          }),
        }
      );
      if (!res.ok) continue;
      const row = (await res.json()) as PublicationArticleChunk;
      workingChunks = [...workingChunks, row];
      existingCodes.add(code);
      baseLastPos += 1;
    } catch {
      /* best-effort */
    }
  }

  return workingChunks;
}

function orderedChunksForSlot(
  slotId: number,
  workingChunks: PublicationArticleChunk[],
  columnCount: number
) {
  const ordered = buildGridPageTextChunks(slotId, workingChunks, columnCount);
  if (!ordered.length) {
    throw new Error(`No grid text chunks available for slot ${slotId}`);
  }
  return ordered;
}

/**
 * Handles grid overflow for one edit, including spill to the next page(s) without limit
 * beyond a safety cap.
 */
export async function runArticleGridOverflowFlow(options: {
  sourceSlotId: number;
  sourceChunkId: string;
  editorEl: HTMLDivElement;
  getSlotIdsOrdered: () => number[];
  readChunks: () => PublicationArticleChunk[];
  columnCount: number;
  publicationArticleId: string;
  persistUpdates: (updates: Map<string, string>) => Promise<void>;
  /** Persist debounced textarea edits before spill / sync-pages reload. */
  flushPendingChunkHtml?: () => Promise<void>;
  onArticleReload: (data: SyncArticlePagesResult) => void | Promise<void>;
}): Promise<void> {
  const {
    sourceSlotId,
    sourceChunkId,
    editorEl,
    getSlotIdsOrdered,
    readChunks,
    columnCount,
    publicationArticleId,
    persistUpdates,
    flushPendingChunkHtml,
    onArticleReload,
  } = options;

  if (flushPendingChunkHtml) {
    await flushPendingChunkHtml();
  }

  const maxHeightPx = editorEl.clientHeight;
  const widthPx = editorEl.clientWidth;
  if (maxHeightPx < 12 || widthPx < 8) return;

  let workingChunks = [...readChunks()];
  workingChunks = await prepareSlotGridChunks({
    publicationArticleId,
    slotId: sourceSlotId,
    columnCount,
    workingChunks,
  });

  const sourceChunk = workingChunks.find(
    (c) => c.publication_article_chunk_id === sourceChunkId
  );
  if (!sourceChunk) return;

  const initial = computeGridTextOverflowUpdates({
    sourceChunkId,
    sourceInnerHtml: editorEl.innerHTML,
    sourcePreviousChunkHtml: String(sourceChunk.chunk_html ?? ""),
    sourceFormat: String(sourceChunk.publication_article_chunk_format),
    maxHeightPx,
    widthPx,
    pageTextChunks: buildGridPageTextChunks(
      sourceSlotId,
      workingChunks,
      columnCount
    ),
    columnCount,
  });

  if (!initial) return;

  workingChunks = applyChunkHtmlUpdates(workingChunks, initial.updates);
  if (initial.updates.size) await persistUpdates(initial.updates);

  let carry = initial.remainingCarry.trim();
  if (!carry) return;

  let slotIds = [...getSlotIdsOrdered()];
  let slotIndex = slotIds.findIndex((id) => id === sourceSlotId);
  if (slotIndex < 0) slotIndex = 0;

  let pagesCreated = 0;

  while (carry && pagesCreated < MAX_OVERFLOW_PAGE_CREATIONS) {
    slotIndex += 1;

    if (slotIndex >= slotIds.length) {
      const nextCount = slotIds.length + 1;
      const reloaded = await syncPublicationArticlePages(
        publicationArticleId,
        nextCount
      );
      workingChunks = mergeChunksAfterArticleReload(workingChunks, reloaded.chunks);
      onArticleReload({ ...reloaded, chunks: workingChunks });
      slotIds = [...reloaded.slotIds];
      if (slotIds.length < nextCount) {
        throw new Error("New article page was not added to the slot list");
      }
      slotIndex = slotIds.length - 1;
      pagesCreated += 1;
    }

    const targetSlotId = slotIds[slotIndex];
    if (!targetSlotId) break;

    workingChunks = await prepareSlotGridChunks({
      publicationArticleId,
      slotId: targetSlotId,
      columnCount,
      workingChunks,
    });

    const ordered = orderedChunksForSlot(targetSlotId, workingChunks, columnCount);
    const pageUpdates = new Map<string, string>();
    carry = distributeCarryThroughOrderedChunks(
      ordered,
      0,
      carry,
      maxHeightPx,
      widthPx,
      pageUpdates
    );

    if (pageUpdates.size) {
      workingChunks = applyChunkHtmlUpdates(workingChunks, pageUpdates);
      await persistUpdates(pageUpdates);
    }

    const refreshed = getSlotIdsOrdered();
    if (refreshed.length > 0) {
      slotIds = refreshed;
    }
  }
}
