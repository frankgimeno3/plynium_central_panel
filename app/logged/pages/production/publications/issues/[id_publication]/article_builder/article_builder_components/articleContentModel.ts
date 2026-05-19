import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { isOverlayImageChunk } from "./article_image_manager/articleImagePlacement";
import {
  normalizePortalChunkHtmlForPreview,
  shouldOmitPortalBodyChunkFromFlow,
} from "./portalArticleChunkHtml";
import {
  extractBodyFlowChunks,
  normalizeChunkFormat,
  type FlowPublicationArticleChunk,
  type MagazineArticleFlowPageInput,
} from "./magazineArticleColumnFlow";
export type PublicationArticleChunkLike = FlowPublicationArticleChunk & {
  publication_article_chunk_id: string;
};

export function isEditableBodyTextChunk(chunk: FlowPublicationArticleChunk): boolean {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  if (fmt !== "only_text") return false;
  if (isOverlayImageChunk(chunk.chunk_html, chunk.publication_article_chunk_format)) return false;
  return !shouldOmitPortalBodyChunkFromFlow(chunk.chunk_html, chunk.publication_article_chunk_format);
}

/** Body HTML for editor/preview (converts legacy portal JSON blobs). */
export function normalizedBodyChunkHtml(chunk: FlowPublicationArticleChunk): string {
  return normalizePortalChunkHtmlForPreview(
    chunk.chunk_html,
    chunk.publication_article_chunk_format
  );
}

export function firstArticleSlotContentId(
  pages: MagazineArticleFlowPageInput[]
): number | null {
  const id = pages[0]?.slotContentId;
  return id != null && Number.isFinite(id) && id > 0 ? Number(id) : null;
}

export function findHeadingChunk(
  chunks: FlowPublicationArticleChunk[],
  format: "title" | "subtitle",
  preferredSlotId: number | null
): FlowPublicationArticleChunk | null {
  const matches = chunks.filter(
    (c) => normalizeChunkFormat(c.publication_article_chunk_format) === format
  );
  if (matches.length === 0) return null;
  if (preferredSlotId != null) {
    const onPage = matches.find((c) => chunkPublicationSlotId(c) === preferredSlotId);
    if (onPage) return onPage;
  }
  return matches.sort((a, b) => a.chunk_position - b.chunk_position)[0] ?? null;
}

/** All body text chunks in article page order (excludes title, subtitle, overlay images). */
export function collectArticleBodyTextChunks(
  pages: MagazineArticleFlowPageInput[]
): FlowPublicationArticleChunk[] {
  const out: FlowPublicationArticleChunk[] = [];
  for (const page of pages) {
    for (const chunk of extractBodyFlowChunks(page.chunks)) {
      if (isEditableBodyTextChunk(chunk)) {
        out.push(chunk);
      }
    }
  }
  return out;
}

export function aggregateArticleBodyHtml(
  pages: MagazineArticleFlowPageInput[]
): string {
  const parts = collectArticleBodyTextChunks(pages).map((c) => normalizedBodyChunkHtml(c).trim());
  return parts.filter(Boolean).join("");
}
