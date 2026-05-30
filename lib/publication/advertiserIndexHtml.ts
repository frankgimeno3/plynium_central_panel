import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { normalizeSlotContentType } from "@/app/logged/pages/production/publications/publication_components/_shared";

export type AdvertIndexSourceRow = {
  publication_slot_id: number;
  publication_page: number | null;
  company_shown_name: string;
  slot_key: string;
  slot_media_url: string | null;
};

const ADVERT_SLOT_KEYS_INCLUDED = new Set([
  "cover",
  "inside_cover",
  "preferential_page",
  "regular_page",
  "end",
]);

export function isAdvertiserIndexHtml(value: string | null | undefined): boolean {
  const s = String(value ?? "").trim();
  if (!s) return false;
  if (s === "2_col_article" || s === "3_col_article") return false;
  return s.includes("advertiser-index") || s.startsWith("<");
}

/** Human label for the magazine page line on advert index cards / generated HTML. */
/** Default left-column label in the index (matches preview before manual edits). */
export function defaultAdvertIndexEntryName(row: Pick<AdvertIndexSourceRow, "company_shown_name">): string {
  const company = String(row.company_shown_name ?? "").trim();
  return company || "—";
}

export function mergeAdvertRowsWithDisplayNames(
  rows: readonly AdvertIndexSourceRow[],
  namesBySlotId: Readonly<Record<number, string>>
): AdvertIndexSourceRow[] {
  return rows.map((row) => {
    const custom = namesBySlotId[row.publication_slot_id];
    const name =
      custom !== undefined ? String(custom) : defaultAdvertIndexEntryName(row);
    return { ...row, company_shown_name: name };
  });
}

export type AdvertIndexGroupedRow = {
  displayName: string;
  pages: { publication_slot_id: number; pageLabel: string }[];
  slotIds: number[];
};

/** Merge rows with the same display name (first flatplan occurrence); stack all pages on the right. */
export function groupAdvertIndexRowsByDisplayName(
  rows: readonly AdvertIndexSourceRow[]
): AdvertIndexGroupedRow[] {
  const orderKeys: string[] = [];
  const map = new Map<string, AdvertIndexGroupedRow>();

  for (const r of rows) {
    const displayName = String(r.company_shown_name ?? "").trim() || "—";
    const key = displayName.toLowerCase();
    const pageLabel = formatAdvertSlotPageDisplay(r.publication_page, r.slot_key);
    const existing = map.get(key);
    if (existing) {
      existing.pages.push({
        publication_slot_id: r.publication_slot_id,
        pageLabel,
      });
      existing.slotIds.push(r.publication_slot_id);
    } else {
      map.set(key, {
        displayName,
        pages: [{ publication_slot_id: r.publication_slot_id, pageLabel }],
        slotIds: [r.publication_slot_id],
      });
      orderKeys.push(key);
    }
  }

  return orderKeys.map((k) => map.get(k)!);
}

function decodeAdvertIndexNameHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

/** Restore per-slot names from saved index HTML (grouped or legacy one-row-per-slot). */
export function parseAdvertNamesFromIndexHtml(html: string): Record<number, string> {
  const out: Record<number, string> = {};
  if (!html.trim()) return out;

  const cardRe =
    /<li[^>]*class="advertiser-index__card"[^>]*data-slot-ids="([^"]+)"[^>]*>[\s\S]*?<p class="advertiser-index__card-name">([^<]*)<\/p>/gi;
  let cardMatch: RegExpExecArray | null;
  let groupedCount = 0;
  while ((cardMatch = cardRe.exec(html)) !== null) {
    const name = decodeAdvertIndexNameHtml(cardMatch[2]);
    const ids = cardMatch[1]
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    for (const id of ids) {
      out[id] = name;
    }
    groupedCount += 1;
  }
  if (groupedCount > 0) return out;

  const groupedRe =
    /<li[^>]*data-slot-ids="([^"]+)"[^>]*>[\s\S]*?<span class="advertiser-index__name">([^<]*)<\/span>/gi;
  let groupedMatch: RegExpExecArray | null;
  while ((groupedMatch = groupedRe.exec(html)) !== null) {
    const name = decodeAdvertIndexNameHtml(groupedMatch[2]);
    const ids = groupedMatch[1]
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);
    for (const id of ids) {
      out[id] = name;
    }
    groupedCount += 1;
  }
  if (groupedCount > 0) return out;

  const rowRe =
    /<li[^>]*data-slot-id="(\d+)"[^>]*>[\s\S]*?<span class="advertiser-index__name">([^<]*)<\/span>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html)) !== null) {
    const id = Number(match[1]);
    if (!Number.isInteger(id)) continue;
    out[id] = decodeAdvertIndexNameHtml(match[2]);
  }
  return out;
}

