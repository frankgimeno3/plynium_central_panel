import type { MagazineChunkFormat } from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/MagazineArticleEditorChunkBody";
import { normalizeChunkFormat } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";

export function previewFormatForChunk(chunk: {
  publication_article_chunk_format: string;
  chunk_html: string;
}): MagazineChunkFormat {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  if (fmt === "title" || fmt === "subtitle" || fmt === "only_text") return fmt;
  if (fmt === "only_image") return "only_image";
  if (fmt === "text_image" || fmt === "image_text") return fmt;
  return "only_text";
}
