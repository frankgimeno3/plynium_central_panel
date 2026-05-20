export type PublicationArticleSlotLinkRow = {
  publication_article_id: string;
  article_id: string;
  publication_slots_id_array: number[];
};

/** Resolve the publication article row linked to a magazine slot (same rules as legacy slot article editor). */
export function findPublicationArticleForSlot(
  publicationArticles: PublicationArticleSlotLinkRow[],
  slotId: number,
  relatedArticleId: string | null
): PublicationArticleSlotLinkRow | null {
  if (!Number.isFinite(slotId) || slotId <= 0) return null;
  const bySlot = publicationArticles.find((item) =>
    item.publication_slots_id_array.some((id) => Number(id) === slotId)
  );
  if (bySlot) return bySlot;
  const aid = relatedArticleId?.trim();
  if (!aid) return null;
  return publicationArticles.find((item) => item.article_id === aid) ?? null;
}

export type ArticleBuilderTab = "general" | "editor";

export function articleBuilderHref(
  publicationId: string,
  publicationArticleId: string,
  options?: {
    tab?: ArticleBuilderTab;
  }
): string {
  const base = `/logged/pages/production/publications/issues/${encodeURIComponent(
    publicationId
  )}/article_builder/${encodeURIComponent(publicationArticleId)}`;
  if (!options?.tab) return base;
  const params = new URLSearchParams();
  params.set("tab", options.tab);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Opens the Article editor tab (read-only multi-page view) for this article. */
export function publicationArticleEditorHref(
  publicationId: string,
  publicationArticleId: string
): string {
  return articleBuilderHref(publicationId, publicationArticleId, { tab: "editor" });
}
