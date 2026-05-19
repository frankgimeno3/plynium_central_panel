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

export function parseArticleBuilderPageParam(raw: string): {
  slotId: number | null;
  /** @deprecated Same as slotId; legacy URLs used `slotId-slotContentId`. */
  slotContentId: number | null;
} {
  const parts = String(raw ?? "").split("-");
  const primary = Number(parts[0]);
  const legacy = Number(parts[1]);
  const slotId =
    Number.isFinite(primary) && primary > 0
      ? primary
      : Number.isFinite(legacy) && legacy > 0
        ? legacy
        : null;
  return { slotId, slotContentId: slotId };
}

export function formatArticleBuilderPageParam(slotId: number, _legacySlotContentId?: number | null): string {
  return String(slotId);
}

export type ArticleBuilderTab = "general" | "editor";
export type ArticleBuilderGeneralSection = "pages-manager" | "original";

export function articleBuilderHref(
  publicationId: string,
  publicationArticleId: string,
  options?: {
    tab?: ArticleBuilderTab;
    page?: string;
    section?: ArticleBuilderGeneralSection;
  }
): string {
  const base = `/logged/pages/production/publications/issues/${encodeURIComponent(
    publicationId
  )}/article_builder/${encodeURIComponent(publicationArticleId)}`;
  if (!options?.tab && !options?.page && !options?.section) return base;
  const params = new URLSearchParams();
  if (options.tab) params.set("tab", options.tab);
  if (options.page) params.set("page", options.page);
  if (options.section) params.set("section", options.section);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/** Opens the per-page chunk editor inside Article Builder (replaces legacy magazine subpage). */
export function publicationArticleEditorPageHref(
  publicationId: string,
  publicationArticleId: string,
  slotId: number,
  _legacySlotContentId?: number | null
): string {
  return articleBuilderHref(publicationId, publicationArticleId, {
    tab: "editor",
    page: formatArticleBuilderPageParam(slotId),
  });
}

/** @deprecated Use publicationArticleEditorPageHref */
export function publicationArticleSubpageHref(
  publicationId: string,
  publicationArticleId: string,
  slotId: number,
  slotContentId: number | null
): string {
  return publicationArticleEditorPageHref(
    publicationId,
    publicationArticleId,
    slotId,
    slotContentId
  );
}
