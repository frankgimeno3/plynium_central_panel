import { isOverlayImageChunk } from "./article_image_manager/articleImagePlacement";
import { shouldOmitPortalBodyChunkFromFlow } from "./portalArticleChunkHtml";

export type FlowPublicationArticleChunk = {
  publication_article_chunk_id: string;
  publication_slot_id?: number | null;
  /** @deprecated use publication_slot_id */
  publication_slot_content_id?: number | null;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
};

export type MagazineArticleFlowPageInput = {
  /** `publication_slots_db.publication_slot_id` for this article page. */
  slotContentId: number;
  chunks: FlowPublicationArticleChunk[];
};

function defaultChunkPageWeight(format: string): number {
  const f = String(format ?? "only_text").trim().toLowerCase();
  if (f === "title" || f === "subtitle" || f === "only_text") return 15;
  if (f === "only_image") return 25;
  if (f === "text_image" || f === "image_text") return 20;
  return 15;
}

export function effectiveChunkPageWeight(chunk: FlowPublicationArticleChunk): number {
  return defaultChunkPageWeight(chunk.publication_article_chunk_format);
}

export function normalizeChunkFormat(format: string | null | undefined): string {
  return String(format ?? "")
    .trim()
    .toLowerCase();
}

export function isHeadingChunkFormat(format: string | null | undefined): boolean {
  const f = normalizeChunkFormat(format);
  return f === "title" || f === "subtitle";
}

export function isFlowBodyChunk(chunk: FlowPublicationArticleChunk): boolean {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  if (isHeadingChunkFormat(fmt)) return false;
  if (!fmt || fmt === "only_text" || fmt === "text_image" || fmt === "image_text") return true;
  if (
    fmt === "only_image" &&
    !isOverlayImageChunk(chunk.chunk_html, fmt, (chunk as { chunk_area_array?: unknown }).chunk_area_array)
  ) {
    return true;
  }
  return false;
}

