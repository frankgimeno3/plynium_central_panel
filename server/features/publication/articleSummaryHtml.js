/**
 * HTML for the in-magazine article summary (stored on the summary slot's
 * `publication_slots_db.magazine_page_layout`).
 */

import { formatAdvertSlotPageDisplay } from "./advertiserIndexHtml.js";

/**
 * @param {Array<{ articleTitle?: string, page?: number | null, slotKey?: string, slotId?: number }>} rows
 * @param {{
 *   editionName?: string,
 *   headerDomain?: string,
 *   publicationTheme?: string,
 *   specialEditionSubtitle?: string,
 * }} [options]
 * @returns {string}
 */
export function buildArticleSummaryHtml(rows, options = {}) {
    const edition = String(options.editionName ?? "").trim();
    const headerDomain = String(options.headerDomain ?? "glassinformer.com").trim() || "glassinformer.com";
    const tagline =
        String(options.publicationTheme ?? "").trim() ||
        "Bimonthly publication covering the global glass industry";
    const specialLine = String(options.specialEditionSubtitle ?? "").trim();
    const safeRows = Array.isArray(rows) ? rows : [];

    const cards = safeRows
        .map((r) => {
            const title = String(r.articleTitle ?? "").trim();
            const label = title
                ? escapeHtml(title)
                : escapeHtml(`(${String(r.slotKey ?? "article").trim() || "article"} #${r.slotId ?? "?"})`);
            const entryId = escapeHtml(
                String(r.summaryEntryId ?? "").trim() || `slot:${r.slotId ?? 0}`
            );
            const primarySlotId = r.slotId != null ? Number(r.slotId) : 0;
            const pages = Array.isArray(r.pages) && r.pages.length > 0
                ? r.pages
                : [
                      {
                          slotId: primarySlotId,
                          page: r.page,
                          slotKey: String(r.slotKey ?? ""),
                      },
                  ];
            const pageTags = pages
                .map((p) => {
                    const pageLabel = formatAdvertSlotPageDisplay(
                        p.page != null && Number.isFinite(Number(p.page))
                            ? Math.round(Number(p.page))
                            : null,
                        String(p.slotKey ?? "")
                    );
                    const tagSlotId = p.slotId != null ? Number(p.slotId) : 0;
                    return `<span class="article-summary__page-tag" data-slot-id="${tagSlotId}">${escapeHtml(pageLabel)}</span>`;
                })
                .join("");
            return `<li class="article-summary__card" data-summary-entry-id="${entryId}" data-slot-id="${primarySlotId}"><p class="article-summary__card-name">${label}</p><div class="article-summary__page-tags">${pageTags}</div></li>`;
        })
        .join("\n");

    const editionMeta = edition
        ? `${escapeHtml(edition)} · ${safeRows.length} article${safeRows.length === 1 ? "" : "s"}`
        : `${safeRows.length} article${safeRows.length === 1 ? "" : "s"}`;

    const specialEditionHtml = specialLine
        ? `<p class="article-summary__spine-line article-summary__spine-line--accent">${escapeHtml(specialLine)}</p>`
        : "";

    const cardsBlock = cards
        ? `<ul class="article-summary__cards">\n${cards}\n</ul>`
        : `<p class="article-summary__empty">No articles have been assigned to this publication yet.</p>`;

    const footerPage = String(options.magazineFooterPageNumber ?? "").trim();
    const footerPageHtml = footerPage
        ? `<span class="article-summary__footer-page">${escapeHtml(footerPage)}</span>`
        : `<span class="article-summary__footer-meta">${editionMeta}</span>`;

    return `<div class="article-summary" data-component="article-summary">
<style>
.article-summary{--gi-blue:#1e6fd9;box-sizing:border-box;min-height:100%;height:100%;display:flex;flex-direction:column;font-family:Georgia,"Times New Roman",serif;color:#111827;background:#f1f5f9;}
.article-summary__masthead{position:relative;flex:0 0 auto;background:#000;color:#fff;padding:.5rem .55rem;overflow:hidden;}
.article-summary__masthead-glow{position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(59,130,246,.38),transparent 52%);pointer-events:none;}
.article-summary__masthead-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:2.5rem;padding:0 .25rem;}
.article-summary__masthead-brand{margin:0;font:900 1.2rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:-.02em;text-transform:uppercase;white-space:nowrap;}
.article-summary__brand-glass{color:var(--gi-blue);}
.article-summary__brand-informer{color:#f1f5f9;}
.article-summary__masthead-tagline{margin:.18rem 0 0;font:600 .4rem/1.2 "Helvetica Neue",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.72);text-align:center;max-width:100%;}
.article-summary__sheet{flex:1 1 auto;display:flex;min-height:0;background:#fff;border-top:2px solid #111;}
.article-summary__spine{flex:0 0 1.15rem;width:1.15rem;border-right:1px solid #e5e7eb;background:#fafafa;display:flex;align-items:center;justify-content:center;padding:.35rem 0;overflow:hidden;}
.article-summary__spine-inner{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;transform:rotate(-90deg);transform-origin:center center;white-space:nowrap;}
.article-summary__spine-line{margin:0;font:600 .44rem/1.2 "Helvetica Neue",Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#6b7280;}
.article-summary__spine-line--domain{color:#374151;font-weight:700;}
.article-summary__spine-line--accent{font-style:italic;color:#b45309;letter-spacing:.06em;text-transform:none;max-width:14rem;overflow:hidden;text-overflow:ellipsis;}
.article-summary__main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;min-height:0;}
.article-summary__topbar{flex:0 0 auto;padding:.45rem .5rem .35rem;border-bottom:2px solid #111827;background:linear-gradient(180deg,#fff 0%,#f8fafc 100%);}
.article-summary__topbar-title{margin:0;font:700 .95rem/1.1 Georgia,"Times New Roman",serif;letter-spacing:.02em;color:#111827;}
.article-summary__topbar-meta{margin:.14rem 0 0;font:500 .46rem/1.3 "Helvetica Neue",Arial,sans-serif;color:#6b7280;letter-spacing:.04em;}
.article-summary__body{flex:1 1 auto;min-height:0;overflow:auto;padding:.4rem .45rem .35rem;}
.article-summary__cards{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.32rem;}
.article-summary__card{margin:0;padding:.32rem .38rem;border:1px solid #e5e7eb;border-radius:.28rem;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.06);}
.article-summary__card-name{margin:0 0 .22rem;font:600 .58rem/1.25 Georgia,"Times New Roman",serif;color:#111827;}
.article-summary__page-tags{display:flex;flex-wrap:wrap;gap:.18rem;}
.article-summary__page-tag{display:inline-block;padding:.1rem .28rem;border-radius:9999px;background:#ecfdf5;border:1px solid #a7f3d0;font:700 .44rem/1.15 "Helvetica Neue",Arial,sans-serif;letter-spacing:.03em;color:#047857;white-space:nowrap;}
.article-summary__empty{margin:0;font-size:.56rem;color:#6b7280;font-style:italic;}
.article-summary__footer{flex:0 0 auto;display:flex;justify-content:space-between;align-items:center;padding:.26rem .5rem;border-top:1px solid #e5e7eb;background:#fff;font:600 .42rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;}
.article-summary__footer-meta{font:inherit;color:inherit;}
.article-summary__footer-page{font:700 .85rem/1 "Helvetica Neue",Arial,sans-serif;letter-spacing:.02em;text-transform:none;color:#111827;}
</style>
<header class="article-summary__masthead">
<div class="article-summary__masthead-glow" aria-hidden="true"></div>
<div class="article-summary__masthead-inner">
<p class="article-summary__masthead-brand"><span class="article-summary__brand-glass">Glass</span><span class="article-summary__brand-informer">Informer</span></p>
<p class="article-summary__masthead-tagline">${escapeHtml(tagline)}</p>
</div>
</header>
<div class="article-summary__sheet">
<aside class="article-summary__spine" aria-hidden="true">
<div class="article-summary__spine-inner">
<p class="article-summary__spine-line article-summary__spine-line--domain">${escapeHtml(headerDomain)}</p>
<p class="article-summary__spine-line">${escapeHtml(tagline)}</p>
${specialEditionHtml}
</div>
</aside>
<section class="article-summary__main">
<header class="article-summary__topbar">
<h1 class="article-summary__topbar-title">Article summary</h1>
<p class="article-summary__topbar-meta">${editionMeta}</p>
</header>
<div class="article-summary__body">
${cardsBlock}
</div>
</section>
</div>
<footer class="article-summary__footer">
<span>Glass Informer</span>
${footerPageHtml}
</footer>
</div>`;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isArticleSummaryHtml(value) {
    const s = String(value ?? "").trim();
    if (!s) return false;
    if (s === "2_col_article" || s === "3_col_article") return false;
    return s.includes("article-summary") || s.startsWith("<");
}

function escapeHtml(raw) {
    return String(raw ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
