import { NON_DELETABLE_CHUNK_FORMATS } from "./constants";
import { normalizeAreaCodes } from "../article_image_manager/articleAreaCodes";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { PublicationArticleChunk } from "./types";

function primaryGridAreaCode(chunk: { chunk_area_array?: unknown }): string | null {
  const areas = normalizeAreaCodes(chunk.chunk_area_array);
  return areas[0] ?? null;
}

function chunkHtmlTextLength(chunk: { chunk_html?: string }): number {
  return String(chunk.chunk_html ?? "").trim().length;
}

function isGridTextChunkFormat(fmt: string): boolean {
  const f = String(fmt ?? "").toLowerCase();
  return f === "only_text" || f === "text_image" || f === "image_text";
}

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

/**
 * Drops empty `only_text` duplicates that share slot + grid area when another row
 * in the same cell has content. Keeps all competing chunks with text so the UI
 * can show them in sub-columns.
 */
export function dedupeGridTextChunksBySlotAndArea(
  list: PublicationArticleChunk[]
): PublicationArticleChunk[] {
  const sorted = [...list].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  const keepIds = new Set<string>();
  const byKey = new Map<string, PublicationArticleChunk[]>();

  for (const chunk of sorted) {
    const fmt = String(chunk.publication_article_chunk_format ?? "").toLowerCase();
    if (!isGridTextChunkFormat(fmt)) {
      keepIds.add(chunk.publication_article_chunk_id);
      continue;
    }
    const sid = chunkPublicationSlotId(chunk);
    const area = primaryGridAreaCode(chunk);
    if (sid == null || !area) {
      keepIds.add(chunk.publication_article_chunk_id);
      continue;
    }
    const key = `${sid}|${area}`;
    const group = byKey.get(key) ?? [];
    group.push(chunk);
    byKey.set(key, group);
  }

  for (const group of byKey.values()) {
    const withContent = group.filter((c) => chunkHtmlTextLength(c) > 0);
    if (withContent.length >= 2) {
      for (const c of withContent) keepIds.add(c.publication_article_chunk_id);
      continue;
    }
    if (withContent.length === 1) {
      keepIds.add(withContent[0]!.publication_article_chunk_id);
      continue;
    }
    const best = group.reduce((a, b) =>
      chunkHtmlTextLength(b) > chunkHtmlTextLength(a) ||
      (chunkHtmlTextLength(b) === chunkHtmlTextLength(a) &&
        b.chunk_position > a.chunk_position)
        ? b
        : a
    );
    keepIds.add(best.publication_article_chunk_id);
  }

  return sorted.filter((c) => keepIds.has(c.publication_article_chunk_id));
}
