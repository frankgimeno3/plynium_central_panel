import { NON_DELETABLE_CHUNK_FORMATS } from "./constants";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { PublicationArticleChunk } from "./types";

export function isTitleOrSubtitleChunkFormat(fmt: string): boolean {
  return NON_DELETABLE_CHUNK_FORMATS.has(String(fmt ?? "").toLowerCase());
}

function defaultChunkPageWeightForFormat(format: string): number {
  const f = String(format ?? "only_text").trim().toLowerCase();
  if (f === "title" || f === "subtitle" || f === "only_text") return 15;
  if (f === "only_image") return 25;
  if (f === "text_image" || f === "image_text") return 20;
  return 15;
}

export function effectiveChunkPageWeight(chunk: PublicationArticleChunk): number {
  const n = Number(chunk.chunk_page_weight);
  if (Number.isFinite(n)) return Math.min(100, Math.max(1, Math.round(n)));
  return defaultChunkPageWeightForFormat(chunk.publication_article_chunk_format);
}

/** Chunks from the first one whose cumulative weight exceeds 100 through the end of the page. */
export function chunkPageOverflowIds(pageChunks: PublicationArticleChunk[]): Set<string> {
  const sorted = [...pageChunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  let sum = 0;
  let breakAt = -1;
  for (let i = 0; i < sorted.length; i++) {
    sum += effectiveChunkPageWeight(sorted[i]);
    if (sum > 100) {
      breakAt = i;
      break;
    }
  }
  const ids = new Set<string>();
  if (breakAt >= 0) {
    for (let j = breakAt; j < sorted.length; j++) {
      ids.add(sorted[j].publication_article_chunk_id);
    }
  }
  return ids;
}

export function totalChunkPageWeight(pageChunks: PublicationArticleChunk[]): number {
  return pageChunks.reduce((acc, ch) => acc + effectiveChunkPageWeight(ch), 0);
}

/**
 * Dedupe portal-import duplicates that share the same `original_article_content_id`.
 */
export function dedupeChunksForDisplay(list: PublicationArticleChunk[]): PublicationArticleChunk[] {
  const sorted = [...list].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  const score = (x: PublicationArticleChunk) => {
    const assigned = chunkPublicationSlotId(x) != null ? 1 : 0;
    return assigned * 1e9 + x.chunk_position;
  };
  const byOrig = new Map<string, PublicationArticleChunk>();
  const withoutOrig: PublicationArticleChunk[] = [];
  for (const c of sorted) {
    const o = String(c.original_article_content_id ?? "").trim();
    if (!o) {
      withoutOrig.push(c);
      continue;
    }
    const prev = byOrig.get(o);
    if (!prev) {
      byOrig.set(o, c);
      continue;
    }
    const sc = score(c);
    const sp = score(prev);
    if (sc > sp || (sc === sp && c.publication_article_chunk_id < prev.publication_article_chunk_id)) {
      byOrig.set(o, c);
    }
  }
  return [...byOrig.values(), ...withoutOrig].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
}
