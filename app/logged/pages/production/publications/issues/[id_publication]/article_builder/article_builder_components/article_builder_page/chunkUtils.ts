import { NON_DELETABLE_CHUNK_FORMATS } from "./constants";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { PublicationArticleChunk } from "./types";

export function isTitleOrSubtitleChunkFormat(fmt: string): boolean {
  return NON_DELETABLE_CHUNK_FORMATS.has(String(fmt ?? "").toLowerCase());
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