function sortChunks(chunks: FlowPublicationArticleChunk[]): FlowPublicationArticleChunk[] {
  return [...chunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
}

export function extractBodyFlowChunks(chunks: FlowPublicationArticleChunk[]): FlowPublicationArticleChunk[] {
  return sortChunks(chunks).filter(
    (chunk) =>
      isFlowBodyChunk(chunk) &&
      !shouldOmitPortalBodyChunkFromFlow(chunk.chunk_html, chunk.publication_article_chunk_format)
  );
}

/** Per-column capacity (page budget 100 split across columns). */
export function weightCapacityPerColumn(columnCount: number): number {
  const cols = columnCount === 3 ? 3 : 2;
  return 100 / cols;
}

/**
 * Assign body chunks per magazine page: each page fills its own columns first,
 * then overflow carries to the next page. Chunks stay tied to their assigned page
 * until they no longer fit in that page's column budget.
 */
export function distributeBodyChunksAcrossPages(
  pages: MagazineArticleFlowPageInput[],
  columnCount: number
): Map<number, FlowPublicationArticleChunk[]> {
  const result = new Map<number, FlowPublicationArticleChunk[]>();
  for (const p of pages) {
    result.set(p.slotContentId, []);
  }
  if (pages.length === 0) return result;

  const cols = columnCount === 3 ? 3 : 2;
  const colCapacity = weightCapacityPerColumn(cols);

  let carryOver: FlowPublicationArticleChunk[] = [];

  for (const p of pages) {
    const slotId = p.slotContentId;
    const queue = [...carryOver, ...extractBodyFlowChunks(p.chunks)];
    carryOver = [];

    let colIdx = 0;
    let colUsed = 0;
    const placed: FlowPublicationArticleChunk[] = [];

    for (const chunk of queue) {
      const weight = effectiveChunkPageWeight(chunk);

      while (colIdx < cols && colUsed > 0 && colUsed + weight > colCapacity + 1e-6) {
        colIdx++;
        colUsed = 0;
      }

      if (colIdx >= cols) {
        carryOver.push(chunk);
        continue;
      }

      placed.push(chunk);
      colUsed += weight;

      if (colUsed >= colCapacity - 1e-6) {
        colIdx++;
        colUsed = 0;
      }
    }

    result.set(slotId, placed);
  }

  if (carryOver.length > 0) {
    const lastId = pages[pages.length - 1]!.slotContentId;
    result.set(lastId, [...(result.get(lastId) ?? []), ...carryOver]);
  }

  return result;
}

/** Body chunks assigned to this page (preview always shows the current page's content). */
export function previewBodyChunksForPage(
  _pages: MagazineArticleFlowPageInput[] | undefined,
  _columnCount: number,
  _currentSlotContentId: number | null | undefined,
  pageChunks: FlowPublicationArticleChunk[]
): FlowPublicationArticleChunk[] {
  return extractBodyFlowChunks(pageChunks);
}

export type PublicationSlotPageRef = {
  publication_slot_id: number;
};

function groupChunksByPublicationSlotId(
  allChunks: FlowPublicationArticleChunk[]
): Map<number, FlowPublicationArticleChunk[]> {
  const bySlotId = new Map<number, FlowPublicationArticleChunk[]>();
  for (const c of allChunks) {
    const sid = Number(c.publication_slot_id ?? c.publication_slot_content_id);
    if (!Number.isFinite(sid) || sid <= 0) continue;
    const list = bySlotId.get(sid) ?? [];
    list.push(c);
    bySlotId.set(sid, list);
  }
  return bySlotId;
}

/**
 * Article page order from `publication_articles.publication_slots_id_array` →
 * each `publication_slot_id` (empty chunk lists still count as pages).
 */
export function buildArticleFlowPagesFromPublicationSlots(
  orderedSlots: PublicationSlotPageRef[],
  allChunks: FlowPublicationArticleChunk[]
): MagazineArticleFlowPageInput[] {
  const bySlotId = groupChunksByPublicationSlotId(allChunks);
  const ordered: MagazineArticleFlowPageInput[] = [];
  const seen = new Set<number>();

  for (const slot of orderedSlots) {
    const sid = Number(slot.publication_slot_id);
    if (!Number.isFinite(sid) || sid <= 0 || seen.has(sid)) continue;
    seen.add(sid);
    ordered.push({
      slotContentId: sid,
      chunks: bySlotId.get(sid) ?? [],
    });
  }

  return ordered;
}

/** @deprecated Prefer buildArticleFlowPagesFromPublicationSlots when slot order is known. */
export function buildArticleFlowPagesFromSlotOrder(
  orderedSlotContentIds: (number | null | undefined)[],
  allChunks: FlowPublicationArticleChunk[],
  options?: { includeEmptyPages?: boolean }
): MagazineArticleFlowPageInput[] {
  const bySlotId = groupChunksByPublicationSlotId(allChunks);
  const ordered: MagazineArticleFlowPageInput[] = [];
  const seen = new Set<number>();

  for (const raw of orderedSlotContentIds) {
    const sid = Number(raw);
    if (!Number.isFinite(sid) || sid <= 0 || seen.has(sid)) continue;
    const pageChunks = bySlotId.get(sid) ?? [];
    if (!options?.includeEmptyPages && pageChunks.length === 0) continue;
    seen.add(sid);
    ordered.push({ slotContentId: sid, chunks: pageChunks });
  }

  const remaining = [...bySlotId.keys()]
    .filter((scid) => !seen.has(scid))
    .sort((a, b) => {
      const minA = Math.min(...bySlotId.get(a)!.map((c) => c.chunk_position));
      const minB = Math.min(...bySlotId.get(b)!.map((c) => c.chunk_position));
      return minA - minB;
    });

  for (const sid of remaining) {
    ordered.push({ slotContentId: sid, chunks: bySlotId.get(sid)! });
  }

  return ordered;
}
