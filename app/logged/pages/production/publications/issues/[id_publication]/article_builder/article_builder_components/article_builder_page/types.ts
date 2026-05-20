import type { PublicationArticleStateValue } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type ArticleMeta = {
  id_article: string;
  article_title: string;
  article_subtitle: string | null;
  article_main_image_url: string | null;
  article_date: string | null;
};

export type PublicationArticleRow = {
  publication_article_id: string;
  publication_id: string;
  article_id: string;
  publication_slots_id_array: number[];
  desired_page_count: number;
  publication_article_state?: PublicationArticleStateValue | string;
  publication_art_name?: string | null;
};

export type PublicationArticleChunk = {
  publication_article_chunk_id: string;
  publication_article_id: string;
  publication_id: string;
  publication_slot_id: number | null;
  /** @deprecated use publication_slot_id (migration 045) */
  publication_slot_content_id?: number | null;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
  chunk_page_weight?: number;
  original_article_content_id: string | null;
  /** Grid cells on the page body, e.g. ["a1", "b2"]. */
  chunk_area_array?: string[];
};
