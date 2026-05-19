import type { MoveContentTypePreferentialRow } from "./types";

/**
 * True when the preferential slot row has real content that should block a blind
 * move of summary/index (uploaded media, customer, project, or article link).
 */
export function preferentialSlotHasOccupyingContent(
  slot: MoveContentTypePreferentialRow | undefined | null
): boolean {
  if (!slot) return false;
  const media = String(slot.slot_media_url ?? "").trim();
  if (media.length > 0) return true;
  const customer = String(slot.slot_customer_id ?? "").trim();
  if (customer.length > 0) return true;
  const project = String(slot.slot_project_id ?? "").trim();
  if (project.length > 0) return true;
  const article = String(slot.slot_article_id ?? "").trim();
  if (article.length > 0) return true;
  return false;
}

export function preferentialSlotHasUploadedMedia(
  slot: MoveContentTypePreferentialRow | undefined | null
): boolean {
  return String(slot?.slot_media_url ?? "").trim().length > 0;
}
