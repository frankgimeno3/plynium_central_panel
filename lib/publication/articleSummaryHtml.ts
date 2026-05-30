import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { normalizeSlotContentType } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { formatAdvertSlotPageDisplay } from "@/lib/publication/advertiserIndexHtml";

export type ArticleSummaryPageRef = {
  publication_slot_id: number;
  publication_page: number | null;
  slot_key: string;
};

export type ArticleSummarySourceRow = {
  /** Stable key for titles / HTML (`pa:…`, `aid:…`, or `slot:…`). */
  summary_entry_id: string;
  /** First page slot (links, legacy HTML). */
  publication_slot_id: number;
  publication_pages: ArticleSummaryPageRef[];
  article_title: string;
  slot_key: string;
  article_id?: string | null;
  publication_article_id?: string | null;
  slot_flatplan_image_url?: string | null;
};

type PerSlotArticleSummaryRow = {
  publication_slot_id: number;
  publication_page: number | null;
  article_title: string;
  slot_key: string;
  article_id?: string | null;
  publication_article_id?: string | null;
  slot_flatplan_image_url?: string | null;
};

/** Default card title in the summary (matches preview before manual edits). */
export function defaultArticleSummaryEntryTitle(
  row: Pick<ArticleSummarySourceRow, "article_title" | "slot_key" | "publication_slot_id">
): string {
  const title = String(row.article_title ?? "").trim();
  return title || `(${row.slot_key} #${row.publication_slot_id})`;
}

export function articleSummaryEntryIdFromParts(
  publicationArticleId: string | null | undefined,
  articleId: string | null | undefined,
  primarySlotId: number
): string {
  const pa = String(publicationArticleId ?? "").trim();
  if (pa) return `pa:${pa}`;
  const aid = String(articleId ?? "").trim();
  if (aid) return `aid:${aid}`;
  return `slot:${primarySlotId}`;
}

function comparePerSlotRowsByPage(a: PerSlotArticleSummaryRow, b: PerSlotArticleSummaryRow): number {
  const ap = a.publication_page == null ? Number.POSITIVE_INFINITY : a.publication_page;
  const bp = b.publication_page == null ? Number.POSITIVE_INFINITY : b.publication_page;
  if (ap !== bp) return ap - bp;
  return a.publication_slot_id - b.publication_slot_id;
}

function compareSummaryRowsByFirstPage(
  a: Pick<ArticleSummarySourceRow, "publication_pages">,
  b: Pick<ArticleSummarySourceRow, "publication_pages">
): number {
  const ap = a.publication_pages[0]?.publication_page;
  const bp = b.publication_pages[0]?.publication_page;
  const aPage = ap == null ? Number.POSITIVE_INFINITY : ap;
  const bPage = bp == null ? Number.POSITIVE_INFINITY : bp;
  if (aPage !== bPage) return aPage - bPage;
  return (a.publication_pages[0]?.publication_slot_id ?? 0) - (b.publication_pages[0]?.publication_slot_id ?? 0);
}

function pickGroupedArticleTitle(slots: readonly PerSlotArticleSummaryRow[]): string {
  for (const row of slots) {
    const title = String(row.article_title ?? "").trim();
    if (title) return title;
  }
  const primary = slots[0];
  return primary
    ? defaultArticleSummaryEntryTitle({
        article_title: primary.article_title,
        slot_key: primary.slot_key,
        publication_slot_id: primary.publication_slot_id,
      })
    : "";
}

