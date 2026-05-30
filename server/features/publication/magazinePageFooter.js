/**
 * @param {{ slot_key?: string, publication_page?: number | null }} slot
 * @returns {boolean}
 */
export function shouldShowMagazinePageFooterNumber(slot) {
    const key = String(slot.slot_key ?? "").trim().toLowerCase();
    if (key === "cover" || key === "inside_cover" || key === "inside cover") return false;
    if (key === "end" || key === "end_page" || key === "end page") return false;
    const pp = slot.publication_page;
    if (pp == null || !Number.isFinite(Number(pp))) return false;
    const n = Math.round(Number(pp));
    if (n === -1 || n === 0) return false;
    return true;
}

/**
 * @param {{ slot_key?: string, publication_page?: number | null }} slot
 * @returns {string | null}
 */
export function footerPageNumberForSlot(slot) {
    if (!shouldShowMagazinePageFooterNumber(slot)) return null;
    return String(Math.round(Number(slot.publication_page)));
}