export function formatAdvertSlotPageDisplay(
  publication_page: number | null,
  slot_key: string
): string {
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
  if (publication_page != null) return String(publication_page);
  return "—";
}

export function collectAdvertSlotsForIndexListing(slots: readonly SlotRow[]): AdvertIndexSourceRow[] {
  const rows: AdvertIndexSourceRow[] = [];
  for (const slot of slots) {
    const slotKey = String(slot.slot_key ?? "").trim().toLowerCase();
    if (!ADVERT_SLOT_KEYS_INCLUDED.has(slotKey)) continue;
    if (normalizeSlotContentType(slot.slot_content_type) !== "advert") continue;
    if (String(slot.slot_state ?? "").trim().toLowerCase() === "padding") continue;

    const pageRaw = slot.publication_page;
    const publication_page =
      pageRaw != null && Number.isFinite(Number(pageRaw)) ? Math.round(Number(pageRaw)) : null;

    const mediaUrl = String(slot.slot_media_url ?? "").trim();
    rows.push({
      publication_slot_id: slot.publication_slot_id,
      publication_page,
      company_shown_name: String(slot.customer_name ?? "").trim(),
      slot_key: slotKey,
      slot_media_url: mediaUrl || null,
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

function escapeHtml(raw: string): string {
  return String(raw ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type AdvertiserIndexHtmlOptions = {
  editionName?: string;
  headerDomain?: string;
  publicationTheme?: string;
  specialEditionSubtitle?: string;
  redBoxHeader?: string;
  redBoxBody?: string;
  /** Shown in the page footer when this slot is not cover / inside / end. */
  magazineFooterPageNumber?: string | null;
};

function normalizeAdvertiserIndexOptions(
  editionNameOrOptions?: string | AdvertiserIndexHtmlOptions
): AdvertiserIndexHtmlOptions {
  if (typeof editionNameOrOptions === "string") {
    return { editionName: editionNameOrOptions };
  }
  return editionNameOrOptions ?? {};
}

export function buildAdvertiserIndexHtml(
  rows: readonly AdvertIndexSourceRow[],
  editionNameOrOptions?: string | AdvertiserIndexHtmlOptions
): string {
  const options = normalizeAdvertiserIndexOptions(editionNameOrOptions);
  const edition = String(options.editionName ?? "").trim();
  const headerDomain = String(options.headerDomain ?? "glassinformer.com").trim() || "glassinformer.com";
  const tagline =
    String(options.publicationTheme ?? "").trim() ||
    "Bimonthly publication covering the global glass industry";
  const specialLine = String(options.specialEditionSubtitle ?? "").trim();
  const groups = groupAdvertIndexRowsByDisplayName(rows);

  const cards = groups
    .map((group) => {
      const name = escapeHtml(group.displayName);
      const slotIdsAttr = group.slotIds.join(",");
      const pageTags = group.pages
        .map(
          (p) =>
            `<span class="advertiser-index__page-tag" data-slot-id="${p.publication_slot_id}">${escapeHtml(p.pageLabel)}</span>`
        )
        .join("");
      return `<li class="advertiser-index__card" data-slot-ids="${slotIdsAttr}"><p class="advertiser-index__card-name">${name}</p><div class="advertiser-index__page-tags">${pageTags}</div></li>`;
    })
    .join("\n");

  const editionMeta = edition
    ? `${escapeHtml(edition)} · ${rows.length} advert${rows.length === 1 ? "" : "s"}`
    : `${rows.length} advert${rows.length === 1 ? "" : "s"}`;

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
