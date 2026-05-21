export const CHUNK_FORMATS = ["title", "subtitle", "only_text"] as const;

export type ChunkFormat = (typeof CHUNK_FORMATS)[number];

export { MAGAZINE_PAGE_LAYOUT_OPTIONS as PAGE_FORMAT_OPTIONS } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";

export type PublicationArticleRow = {
  publication_article_id: string;
  publication_id: string;
  article_id: string;
  publication_slots_id_array: number[];
  desired_page_count: number;
};

export type PublicationArticleChunk = {
  publication_article_chunk_id: string;
  publication_article_id: string;
  publication_id: string;
  publication_slot_id: number | null;
  /** @deprecated use publication_slot_id */
  publication_slot_content_id?: number | null;
  publication_article_chunk_format: ChunkFormat;
  chunk_html: string;
  chunk_position: number;
  original_article_content_id: string | null;
  chunk_area_array?: string[];
  chunk_image_caption?: string;
};
