import {
  buildFlatplanArticleDragPayloadFromSlot,
  flatplanEntryKeyFromSlot,
  isArticlePageSlotRow,
  type FlatplanArticleDragPayload,
  type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";
import type { FlatplanInsertAdjacentSide } from "./flatplanInsertPlacement";

export type { FlatplanArticleDragPayload };

export type FlatplanArticleDropTarget = {
  entryKey: string;
  side: FlatplanInsertAdjacentSide;
};

export type ArticleBlockSpan = {
  publicationArticleId: string;
  firstIdx: number;
  lastIdx: number;
};

export function buildFlatplanArticleDragPayload(slot: SlotRow): FlatplanArticleDragPayload | null {
  return buildFlatplanArticleDragPayloadFromSlot(slot);
}

export function buildArticleBlockSpans(sortedSlots: SlotRow[]): ArticleBlockSpan[] {
  const byArticle = new Map<string, number[]>();
  sortedSlots.forEach((slot, idx) => {
    if (!isArticlePageSlotRow(slot)) return;
    const paId = slot.flatplan_publication_article_id;
    if (paId == null) return;
    const id = String(paId).trim();
    if (!id) return;
    const list = byArticle.get(id) ?? [];
    list.push(idx);
    byArticle.set(id, list);
  });
  const spans: ArticleBlockSpan[] = [];
  for (const [publicationArticleId, indices] of byArticle) {
    if (indices.length === 0) continue;
    spans.push({
      publicationArticleId,
      firstIdx: Math.min(...indices),
      lastIdx: Math.max(...indices),
    });
  }
  return spans;
}

export function sortedSlotsExcludingArticle(
  sortedSlots: SlotRow[],
  publicationArticleId: string
): SlotRow[] {
  const id = String(publicationArticleId ?? "").trim();
  return sortedSlots.filter((s) => String(s.flatplan_publication_article_id ?? "").trim() !== id);
}

/** Index in the reduced list where a new block would start (0 … length). */
export function insertBeforeIndexForDrop(
  sortedSlots: SlotRow[],
  drag: FlatplanArticleDragPayload,
  target: FlatplanArticleDropTarget
): number {
  const reduced = sortedSlotsExcludingArticle(sortedSlots, drag.publicationArticleId);
  const idx = reduced.findIndex((s) => flatplanEntryKeyFromSlot(s) === target.entryKey);
  if (idx < 0) return reduced.length;
  return target.side === "before" ? idx : idx + 1;
}

/**
 * Drop is invalid when it would place a block strictly between another article's first and last page.
 */
export function isDropInsideAnotherArticleBlock(
  sortedSlots: SlotRow[],
  drag: FlatplanArticleDragPayload,
  insertBeforeIdx: number
): boolean {
  const reduced = sortedSlotsExcludingArticle(sortedSlots, drag.publicationArticleId);
  for (const span of buildArticleBlockSpans(reduced)) {
    if (span.firstIdx >= span.lastIdx) continue;
    if (span.firstIdx < insertBeforeIdx && insertBeforeIdx <= span.lastIdx) {
      return true;
    }
  }
  return false;
}

function slotForEntryKey(sortedSlots: SlotRow[], entryKey: string): SlotRow | undefined {
  return sortedSlots.find((s) => flatplanEntryKeyFromSlot(s) === entryKey);
}

export function canDropArticleOnGutter(
  sortedSlots: SlotRow[],
  drag: FlatplanArticleDragPayload | null,
  target: FlatplanArticleDropTarget | null
): boolean {
  if (!drag || !target) return false;
  if (target.entryKey === drag.entryKey) return false;
  const targetSlot = slotForEntryKey(sortedSlots, target.entryKey);
  if (
    targetSlot &&
    String(targetSlot.flatplan_publication_article_id ?? "").trim() === drag.publicationArticleId
  ) {
    return false;
  }
  const insertBeforeIdx = insertBeforeIndexForDrop(sortedSlots, drag, target);
  if (isDropInsideAnotherArticleBlock(sortedSlots, drag, insertBeforeIdx)) {
    return false;
  }
  return true;
}
