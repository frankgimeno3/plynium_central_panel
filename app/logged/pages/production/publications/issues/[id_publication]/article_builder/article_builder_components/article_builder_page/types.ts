import type { MagazinePageLayout } from "../magazinePageLayout";
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
};

export type ArticleBuilderPageSummary = {
  index: number;
  publication_slot_id: number;
  publication_page: number | null;
  chunkIds: string[];
};

export type ChunkPageOption = {
  index: number;
  publication_slot_id: number;
  publication_page: number | null;
};

export type ArticleBuilderPageState = {
  idPublication: string;
  publicationArticleId: string;
  publicationArticle: PublicationArticleRow;
  articleMeta: ArticleMeta | null;
  chunks: PublicationArticleChunk[];
  pages: ArticleBuilderPageSummary[];
  pageOptions: ChunkPageOption[];
  magazinePageLayout: MagazinePageLayout;
  pageCountInput: number;
  actionMessage: string | null;
  actionError: string | null;
  syncing: boolean;
  articleStateSaving: boolean;
  pageFormatSaving: boolean;
  pendingPageFormat: MagazinePageLayout | null;
  busyChunkId: string | null;
  bulkChunkMoveBusy: boolean;
  deleteChunkModal: PublicationArticleChunk | null;
  portalArticleIdForOriginalTab: string | null;
  editorPageParam: string;
  editorPageIndex: number;
  canEditorPrev: boolean;
  canEditorNext: boolean;
};