function groupPerSlotArticleRows(rows: readonly PerSlotArticleSummaryRow[]): ArticleSummarySourceRow[] {
  const usedSlotIds = new Set<number>();
  const grouped: ArticleSummarySourceRow[] = [];

  const byPublicationArticleId = new Map<string, PerSlotArticleSummaryRow[]>();
  for (const row of rows) {
    const paId = String(row.publication_article_id ?? "").trim();
    if (!paId) continue;
    const list = byPublicationArticleId.get(paId) ?? [];
    list.push(row);
    byPublicationArticleId.set(paId, list);
  }

  for (const [paId, list] of byPublicationArticleId) {
    const sorted = [...list].sort(comparePerSlotRowsByPage);
    for (const r of sorted) usedSlotIds.add(r.publication_slot_id);
    const primary = sorted[0];
    grouped.push({
      summary_entry_id: `pa:${paId}`,
      publication_slot_id: primary.publication_slot_id,
      publication_pages: sorted.map((r) => ({
        publication_slot_id: r.publication_slot_id,
        publication_page: r.publication_page,
        slot_key: r.slot_key,
      })),
      article_title: pickGroupedArticleTitle(sorted),
      slot_key: primary.slot_key,
      article_id: primary.article_id ?? null,
      publication_article_id: paId,
      slot_flatplan_image_url: primary.slot_flatplan_image_url ?? null,
    });
  }

  const remainingAfterPa = rows.filter((r) => !usedSlotIds.has(r.publication_slot_id));
  const byPortalArticleId = new Map<string, PerSlotArticleSummaryRow[]>();
  for (const row of remainingAfterPa) {
    const aid = String(row.article_id ?? "").trim();
    if (!aid) continue;
    const list = byPortalArticleId.get(aid) ?? [];
    list.push(row);
    byPortalArticleId.set(aid, list);
  }

  for (const [aid, list] of byPortalArticleId) {
    if (list.length < 2) continue;
    const sorted = [...list].sort(comparePerSlotRowsByPage);
    for (const r of sorted) usedSlotIds.add(r.publication_slot_id);
    const primary = sorted[0];
    grouped.push({
      summary_entry_id: `aid:${aid}`,
      publication_slot_id: primary.publication_slot_id,
      publication_pages: sorted.map((r) => ({
        publication_slot_id: r.publication_slot_id,
        publication_page: r.publication_page,
        slot_key: r.slot_key,
      })),
      article_title: pickGroupedArticleTitle(sorted),
      slot_key: primary.slot_key,
      article_id: aid,
      publication_article_id: null,
      slot_flatplan_image_url: primary.slot_flatplan_image_url ?? null,
    });
  }

  for (const row of rows) {
    if (usedSlotIds.has(row.publication_slot_id)) continue;
    grouped.push({
      summary_entry_id: `slot:${row.publication_slot_id}`,
      publication_slot_id: row.publication_slot_id,
      publication_pages: [
        {
          publication_slot_id: row.publication_slot_id,
          publication_page: row.publication_page,
          slot_key: row.slot_key,
        },
      ],
      article_title: pickGroupedArticleTitle([row]),
      slot_key: row.slot_key,
      article_id: row.article_id ?? null,
      publication_article_id: row.publication_article_id ?? null,
      slot_flatplan_image_url: row.slot_flatplan_image_url ?? null,
    });
  }

  grouped.sort(compareSummaryRowsByFirstPage);
  return grouped;
}

export function resolveArticleSummaryTitleFromParsed(
  row: ArticleSummarySourceRow,
  parsed: Readonly<Record<string, string>>
): string | undefined {
  if (parsed[row.summary_entry_id] !== undefined) {
    return parsed[row.summary_entry_id];
  }
  for (const page of row.publication_pages) {
    const legacy = parsed[String(page.publication_slot_id)];
    if (legacy !== undefined) return legacy;
  }
  return undefined;
}

export function mergeArticleRowsWithDisplayTitles(
  rows: readonly ArticleSummarySourceRow[],
  titlesByEntryId: Readonly<Record<string, string>>
): ArticleSummarySourceRow[] {
  return rows.map((row) => {
    const custom = titlesByEntryId[row.summary_entry_id];
    const title =
      custom !== undefined ? String(custom) : defaultArticleSummaryEntryTitle(row);
    return { ...row, article_title: title };
  });
}

function decodeArticleSummaryTitleHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Restore per-article titles from saved summary HTML (entry id or legacy slot id). */
export function parseArticleTitlesFromSummaryHtml(html: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!html.trim()) return out;

  const entryRe =
    /<li[^>]*class="article-summary__card"[^>]*data-summary-entry-id="([^"]+)"[^>]*>[\s\S]*?<p class="article-summary__card-name">([^<]*)<\/p>/gi;
  let entryMatch: RegExpExecArray | null;
  while ((entryMatch = entryRe.exec(html)) !== null) {
    const id = String(entryMatch[1] ?? "").trim();
    if (!id) continue;
    out[id] = decodeArticleSummaryTitleHtml(entryMatch[2]);
  }

  const cardRe =
    /<li[^>]*class="article-summary__card"[^>]*data-slot-id="(\d+)"[^>]*>[\s\S]*?<p class="article-summary__card-name">([^<]*)<\/p>/gi;
  let cardMatch: RegExpExecArray | null;
  while ((cardMatch = cardRe.exec(html)) !== null) {
    const id = Number(cardMatch[1]);
    if (!Number.isInteger(id) || id <= 0) continue;
    const key = String(id);
    if (out[key] === undefined) {
      out[key] = decodeArticleSummaryTitleHtml(cardMatch[2]);
    }
  }
  return out;
}

const ARTICLE_SLOT_KEYS_INCLUDED = new Set([
  "cover",
  "inside_cover",
  "preferential_page",
  "regular_page",
  "end",
]);

