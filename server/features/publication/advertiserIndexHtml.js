/**
 * HTML for the in-magazine advertiser index (stored on the index slot's
 * `publication_slots_db.magazine_page_layout`).
 */

/**
 * @param {number | null} publication_page
 * @param {string} slot_key
 * @returns {string}
 */
export function formatAdvertSlotPageDisplay(publication_page, slot_key) {
    const k = String(slot_key ?? "").trim().toLowerCase();
    if (publication_page === -1 || k === "cover") return "cover";
    if (publication_page === 0 || k === "inside_cover" || k === "inside cover") return "inside cover";
    if (k === "end" || k === "end_page" || k === "end page") {
        if (publication_page != null && publication_page > 0) return `${publication_page} (end)`;
        return "end";
    }
    if (k === "preferential_page" && publication_page != null && publication_page > 0) {
        return `${publication_page} (preferential)`;
    }
    if (publication_page != null && Number.isFinite(Number(publication_page))) {
        return String(Math.round(Number(publication_page)));
    }
    return "—";
}

/**
 * @param {Array<{ customerName?: string, page?: number | null, slotKey?: string, slotId?: number }>} rows
 * @returns {Array<{ displayName: string, pages: Array<{ slotId: number, pageLabel: string }>, slotIds: number[] }>}
 */
function groupAdvertIndexRowsByDisplayName(rows) {
    const orderKeys = [];
    const map = new Map();

    for (const r of rows) {
        const displayName = String(r.customerName ?? "").trim() || "—";
        const key = displayName.toLowerCase();
        const pageLabel = formatAdvertSlotPageDisplay(
            r.page != null && Number.isFinite(Number(r.page)) ? Math.round(Number(r.page)) : null,
            String(r.slotKey ?? "")
        );
        const slotId = r.slotId != null ? Number(r.slotId) : 0;
        const existing = map.get(key);
        if (existing) {
            existing.pages.push({ slotId, pageLabel });
            existing.slotIds.push(slotId);
        } else {
            map.set(key, {
                displayName,
                pages: [{ slotId, pageLabel }],
                slotIds: [slotId],
            });
            orderKeys.push(key);
        }
    }

    return orderKeys.map((k) => map.get(k));
}

/**
 * @param {Array<{ customerName?: string, page?: number | null, slotKey?: string, slotId?: number }>} rows
 * @param {{
 *   editionName?: string,
 *   headerDomain?: string,
 *   publicationTheme?: string,
 *   specialEditionSubtitle?: string,
 *   redBoxHeader?: string,
 *   redBoxBody?: string,
 * }} [options]
 * @returns {string}
 */
