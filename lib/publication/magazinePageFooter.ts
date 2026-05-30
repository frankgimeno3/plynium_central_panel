/** Whether the magazine page footer should show a numeric page (not cover / inside / end). */
export function shouldShowMagazinePageFooterNumber(
  slot: Pick<
    { slot_key?: string | null; publication_page?: number | null },
    "slot_key" | "publication_page"
  >
): boolean {
  const key = String(slot.slot_key ?? "").trim().toLowerCase();
  if (key === "cover" || key === "inside_cover" || key === "inside cover") return false;
  if (key === "end" || key === "end_page" || key === "end page") return false;
  const pp = slot.publication_page;
  if (pp == null || !Number.isFinite(Number(pp))) return false;
  const n = Math.round(Number(pp));
  if (n === -1 || n === 0) return false;
  return true;
}

/** Footer page label, e.g. `"11"`, or `null` when hidden (cover, inside, end). */
export function magazinePageFooterNumberLabel(
  slot: Pick<
    { slot_key?: string | null; publication_page?: number | null },
    "slot_key" | "publication_page"
  >
): string | null {
  if (!shouldShowMagazinePageFooterNumber(slot)) return null;
  return String(Math.round(Number(slot.publication_page)));
}
