/** Minimal slot fields for the slot detail page header. */
export type SlotDetailTitleInput = {
  slot_key?: string | null;
  publication_page?: number | null;
  slot_content_type?: string | null;
  slot_state?: string | null;
};

function isPaddingSlot(slot: SlotDetailTitleInput | null | undefined): boolean {
  return String(slot?.slot_state ?? "").toLowerCase() === "padding";
}

function isPreferentialInteriorPublicationPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= 9;
}

function preferentialPublicationPageFromSlot(
  slot: Pick<SlotDetailTitleInput, "slot_key" | "publication_page">
): number | null {
  if (String(slot.slot_key ?? "").trim().toLowerCase() !== "preferential_page") return null;
  const n = Math.round(Number(slot.publication_page));
  return isPreferentialInteriorPublicationPage(n) ? n : null;
}

/**
 * Human title for the slot detail route (page header + breadcrumb).
 * Prefers reserved types (Index / Summary), structural keys (Cover …), then magazine page number.
 */
export function slotDetailPageTitle(slot: SlotDetailTitleInput): string {
  if (isPaddingSlot(slot)) return "Padding";

  const contentType = String(slot.slot_content_type ?? "").trim().toLowerCase();
  if (contentType === "index") return "Index";
  if (contentType === "summary") return "Summary";

  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End";

  const ppRaw = slot.publication_page;
  if (ppRaw != null && Number.isFinite(Number(ppRaw))) {
    const n = Math.round(Number(ppRaw));
    if (n === -1) return "Cover";
    if (n === 0) return "Inside cover";
    if (n > 0) return `Page ${n}`;
  }

  const pref = preferentialPublicationPageFromSlot(slot);
  if (pref != null) return `Page ${pref}`;

  if (k) {
    return k
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }
  return "Slot";
}
