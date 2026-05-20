import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { normalizePortalChunkHtmlForPreview } from "./portalArticleChunkHtml";
import {
  normalizeChunkFormat,
  type FlowPublicationArticleChunk,
  type MagazineArticleFlowPageInput,
} from "./magazineArticleColumnFlow";

export type PublicationArticleChunkLike = FlowPublicationArticleChunk & {
  publication_article_chunk_id: string;
};

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