export function isArticleSummaryHtml(value: string | null | undefined): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  if (s === "2_col_article" || s === "3_col_article") return false;
  return s.includes("article-summary") || s.startsWith("<");
}

function collectPerSlotArticleRows(slots: readonly SlotRow[]): PerSlotArticleSummaryRow[] {
  const rows: PerSlotArticleSummaryRow[] = [];
  for (const slot of slots) {
    const slotKey = String(slot.slot_key ?? "").trim().toLowerCase();
    if (!ARTICLE_SLOT_KEYS_INCLUDED.has(slotKey)) continue;
    if (normalizeSlotContentType(slot.slot_content_type) !== "article") continue;
    if (String(slot.slot_state ?? "").trim().toLowerCase() === "padding") continue;

    const pageRaw = slot.publication_page;
    const publication_page =
      pageRaw != null && Number.isFinite(Number(pageRaw)) ? Math.round(Number(pageRaw)) : null;

    const titleFromEnrich =
      String(slot.flatplan_publication_art_name ?? "").trim() ||
      String(slot.flatplan_article_title ?? "").trim();
    const title =
      titleFromEnrich ||
      String(slot.slot_article_id ?? "").trim() ||
      `(${slotKey} #${slot.publication_slot_id})`;

    const flatplanUrl = String(slot.slot_flatplan_image_url ?? "").trim();
    rows.push({
      publication_slot_id: slot.publication_slot_id,
      publication_page,
      article_title: title,
      slot_key: slotKey,
      article_id: slot.slot_article_id ?? null,
      publication_article_id: slot.flatplan_publication_article_id ?? null,
      slot_flatplan_image_url: flatplanUrl || null,
    });
  }

  rows.sort((a, b) => {
    const ap = a.publication_page == null ? Number.POSITIVE_INFINITY : a.publication_page;
    const bp = b.publication_page == null ? Number.POSITIVE_INFINITY : b.publication_page;
    if (ap !== bp) return ap - bp;
    return a.publication_slot_id - b.publication_slot_id;
  });

  return rows;
}

/** One row per publication article (multi-page spreads grouped). */
export function collectArticleSlotsForSummaryListing(
  slots: readonly SlotRow[]
): ArticleSummarySourceRow[] {
  return groupPerSlotArticleRows(collectPerSlotArticleRows(slots));
}

function escapeHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type ArticleSummaryHtmlOptions = {
  editionName?: string;
  headerDomain?: string;
  publicationTheme?: string;
  specialEditionSubtitle?: string;
  magazineFooterPageNumber?: string | null;
};

function normalizeArticleSummaryOptions(
  editionNameOrOptions?: string | ArticleSummaryHtmlOptions
): ArticleSummaryHtmlOptions {
  if (typeof editionNameOrOptions === "string") {
    return { editionName: editionNameOrOptions };
  }
  return editionNameOrOptions ?? {};
}

function buildArticleSummaryPageTagsHtml(
  pages: readonly ArticleSummaryPageRef[]
): string {
  return pages
    .map((p) => {
      const pageLabel = formatAdvertSlotPageDisplay(p.publication_page, p.slot_key);
      return `<span class="article-summary__page-tag" data-slot-id="${p.publication_slot_id}">${escapeHtml(pageLabel)}</span>`;
    })
    .join("");
}

export function buildArticleSummaryHtml(
  rows: readonly ArticleSummarySourceRow[],
  editionNameOrOptions?: string | ArticleSummaryHtmlOptions
): string {
  const options = normalizeArticleSummaryOptions(editionNameOrOptions);
  const edition = String(options.editionName ?? "").trim();
  const headerDomain = String(options.headerDomain ?? "glassinformer.com").trim() || "glassinformer.com";
  const tagline =
    String(options.publicationTheme ?? "").trim() ||
    "Bimonthly publication covering the global glass industry";
  const specialLine = String(options.specialEditionSubtitle ?? "").trim();

  const cards = rows
    .map((r) => {
      const name = escapeHtml(r.article_title || `(${r.slot_key} #${r.publication_slot_id})`);
      const entryId = escapeHtml(r.summary_entry_id);
      const primarySlotId = r.publication_slot_id;
      const pageTags = buildArticleSummaryPageTagsHtml(r.publication_pages);
      return `<li class="article-summary__card" data-summary-entry-id="${entryId}" data-slot-id="${primarySlotId}"><p class="article-summary__card-name">${name}</p><div class="article-summary__page-tags">${pageTags}</div></li>`;
    })
    .join("\n");

  const editionMeta = edition
    ? `${escapeHtml(edition)} · ${rows.length} article${rows.length === 1 ? "" : "s"}`
    : `${rows.length} article${rows.length === 1 ? "" : "s"}`;

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