export function buildAdvertiserIndexHtml(rows, options = {}) {
    const edition = String(options.editionName ?? "").trim();
    const headerDomain = String(options.headerDomain ?? "glassinformer.com").trim() || "glassinformer.com";
    const tagline =
        String(options.publicationTheme ?? "").trim() ||
        "Bimonthly publication covering the global glass industry";
    const specialLine = String(options.specialEditionSubtitle ?? "").trim();
    const safeRows = Array.isArray(rows) ? rows : [];
    const groups = groupAdvertIndexRowsByDisplayName(safeRows);

    const cards = groups
        .map((group) => {
            const name = escapeHtml(group.displayName);
            const slotIdsAttr = group.slotIds.join(",");
            const pageTags = group.pages
                .map(
                    (p) =>
                        `<span class="advertiser-index__page-tag" data-slot-id="${p.slotId}">${escapeHtml(p.pageLabel)}</span>`
                )
                .join("");
            return `<li class="advertiser-index__card" data-slot-ids="${slotIdsAttr}"><p class="advertiser-index__card-name">${name}</p><div class="advertiser-index__page-tags">${pageTags}</div></li>`;
        })
        .join("\n");

    const editionMeta = edition
        ? `${escapeHtml(edition)} · ${safeRows.length} advert${safeRows.length === 1 ? "" : "s"}`
        : `${safeRows.length} advert${safeRows.length === 1 ? "" : "s"}`;

    const specialEditionHtml = specialLine
        ? `<p class="advertiser-index__spine-line advertiser-index__spine-line--accent">${escapeHtml(specialLine)}</p>`
        : "";

    const cardsBlock = cards
        ? `<ul class="advertiser-index__cards">\n${cards}\n</ul>`
        : `<p class="advertiser-index__empty">No adverts have been assigned to this publication yet.</p>`;

    const footerPage = String(options.magazineFooterPageNumber ?? "").trim();
    const footerPageHtml = footerPage
        ? `<span class="advertiser-index__footer-page">${escapeHtml(footerPage)}</span>`
        : `<span class="advertiser-index__footer-meta">${editionMeta}</span>`;

    return `<div class="advertiser-index" data-component="advertiser-index">
<style>
.advertiser-index{--gi-blue:#1e6fd9;box-sizing:border-box;min-height:100%;height:100%;display:flex;flex-direction:column;font-family:Georgia,"Times New Roman",serif;color:#111827;background:#f1f5f9;}
.advertiser-index__masthead{position:relative;flex:0 0 auto;background:#000;color:#fff;padding:.5rem .55rem;overflow:hidden;}
.advertiser-index__masthead-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(59,130,246,.38),transparent 52%);pointer-events:none;}
.advertiser-index__masthead-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:2.5rem;padding:0 .25rem;}
.advertiser-index__masthead-brand{margin:0;font:900 1.2rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:-.02em;text-transform:uppercase;white-space:nowrap;}
.advertiser-index__brand-glass{color:var(--gi-blue);}
.advertiser-index__brand-informer{color:#f1f5f9;}
.advertiser-index__masthead-tagline{margin:.18rem 0 0;font:600 .4rem/1.2 "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);text-align:center;max-width:100%;}
.advertiser-index__sheet{flex:1 1 auto;display:flex;min-height:0;background:#fff;border-top:2px solid #111;}
.advertiser-index__spine{flex:0 0 1.15rem;width:1.15rem;border-right:1px solid #e5e7eb;background:#fafafa;display:flex;align-items:center;justify-content:center;padding:.35rem 0;overflow:hidden;}
.advertiser-index__spine-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;transform:rotate(-90deg);transform-origin:center center;white-space:nowrap;}
.advertiser-index__spine-line{margin:0;font:600 .44rem/1.2 "Helvetica Neue",Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;}
.advertiser-index__spine-line--domain{color:#374151;font-weight:700;}
.advertiser-index__spine-line--accent{font-style:italic;color:#b45309;letter-spacing:.06em;text-transform:none;max-width:14rem;overflow:hidden;text-overflow:ellipsis;}
.advertiser-index__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;min-height:0;}
.advertiser-index__topbar{flex:0 0 auto;padding:.45rem .5rem .35rem;border-bottom:2px solid #111827;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);}
.advertiser-index__topbar-title{margin:0;font:700 .95rem/1.1 Georgia,"Times New Roman",serif;letter-spacing:.02em;color:#111827;}
.advertiser-index__topbar-meta{margin:.14rem 0 0;font:500 .46rem/1.3 "Helvetica Neue",Arial,sans-serif;color:#6b7280;letter-spacing:.04em;}
.advertiser-index__body{flex:1 1 auto;min-height:0;overflow:auto;padding:.4rem .45rem .35rem;}
.advertiser-index__cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.32rem;}
.advertiser-index__card{margin:0;padding:.32rem .38rem;border:1px solid #e5e7eb;border-radius:.28rem;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.06);}
.advertiser-index__card-name{margin:0 0 .22rem;font:600 .58rem/1.25 Georgia,"Times New Roman",serif;color:#111827;}
.advertiser-index__page-tags{display:flex;flex-wrap:wrap;gap:.18rem;}
.advertiser-index__page-tag{display:inline-block;padding:.1rem .28rem;border-radius:9999px;background:#eff6ff;border:1px solid #bfdbfe;font:700 .44rem/1.15 "Helvetica Neue",Arial,sans-serif;letter-spacing:.03em;color:#1e40af;white-space:nowrap;}
.advertiser-index__empty{margin:0;font-size:.56rem;color:#6b7280;font-style:italic;}
.advertiser-index__footer{flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;padding:.26rem .5rem;border-top:1px solid #e5e7eb;background:#fff;font:600 .42rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;}
.advertiser-index__footer-meta{font:inherit;color:inherit;}
.advertiser-index__footer-page{font:700 .85rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:.02em;text-transform:none;color:#111827;}
</style>
<header class="advertiser-index__masthead">
<div class="advertiser-index__masthead-glow" aria-hidden="true"></div>
<div class="advertiser-index__masthead-inner">
<p class="advertiser-index__masthead-brand"><span class="advertiser-index__brand-glass">Glass</span><span class="advertiser-index__brand-informer">Informer</span></p>
<p class="advertiser-index__masthead-tagline">${escapeHtml(tagline)}</p>
</div>
</header>
<div class="advertiser-index__sheet">
<aside class="advertiser-index__spine" aria-hidden="true">
<div class="advertiser-index__spine-inner">
<p class="advertiser-index__spine-line advertiser-index__spine-line--domain">${escapeHtml(headerDomain)}</p>
<p class="advertiser-index__spine-line">${escapeHtml(tagline)}</p>
${specialEditionHtml}
</div>
</aside>
<section class="advertiser-index__main">
<header class="advertiser-index__topbar">
<h1 class="advertiser-index__topbar-title">Advertisers index</h1>
<p class="advertiser-index__topbar-meta">${editionMeta}</p>
</header>
<div class="advertiser-index__body">
${cardsBlock}
</div>
</section>
</div>
<footer class="advertiser-index__footer">
<span>Glass Informer</span>
${footerPageHtml}
</footer>
</div>`;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isAdvertiserIndexHtml(value) {
    const s = String(value ?? "").trim();
    if (!s) return false;
    if (s === "2_col_article" || s === "3_col_article") return false;
    return s.includes("advertiser-index") || s.startsWith("<");
}

/**
 * @param {string} raw
 * @returns {string}
 */
function escapeHtml(raw) {
    return String(raw ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
