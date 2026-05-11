export const CHUNK_FORMATS = [
  "title",
  "subtitle",
  "only_text",
  "only_image",
  "text_image",
  "image_text",
] as const;

export type ChunkFormat = (typeof CHUNK_FORMATS)[number];

export const PAGE_FORMAT_OPTIONS: { id: string; label: string; description: string }[] = [
  {
    id: "only_text",
    label: "Only text",
    description: "A page made entirely of text chunks (paragraphs, titles, subtitles).",
  },
  {
    id: "only_image",
    label: "Only image",
    description: "A page that is dominated by a single image.",
  },
  {
    id: "text_image",
    label: "Text left · Image right",
    description: "Two-column layout with text on the left, image on the right.",
  },
  {
    id: "image_text",
    label: "Image left · Text right",
    description: "Two-column layout with image on the left, text on the right.",
  },
];

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
  publication_slot_content_id: number | null;
  publication_article_chunk_format: ChunkFormat;
  chunk_html: string;
  chunk_position: number;
  original_article_content_id: string | null;
};

export type SubpagePageOption = {
  index: number;
  publication_slot_id: number;
};

export function parseSubpageId(raw: string): {
  slotId: number | null;
  slotContentId: number | null;
} {
  const parts = String(raw ?? "").split("-");
  const slotId = Number(parts[0]);
  const slotContentId = Number(parts[1]);
  return {
    slotId: Number.isFinite(slotId) && slotId > 0 ? slotId : null,
    slotContentId: Number.isFinite(slotContentId) && slotContentId > 0 ? slotContentId : null,
  };
}

export function articleBuilderHref(publicationId: string, publicationArticleId: string): string {
  return `/logged/pages/production/publications/${encodeURIComponent(
    publicationId
  )}/manager/article_builder/${encodeURIComponent(publicationArticleId)}`;
}

export function publicationArticleSubpageHref(
  publicationId: string,
  publicationArticleId: string,
  slotId: number,
  slotContentId: number | null
): string {
  const page =
    slotContentId != null && slotContentId > 0 ? `${slotId}-${slotContentId}` : String(slotId);
  const params = new URLSearchParams({
    issue: publicationId,
    item: publicationArticleId,
    page,
  });
  return `/logged/pages/production/publications/subpage?${params.toString()}`;
}
