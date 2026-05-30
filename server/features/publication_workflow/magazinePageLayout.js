/** @typedef {"2_col_article" | "3_col_article"} MagazinePageLayout */

export const MAGAZINE_PAGE_LAYOUTS = ["2_col_article", "3_col_article"];

export const DEFAULT_MAGAZINE_PAGE_LAYOUT = "2_col_article";

/**
 * @param {unknown} value
 * @returns {MagazinePageLayout}
 */
export function normalizeMagazinePageLayout(value) {
    const s = String(value ?? "").trim();
    return s === "3_col_article" ? "3_col_article" : "2_col_article";
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAdvertiserIndexHtmlLayout(value) {
    const s = String(value ?? "").trim();
    if (!s) return false;
    if (s === "2_col_article" || s === "3_col_article") return false;
    return s.includes("advertiser-index") || s.startsWith("<");
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isArticleSummaryHtmlLayout(value) {
    const s = String(value ?? "").trim();
    if (!s) return false;
    if (s === "2_col_article" || s === "3_col_article") return false;
    return s.includes("article-summary") || s.startsWith("<");
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isMagazineListPageHtmlLayout(value) {
    return isAdvertiserIndexHtmlLayout(value) || isArticleSummaryHtmlLayout(value);
}

/**
 * @param {unknown} slotContentType
 * @param {unknown} rawLayout
 * @returns {string}
 */
export function formatMagazinePageLayoutForApi(slotContentType, rawLayout) {
    const t = String(slotContentType ?? "").trim().toLowerCase();
    if (t === "index" && isAdvertiserIndexHtmlLayout(rawLayout)) {
        return String(rawLayout ?? "");
    }
    if (t === "summary" && isArticleSummaryHtmlLayout(rawLayout)) {
        return String(rawLayout ?? "");
    }
    return normalizeMagazinePageLayout(rawLayout);
}

/**
 * @param {unknown} obj
 */
function isLayoutMetaEntry(obj) {
    return Boolean(obj && typeof obj === "object" && obj._meta === true);
}

/**
 * @param {unknown} arr
 * @returns {MagazinePageLayout}
 */
export function readMagazinePageLayoutFromObjectArray(arr) {
    if (!Array.isArray(arr)) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
    const meta = arr.find(isLayoutMetaEntry);
    return normalizeMagazinePageLayout(meta?.magazine_page_layout);
}

/**
 * @param {unknown} arr
 * @returns {unknown[]}
 */
export function stripMagazineLayoutMetaFromObjectArray(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter((o) => !isLayoutMetaEntry(o));
}

/**
 * @param {unknown} arr
 * @param {MagazinePageLayout} layout
 * @returns {unknown[]}
 */
export function withMagazinePageLayoutMeta(arr, layout) {
    const entries = stripMagazineLayoutMetaFromObjectArray(arr);
    return [{ _meta: true, magazine_page_layout: layout }, ...entries];
}
