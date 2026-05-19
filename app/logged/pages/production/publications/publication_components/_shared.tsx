"use client";

import React from "react";
import Link from "next/link";
import { useFlatplanArticleDrag } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanArticleDragContext";
import { FlatplanAdvertMediaThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanAdvertMediaThumbnail";
import { FlatplanSlotContentThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanSlotContentThumbnail";

// ============================================================================
// Types
// ============================================================================

export type PublicationDbRow = {
  publication_id: string;
  magazine_id: string | null;
  publication_year: number | null;
  publication_edition_name: string;
  magazine_general_issue_number: number | null;
  magazine_this_year_issue: number | null;
  publication_expected_publication_month: number | null;
  real_publication_month_date: string | null;
  publication_materials_deadline: string | null;
  is_special_edition: boolean;
  /**
   * Optional tagline rendered exclusively under the magazine subtitle on the
   * cover preview when `is_special_edition` is true.
   */
  special_edition_subtitle: string;
  publication_theme: string;
  publication_status: "planned" | "draft" | "published" | string;
  publication_format: "flipbook" | "informer" | string;
  publication_main_image_url: string;
  /** Full cover layout PNG for flatplan (…/adverts media/cover/final/). */
  publication_cover_flatplan_image_url?: string;
  mediateca_folder_id: string | null;
  /** Cover preview vertical domain shown on the black masthead. */
  publication_header_domain: string;
  /** Bold/large first line inside the angled red stamp. */
  red_box_header: string;
  /** Body text below the red header (limited to 25 words). */
  red_box_body: string;
};

export type SlotRow = {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  /** Magazine page index (cover=-1, inside=0, preferential 1–9, end default 10; regular_page > 9). */
  publication_page: number;
  /** Ordering within the issue (typically publication_page + 1). */
  slot_ordinal: number;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  slot_media_url: string | null;
  slot_article_id: string | null;
  slot_created_at: string | null;
  slot_updated_at: string | null;
  customer_name: string | null;
  project_contract_id: string | null;
  /** From GET …/slots: publication article spread occupying this slot (flatplan preview). */
  flatplan_publication_article_id?: string | null;
  flatplan_article_page_index?: number | null;
  flatplan_article_page_total?: number | null;
  flatplan_article_chunks_in_slot?: number | null;
  /** Workflow state of the linked `publication_articles` row (GET …/slots enrich). */
  flatplan_publication_article_state?: string | null;
  /** Flatplan black-tag label from `publication_articles.publication_art_name` (GET …/slots enrich). */
  flatplan_publication_art_name?: string | null;
  magazine_page_layout?: string | null;
  /** Article chunks for flatplan tile thumbnail (GET …/slots enrich). */
  flatplan_preview_chunks?: FlatplanPreviewChunk[] | null;
  /** Cover slot only: composite from Data tab (GET …/slots enrich). */
  flatplan_cover_composite_url?: string | null;
  /** summary-typed slots: publication-level summary PDF (GET …/slots enrich). */
  flatplan_summary_pdf_url?: string | null;
  /** index-typed slots: publication-level index PDF (GET …/slots enrich). */
  flatplan_index_pdf_url?: string | null;
};

export type FlatplanPreviewChunk = {
  publication_article_chunk_id: string;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
  chunk_page_weight?: number;
};

/** Stored in `publication_articles.publication_article_state` (migration 042). */
export const PUBLICATION_ARTICLE_STATE_VALUES = [
  "unfinished",
  "awaiting materials",
  "finished unapproved",
  "finished approved",
] as const;

export type PublicationArticleStateValue = (typeof PUBLICATION_ARTICLE_STATE_VALUES)[number];

/** Every article slot in the flatplan must reach this state before the issue can be published. */
export const PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED: PublicationArticleStateValue = "finished approved";

/** Short English explanations for editors (Article Builder + publish gate). */
export const PUBLICATION_ARTICLE_STATE_HELP: Record<PublicationArticleStateValue, string> = {
  unfinished:
    "Default when the adaptation is created. Use this while the magazine pages are still being laid out or edited.",
  "awaiting materials":
    "Blocked: required assets or copy are still missing. Do not continue production on this article until materials arrive.",
  "finished unapproved":
    "The team considers the magazine adaptation complete, but the client has not given final approval yet.",
  "finished approved":
    "Complete and signed off by the client. The issue cannot be published until every article slot in the flatplan reaches this state.",
};

export function isPublicationArticleStateValue(v: string): v is PublicationArticleStateValue {
  return (PUBLICATION_ARTICLE_STATE_VALUES as readonly string[]).includes(v);
}

/**
 * Reasons the issue cannot be published yet, derived from flatplan slots.
 * Every `regular_page` with content type **article** must be linked to a publication article
 * whose workflow state is {@link PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED}.
 */
export function flatplanArticleSlotPublishBlockers(slots: readonly SlotRow[]): string[] {
  const blockers: string[] = [];
  const byPaState = new Map<string, string>();
  const orphanMagPages: number[] = [];

  for (const s of slots) {
    const sk = String(s.slot_key ?? "").trim().toLowerCase();
    if (sk !== "regular_page") continue;
    if (normalizeSlotContentType(s.slot_content_type) !== "article") continue;
    const magPg =
      s.publication_page != null && Number.isFinite(Number(s.publication_page))
        ? Math.round(Number(s.publication_page))
        : null;
    const paId = (s.flatplan_publication_article_id ?? "").trim();
    if (!paId) {
      if (magPg != null) orphanMagPages.push(magPg);
      continue;
    }
    const st = String(s.flatplan_publication_article_state ?? "unfinished").trim();
    if (!byPaState.has(paId)) byPaState.set(paId, st);
  }

  if (orphanMagPages.length) {
    const u = [...new Set(orphanMagPages)].sort((a, b) => a - b);
    blockers.push(
      `Article slot(s) on magazine page(s) ${u.join(", ")} are not linked to a publication article. Assign them in Article Builder before publishing.`
    );
  }
  for (const [paId, state] of byPaState) {
    if (state !== PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED) {
      const short = paId.slice(0, 8);
      blockers.push(
        `Publication article ${short}… must be “finished approved” (currently “${state}”). Update workflow state in Article Builder.`
      );
    }
  }
  return blockers;
}

export type PreferentialProposalServiceLine = {
  proposal_service_line_id: string;
  service_id: string | null;
  service_full_name: string | null;
  proposal_service_custom_name: string;
  service_unit_price: number;
  proposal_service_discount_pct: number;
  /** Service unit price after applying the line discount (€). */
  line_value_eur: number;
};

export type PreferentialProposalSummary = {
  proposal_id: string;
  customer_id: string | null;
  customer_name: string | null;
  proposal_status: string | null;
  title: string | null;
  proposal_amount_eur: number | null;
  general_discount_pct: number | null;
  agent_id: string | null;
  agent_name: string | null;
  service_lines: PreferentialProposalServiceLine[];
};

export type PreferentialSlotApiRow = {
  position_in_magazine: string;
  section_title: string;
  missing: boolean;
  preferential_slot_id: string | null;
  publication_slot_id: number | null;
  state: string | null;
  contract_id: string | null;
  assigned_customer_id: string | null;
  assigned_kind: "summary" | "advertiser_index" | "customer" | null;
  assigned_customer_name: string | null;
  slot_content_type: string | null;
  slot_media_url?: string | null;
  slot_customer_id?: string | null;
  slot_project_id?: string | null;
  slot_article_id?: string | null;
  proposal_summaries: PreferentialProposalSummary[];
};

export type CoverMarginArticleMiniature = {
  position: number;
  article: {
    id: string;
    title: string;
  } | null;
  currentContent: string;
  draftContent: string;
  editing: boolean;
};

export type MagazineApiRow = {
  id_magazine: string;
  name: string;
  subtitle?: string;
};

export type TabId = "data" | "flatplan" | "contentsManager";

// ============================================================================
// Constants
// ============================================================================

/** Production → Publications hub (magazines, preferential-pages, issues list). */
export const PUBLICATIONS_APP_BASE = "/logged/pages/production/publications";

/** Magazine issue workspace: issue detail, flatplan, slots, builders. */
export const ISSUES_APP_BASE = `${PUBLICATIONS_APP_BASE}/issues`;

/**
 * Routes scoped to a single issue (`…/issues/:publicationId/...`).
 * Kept as `BASE` for backward compatibility across issue tabs and shared UI.
 */
export const BASE = ISSUES_APP_BASE;
export const PROPOSALS_BASE = "/logged/pages/account-management/proposals";

/** Hard cap enforced on the editable Red Box body input. */
export const RED_BOX_BODY_MAX_WORDS = 25;

export const COVER_MARGIN_PLACEHOLDER_LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

export const MIN_FLATPLAN_NUMERIC_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Canonical set of slot_content_type values exposed in the editable Slots table. */
export const SLOT_CONTENT_TYPE_OPTIONS = [
  "advert",
  "article",
  "summary",
  "index",
  "padding",
] as const;
export type SlotContentTypeOption = (typeof SLOT_CONTENT_TYPE_OPTIONS)[number];
export const DEFAULT_SLOT_CONTENT_TYPE: SlotContentTypeOption = "advert";

export const LOCKED_ADVERT_SLOT_KEYS = new Set([
  "cover",
  "inside_cover",
  "inside cover",
  "end",
  "end_page",
  "end page",
]);

/** Preferential interior pages that allow summary/index (matches legacy numeric keys 2/4/6/8). */
export const SUMMARY_INDEX_PUBLICATION_PAGES = new Set([2, 4, 6, 8]);

/** @deprecated Prefer SUMMARY_INDEX_PUBLICATION_PAGES + publication_page */
export const SUMMARY_INDEX_SLOT_KEYS = new Set(["2", "4", "6", "8"]);

/** Structural flipbook slots (cover → inside → preferential pages 1–9 → end). */
export function isPreferentialInteriorPublicationPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= 9;
}

export function preferentialPublicationPageFromSlot(
  slot: Pick<SlotRow, "slot_key" | "publication_page">
): number | null {
  if (String(slot.slot_key ?? "").trim().toLowerCase() !== "preferential_page") return null;
  const n = Math.round(Number(slot.publication_page));
  return isPreferentialInteriorPublicationPage(n) ? n : null;
}

/** Flatplan / slots table: preferential interior pages 1–9 (not cover, inside, or end). */
export function isPreferentialInteriorFlatplanEntry(
  entryKey: string,
  slot: Pick<SlotRow, "slot_key" | "publication_page"> | null
): boolean {
  if (slot && preferentialPublicationPageFromSlot(slot) != null) return true;
  const m = /^preferential_page:(\d+)$/i.exec(String(entryKey ?? "").trim());
  if (m) {
    const n = Number(m[1]);
    return Number.isInteger(n) && n >= 1 && n <= 9;
  }
  const ek = String(entryKey ?? "").trim();
  if (/^\d+$/.test(ek)) {
    const n = Number(ek);
    return Number.isInteger(n) && n >= 1 && n <= 9;
  }
  return false;
}

export const PREFERENTIAL_INTERIOR_FLATPLAN_LABEL = "Preferential";

export function isCoreStructuralMagazineSlot(
  slot: Pick<SlotRow, "slot_key" | "publication_page">
): boolean {
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (k === "cover") return true;
  if (k === "inside_cover" || k === "inside cover") return true;
  if (k === "end" || k === "end_page" || k === "end page") return true;
  return preferentialPublicationPageFromSlot(slot) != null;
}

/** Entry-key structural check for buffers / tiles when only `entryKey` is known. */
export function isCoreStructuralMagazineEntryKey(entryKey: string | null | undefined): boolean {
  const k = String(entryKey ?? "").trim().toLowerCase();
  if (k === "cover" || k === "inside_cover" || k === "inside cover" || k === "end") return true;
  const m = /^preferential_page:(\d+)$/.exec(k);
  if (m) {
    const n = Number(m[1]);
    return Number.isInteger(n) && n >= 1 && n <= 9;
  }
  return false;
}

/**
 * Structural flipbook slots in the flatplan (cover, inside, end, preferential 1–9, legacy numeric keys).
 * Preferential interior tiles use {@link PREFERENTIAL_INTERIOR_FLATPLAN_LABEL} via
 * {@link isPreferentialInteriorFlatplanEntry}.
 */
export function isFlatplanPreferentialPreviewTopRight(
  entryKey: string,
  slot: Pick<SlotRow, "slot_key" | "publication_page"> | null
): boolean {
  if (isArticlePageSlotEntryKey(entryKey)) return false;
  const ek = String(entryKey ?? "").trim().toLowerCase();
  if (ek === "cover" || ek === "inside_cover" || ek === "inside cover") return true;
  if (ek === "end" || ek === "end_page" || ek === "end page") return true;
  const m = /^preferential_page:(\d+)$/i.exec(ek);
  if (m) {
    const n = Number(m[1]);
    return Number.isInteger(n) && n >= 1 && n <= 9;
  }
  if (isNumericSlotKey(ek)) {
    const n = Number(ek);
    return Number.isInteger(n) && n >= 1 && n <= 9;
  }
  if (slot) {
    const sk = String(slot.slot_key ?? "").trim().toLowerCase();
    if (sk === "cover" || sk === "inside_cover" || sk === "inside cover") return true;
    if (sk === "end" || sk === "end_page" || sk === "end page") return true;
    if (preferentialPublicationPageFromSlot(slot) != null) return true;
  }
  return false;
}

/**
 * @deprecated Prefer `isCoreStructuralMagazineSlot` when `publication_page` is present.
 * Still recognises legacy numeric `slot_key` strings (`"1"`…`"9"`).
 */
export function isCoreStructuralMagazineSlotKey(slotKey: string | null | undefined): boolean {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return true;
  if (k === "inside_cover" || k === "inside cover") return true;
  if (k === "end" || k === "end_page" || k === "end page") return true;
  if (k === "preferential_page") return true;
  const n = Number(k);
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

/**
 * `slot_state` value used for artificial padding slots inserted automatically
 * to keep the magazine page count valid.
 */
export const PADDING_SLOT_STATE = "padding";

/**
 * `slot_content_type` stored on those same rows — not a commercial page until
 * the user picks advert/article (then state becomes `pending`).
 */
export const PADDING_SLOT_CONTENT_TYPE = "padding" as const;

/** Sentinel entries in `flatplan_position_working_list` (not DB slots). */
export const FLATPLAN_BUFFER_KEY = "__flatplan_buffer__";

/** Slot keys that must never be removed from the flatplan bulk-delete UI. */
export function isFlatplanSlotBulkDeletable(slot: SlotRow | null, entryKey: string): boolean {
  if (!slot?.publication_slot_id) return false;
  if (entryKey === FLATPLAN_BUFFER_KEY) return false;
  if (isArticlePageSlotEntryKey(entryKey)) return true;
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(k)) return false;
  if (preferentialPublicationPageFromSlot(slot) != null) return false;
  return true;
}

/** All flatplan slot ids that share the same `publication_articles` spread. */
export function flatplanSpreadSlotIdsForPublicationArticle(
  slots: readonly SlotRow[],
  publicationArticleId: string
): number[] {
  const paId = String(publicationArticleId ?? "").trim();
  if (!paId) return [];
  return slots
    .filter((s) => String(s.flatplan_publication_article_id ?? "").trim() === paId)
    .map((s) => Number(s.publication_slot_id))
    .filter((n) => Number.isFinite(n) && n > 0);
}

/** Slot ids deleted together when toggling one page of a multi-page article. */
export function flatplanBulkDeleteSlotGroup(
  slots: readonly SlotRow[],
  publicationSlotId: number
): number[] {
  const sid = Number(publicationSlotId);
  if (!Number.isFinite(sid) || sid <= 0) return [];
  const slot = slots.find((s) => Number(s.publication_slot_id) === sid);
  if (!slot) return [sid];
  const paId = String(slot.flatplan_publication_article_id ?? "").trim();
  if (!paId) return [sid];
  const group = flatplanSpreadSlotIdsForPublicationArticle(slots, paId);
  return group.length > 0 ? group : [sid];
}

/** Expand / collapse every page of the same article when bulk-deleting from the flatplan. */
export function toggleFlatplanBulkDeleteSlotIds(
  slots: readonly SlotRow[],
  prev: number[],
  publicationSlotId: number
): number[] {
  const group = flatplanBulkDeleteSlotGroup(slots, publicationSlotId);
  const groupSet = new Set(group);
  const allSelected = group.length > 0 && group.every((id) => prev.includes(id));
  if (allSelected) {
    return prev.filter((id) => !groupSet.has(id));
  }
  const next = new Set(prev);
  for (const id of group) next.add(id);
  return [...next];
}

/** Union of spread groups for each selected slot (flatplan delete modal + API payload). */
export function expandFlatplanBulkDeleteSlotIds(
  slots: readonly SlotRow[],
  selectedSlotIds: readonly number[]
): number[] {
  const expanded = new Set<number>();
  for (const id of selectedSlotIds) {
    for (const sid of flatplanBulkDeleteSlotGroup(slots, id)) {
      expanded.add(sid);
    }
  }
  return [...expanded].sort((a, b) => a - b);
}

// ============================================================================
// Helpers
// ============================================================================

/** Truncate `text` so it contains at most `maxWords` whitespace-separated words. */
export function limitToWords(text: string, maxWords: number): string {
  const tokens = text.match(/\S+/g) ?? [];
  if (tokens.length <= maxWords) return text;
  let count = 0;
  let endIndex = 0;
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    count += 1;
    if (count === maxWords) {
      endIndex = m.index + m[0].length;
      break;
    }
  }
  return text.slice(0, endIndex);
}

export function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

export function ordinal(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const v = Math.trunc(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  const mod10 = v % 10;
  if (mod10 === 1) return `${v}st`;
  if (mod10 === 2) return `${v}nd`;
  if (mod10 === 3) return `${v}rd`;
  return `${v}th`;
}

export function monthName(m: number | null): string {
  if (m == null || m < 1 || m > 12) return "—";
  return new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" });
}

export function toNullableInt(v: string): number | null {
  const t = String(v ?? "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function toNullableMonth(v: string): number | null {
  const n = toNullableInt(v);
  if (n == null) return null;
  if (n < 1 || n > 12) return null;
  return n;
}

export function normalizeDateString(v: string): string | null {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
}

export function isNumericSlotKey(k: string): boolean {
  const n = Number(k);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1;
}

/** Slot key for auto-generated editorial pages attached to a publication article. */
export const ARTICLE_PAGE_SLOT_KEY = "regular_page";

const ARTICLE_PAGE_SLOT_ENTRY_PREFIX = "article_page:";

export function isArticlePageSlotRow(slot: Pick<SlotRow, "slot_key">): boolean {
  return String(slot.slot_key ?? "").trim().toLowerCase() === ARTICLE_PAGE_SLOT_KEY;
}

/** White-bg editorial article: only page 1/x of a linked publication article may start a flatplan drag. */
export function isFlatplanArticleDragSource(slot: SlotRow | null | undefined): boolean {
  if (!slot || !isArticlePageSlotRow(slot)) return false;
  if (isPaddingSlot(slot) || isCoreStructuralMagazineSlot(slot)) return false;
  if (String(slot.slot_content_type ?? "").trim().toLowerCase() !== "article") return false;
  const paId = slot.flatplan_publication_article_id;
  if (paId == null || String(paId).trim() === "") return false;
  return slot.flatplan_article_page_index === 1;
}

export type FlatplanArticleDragPayload = {
  publicationArticleId: string;
  entryKey: string;
  pageCount: number;
};

export function buildFlatplanArticleDragPayloadFromSlot(
  slot: SlotRow
): FlatplanArticleDragPayload | null {
  if (!isFlatplanArticleDragSource(slot)) return null;
  const publicationArticleId = String(slot.flatplan_publication_article_id ?? "").trim();
  if (!publicationArticleId) return null;
  const total = slot.flatplan_article_page_total;
  const pageCount =
    total != null && Number.isFinite(Number(total)) && Number(total) >= 1
      ? Math.round(Number(total))
      : 1;
  return {
    publicationArticleId,
    entryKey: flatplanEntryKeyFromSlot(slot),
    pageCount,
  };
}

/** Stable key for flatplan preview + table (one entry per DB slot row). */
export function flatplanEntryKeyFromSlot(
  slot: Pick<SlotRow, "slot_key" | "publication_slot_id" | "publication_page">
): string {
  if (isArticlePageSlotRow(slot)) return articlePageSlotEntryKey(slot.publication_slot_id);
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (k === "preferential_page") {
    const n = preferentialPublicationPageFromSlot(slot);
    if (n != null) return `preferential_page:${n}`;
    return `preferential_page:id:${slot.publication_slot_id}`;
  }
  return String(slot.slot_key ?? "").trim();
}

export function articlePageSlotEntryKey(slotId: number): string {
  return `${ARTICLE_PAGE_SLOT_ENTRY_PREFIX}${slotId}`;
}

export function isArticlePageSlotEntryKey(key: string): boolean {
  return String(key ?? "").startsWith(ARTICLE_PAGE_SLOT_ENTRY_PREFIX);
}

export function articlePageSlotEntryId(key: string): number | null {
  if (!isArticlePageSlotEntryKey(key)) return null;
  const n = Number(key.slice(ARTICLE_PAGE_SLOT_ENTRY_PREFIX.length));
  return Number.isFinite(n) ? n : null;
}

export function magazineSlotsTablePrimaryLabel(slot: Pick<SlotRow, "slot_key" | "publication_page">): string {
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (k === "preferential_page") {
    const n = preferentialPublicationPageFromSlot(slot);
    return n != null ? PREFERENTIAL_INTERIOR_FLATPLAN_LABEL : "preferential_page";
  }
  return String(slot.slot_key ?? "").trim();
}

/** Collapsed slots panel: show slot key only for cover / inside cover / end; otherwise magazine `publication_page`. */
export function magazineSlotsTableReducedLabel(
  slot: Pick<SlotRow, "slot_key" | "publication_page">
): string {
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  const structuralKey =
    k === "cover" ||
    k === "inside_cover" ||
    k === "inside cover" ||
    k === "end" ||
    k === "end_page" ||
    k === "end page";
  if (structuralKey) {
    return magazineSlotsTablePrimaryLabel(slot);
  }
  const pp = slot.publication_page;
  if (pp != null && Number.isFinite(Number(pp))) {
    return String(Number(pp));
  }
  return magazineSlotsTablePrimaryLabel(slot);
}

/** Human spread index: 0 cover, 1 inside, then preferential pages; end follows last interior. */
export function spreadIndexLabel(
  slot: Pick<SlotRow, "slot_key" | "publication_page">,
  maxPreferentialInteriorPage: number
): string {
  const k = String(slot.slot_key ?? "").trim().toLowerCase();
  if (k === "cover") return "0";
  if (k === "inside_cover" || k === "inside cover") return "1";
  if (k === "end" || k === "end_page" || k === "end page") {
    return String(Math.max(10, maxPreferentialInteriorPage + 2));
  }
  const pref = preferentialPublicationPageFromSlot(slot);
  if (pref != null) return String(pref + 1);
  return k;
}

export function normalizeSlotContentType(value: unknown): SlotContentTypeOption {
  const v = String(value ?? "").trim().toLowerCase();
  return (SLOT_CONTENT_TYPE_OPTIONS as readonly string[]).includes(v)
    ? (v as SlotContentTypeOption)
    : DEFAULT_SLOT_CONTENT_TYPE;
}

/** Article or advert slot has linked content (not a bare empty placement). */
export function flatplanSlotHasAssignedContent(
  slot: SlotRow | null | undefined,
  contentType: SlotContentTypeOption
): boolean {
  if (!slot) return false;
  if (contentType === "advert") {
    if (String(slot.slot_media_url ?? "").trim()) return true;
    if (String(slot.customer_id ?? "").trim()) return true;
    if (String(slot.project_id ?? "").trim()) return true;
    if (String(slot.project_contract_id ?? "").trim()) return true;
    return false;
  }
  if (contentType === "article") {
    const paId = slot.flatplan_publication_article_id;
    if (paId != null && String(paId).trim()) return true;
    if (String(slot.slot_article_id ?? "").trim()) return true;
    const previewChunks = slot.flatplan_preview_chunks;
    if (Array.isArray(previewChunks) && previewChunks.length > 0) return true;
    if ((slot.flatplan_article_chunks_in_slot ?? 0) > 0) return true;
    return false;
  }
  return false;
}

/** Customer name, or “empty” only when the slot truly has no assigned content. */
/** Flatplan article tile: `publication_art_name` only (black tag above ARTICLE badge). */
export function flatplanArticleArtNameLine(
  publicationArtName: string | null | undefined
): string | null {
  const name = String(publicationArtName ?? "").trim();
  return name || null;
}

/** Flatplan article tile: spread index below the ARTICLE badge. */
export function flatplanArticlePageFractionLine(pageIndex: number, pageTotal: number): string {
  return `Page ${pageIndex}/${pageTotal}`;
}

/** @deprecated Use {@link flatplanArticleArtNameLine} + {@link flatplanArticlePageFractionLine}. */
export function flatplanArticleEditorialDetailLine(
  pageIndex: number,
  pageTotal: number,
  publicationArtName: string | null | undefined
): string {
  const name = flatplanArticleArtNameLine(publicationArtName);
  const pagePart = flatplanArticlePageFractionLine(pageIndex, pageTotal);
  return name ? `${pagePart} - ${name}` : pagePart;
}

export function flatplanSecondaryLineForSlot(
  slot: SlotRow | null | undefined,
  contentType: SlotContentTypeOption
): string | null {
  if (contentType === "padding") return null;
  const customer = String(slot?.customer_name ?? "").trim();
  if (customer) return customer;
  if (contentType === "article" || contentType === "advert") {
    return flatplanSlotHasAssignedContent(slot, contentType) ? null : "empty";
  }
  return "empty";
}

export function allowedSlotContentTypes(
  slot: Pick<SlotRow, "slot_key" | "publication_page">
): SlotContentTypeOption[] {
  const key = String(slot.slot_key ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const pref = preferentialPublicationPageFromSlot(slot);
  if (pref != null) {
    return SUMMARY_INDEX_PUBLICATION_PAGES.has(pref) ? ["advert", "summary", "index"] : ["advert"];
  }
  return ["advert", "article"];
}

export function isPaddingSlot(
  slot: Pick<SlotRow, "slot_state"> | SlotRow | null | undefined
): boolean {
  return String(slot?.slot_state ?? "").toLowerCase() === PADDING_SLOT_STATE;
}

export function effectiveSlotTableContentTypes(
  slot: Pick<SlotRow, "slot_key" | "slot_state" | "publication_page">
): SlotContentTypeOption[] {
  if (isPaddingSlot(slot)) {
    return ["padding", "advert", "article"];
  }
  const state = String(slot.slot_state ?? "").trim().toLowerCase();
  const pref = preferentialPublicationPageFromSlot(slot);
  if (state === "pending" && pref != null) {
    return SUMMARY_INDEX_PUBLICATION_PAGES.has(pref)
      ? ["advert", "summary", "index"]
      : ["advert", "article"];
  }
  return allowedSlotContentTypes(slot);
}

/** True when an auto-padding row has no assignment or assets (safe to drop for parity sync). */
export function isPaddingSlotEligibleForAutoDelete(
  slot: SlotRow | null | undefined
): boolean {
  if (!isPaddingSlot(slot)) return false;
  const hasProject = slot?.project_id != null && String(slot.project_id).trim() !== "";
  const hasCustomer = slot?.customer_id != null && String(slot.customer_id).trim() !== "";
  const hasArticle = slot?.slot_article_id != null && String(slot.slot_article_id).trim() !== "";
  const hasMedia = slot?.slot_media_url != null && String(slot.slot_media_url).trim() !== "";
  return !hasProject && !hasCustomer && !hasArticle && !hasMedia;
}

/**
 * How many `slot_state === "padding"` rows the flatplan needs so spreads pair cleanly:
 * **exactly one** when the total number of non-padding slots is odd, **none** when even.
 * Uses the full body count (cover, numeric pages, article pages, end, etc.), not only numeric keys.
 */
export function paddingSlotsNeeded(nonPaddingSlotCount: number): number {
  const safe =
    Number.isFinite(nonPaddingSlotCount) && nonPaddingSlotCount >= 0
      ? Math.trunc(nonPaddingSlotCount)
      : 0;
  return safe % 2 === 1 ? 1 : 0;
}

/**
 * Split point for the flatplan preview: keys `[0 .. leftCount-1]` render in the left column.
 * The left column is built as rows of two tiles (after the first row); an **odd** number of
 * keys there leaves a lone tile in the last left row. So `leftCount` must be **even** whenever
 * we have at least two keys to place.
 */
export function flatplanLeftColumnCount(n: number): number {
  if (n <= 0) return 0;
  if (n <= 2) return n;
  let L = Math.ceil(n / 2);
  if (L % 2 === 1) L += 1;
  if (L >= n) L = n - 2;
  if (L < 2) return 2;
  return L;
}

/** Column width = two flatplan cells (tile + insert gutters) + inner row gap (gap-2 / gap-4). */
export function flatplanPreviewColClass(previewExpanded: boolean): string {
  return previewExpanded ? "w-[384px] shrink-0 min-w-[384px]" : "w-[244px] shrink-0 min-w-[244px]";
}

/** Side rails (+ buttons); keeps each preview cell the same outer width: w-5 + gap-1 + tile + gap-1 + w-5. */
export const FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS =
  "flex w-5 shrink-0 flex-col items-center justify-center self-stretch min-h-0";

export const FLATPLAN_PREVIEW_CELL_OUTER_SHELL_CLASS =
  "group/preview-insert flex shrink-0 flex-row items-stretch gap-1";

/** Magazine page proportion for flatplan tiles (width × height, e.g. A4). */
export const FLATPLAN_PAGE_ASPECT_CLASS = "aspect-[228/297]";

/** Tile width inside the flatplan preview shell (height follows {@link FLATPLAN_PAGE_ASPECT_CLASS}). */
export function flatplanPreviewTileWidthClass(previewExpanded: boolean): string {
  return previewExpanded ? "w-[140px] min-w-[140px]" : "w-[70px] min-w-[70px]";
}

export const FLATPLAN_PREVIEW_TILE_TRANSITION_CLASS =
  "motion-reduce:transition-none motion-reduce:duration-0 transition-[width,min-width,padding,font-size,line-height,box-shadow,border-color] duration-[1400ms] ease-in-out";

/** Shape/size shared by flatplan “+” controls (lateral gutters vs between-row). */
const FLATPLAN_PREVIEW_INSERT_BTN_SHAPE_CLASS =
  "flex size-5 shrink-0 items-center justify-center rounded border border-dashed border-gray-500 bg-white text-sm font-bold leading-none text-gray-700 shadow-sm transition-opacity duration-150 z-10";

/** Baseline “+”: hidden until a hover group reveals it (see lateral insert buttons). */
export const FLATPLAN_PREVIEW_INSERT_BTN_CLASS =
  `${FLATPLAN_PREVIEW_INSERT_BTN_SHAPE_CLASS} opacity-0 pointer-events-none hover:bg-blue-50 hover:!opacity-100`;

/** Per-slot “+” (side gutters): only visible when the tile is hovered (or while dragging an article). */
export const FLATPLAN_PREVIEW_CELL_INSERT_BTN_CLASS =
  `${FLATPLAN_PREVIEW_INSERT_BTN_CLASS} flatplan-insert-btn group-hover/preview-insert:opacity-100 group-hover/preview-insert:pointer-events-auto`;

/** Between-row “+” (above/below the editorial gap): always visible; row or button hover increases contrast. */
export const FLATPLAN_PREVIEW_ROW_INSERT_BTN_CLASS =
  `${FLATPLAN_PREVIEW_INSERT_BTN_SHAPE_CLASS} flatplan-row-insert-btn cursor-pointer pointer-events-auto opacity-80 hover:bg-blue-50 hover:!opacity-100 group-hover/preview-row:!opacity-100`;

/** Reserved height above/below each preview row (with or without a “+” button). */
export function flatplanPreviewRowVerticalGutterClass(previewExpanded: boolean): string {
  return previewExpanded ? "min-h-[1.5rem] h-6 shrink-0" : "min-h-[1.25rem] h-5 shrink-0";
}

/** Placeholder footprint matching `FlatplanPreviewCell` (non-buffer) so paired rows stay aligned. */
export function flatplanPreviewPairPlaceholderClass(previewExpanded: boolean): string {
  return previewExpanded
    ? "h-[182px] min-h-[182px] w-[188px] min-w-[188px] shrink-0 opacity-0 pointer-events-none select-none"
    : "h-[91px] min-h-[91px] w-[118px] min-w-[118px] shrink-0 opacity-0 pointer-events-none select-none";
}

export function flatplanSlotSortKey(entryKey: string): number {
  const k = String(entryKey || "").trim().toLowerCase();
  const articleSlotId = articlePageSlotEntryId(k);
  if (articleSlotId != null) return 9500 + articleSlotId;
  if (k === "cover") return 0;
  if (k === "inside_cover" || k === "inside cover") return 1;
  if (k === "end") return 10000;
  const m = /^preferential_page:(\d+)$/.exec(k);
  if (m) return 2 + Number(m[1]);
  if (isNumericSlotKey(k)) return 2 + Number(k);
  return 5000;
}

/** Stable ordering within an issue (`slot_ordinal`, then `publication_page`). */
export function comparePublicationSlotsFlatplanOrder(a: SlotRow, b: SlotRow): number {
  const ao = a.slot_ordinal;
  const bo = b.slot_ordinal;
  const aHas = ao != null && Number.isFinite(Number(ao));
  const bHas = bo != null && Number.isFinite(Number(bo));
  if (aHas && bHas && Number(ao) !== Number(bo)) {
    return Number(ao) - Number(bo);
  }
  const ap = a.publication_page;
  const bp = b.publication_page;
  const apHas = ap != null && Number.isFinite(Number(ap));
  const bpHas = bp != null && Number.isFinite(Number(bp));
  if (apHas && bpHas && Number(ap) !== Number(bp)) {
    return Number(ap) - Number(bp);
  }
  const aKey = flatplanEntryKeyFromSlot(a);
  const bKey = flatplanEntryKeyFromSlot(b);
  const diff = flatplanSlotSortKey(aKey) - flatplanSlotSortKey(bKey);
  if (diff !== 0) return diff;
  return a.publication_slot_id - b.publication_slot_id;
}

export function chunkKeysIntoPairs(keys: string[]): [string, string | undefined][] {
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < keys.length; i += 2) {
    pairs.push([keys[i], keys[i + 1]]);
  }
  return pairs;
}

function isFlatplanEndEntryKey(entryKey: string): boolean {
  const k = String(entryKey ?? "").trim().toLowerCase();
  return k === "end" || k === "end_page" || k === "end page";
}

/** Preferential page indices from `preferential_page:N` keys in a preview row. */
export function flatplanPreferentialPagesFromFlatplanRowKeys(rowKeys: string[]): number[] {
  return rowKeys
    .filter((k) => k !== FLATPLAN_BUFFER_KEY)
    .map((k) => {
      const m = /^preferential_page:(\d+)$/i.exec(String(k).trim());
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n != null && Number.isFinite(n));
}

/** Spread row showing preferential pages 8 and 9 — editorial insert "+" below only. */
export function flatplanPreviewRowIsPreferentialEightNine(rowKeys: string[]): boolean {
  const s = new Set(flatplanPreferentialPagesFromFlatplanRowKeys(rowKeys));
  return s.has(8) && s.has(9);
}

/** Row that contains the `end` slot — editorial insert "+" above only. */
export function flatplanPreviewRowContainsEndSlot(rowKeys: string[]): boolean {
  return rowKeys.some((k) => k !== FLATPLAN_BUFFER_KEY && isFlatplanEndEntryKey(k));
}

/** Preview rows for the left column — mirrors `FlatplanPreviewPanel`. */
function flatplanPreviewLeftColumnRows(leftKeys: string[]): [string, string | undefined][] {
  if (leftKeys.length === 0) return [];
  const rows: [string, string | undefined][] = [];
  rows.push([leftKeys[0], leftKeys[1]]);
  rows.push(...chunkKeysIntoPairs(leftKeys.slice(2)));
  return rows;
}

/** Preview rows for the right column — mirrors `FlatplanPreviewPanel`. */
function flatplanPreviewRightColumnRows(rightKeys: string[]): [string, string | undefined][] {
  const n = rightKeys.length;
  if (n === 0) return [];
  const head = Math.max(0, n - 2);
  const rows: [string, string | undefined][] = [];
  rows.push(...chunkKeysIntoPairs(rightKeys.slice(0, head)));
  if (n >= 2) {
    rows.push([rightKeys[n - 2], rightKeys[n - 1]]);
  }
  return rows;
}

function nonBufferSlotsInPreviewPair(pair: [string, string | undefined]): number {
  const [a, b] = pair;
  let c = 0;
  if (a !== FLATPLAN_BUFFER_KEY) c += 1;
  if (b !== undefined && b !== FLATPLAN_BUFFER_KEY) c += 1;
  return c;
}

function previewRowIndexContainingEnd(rows: [string, string | undefined][]): number {
  return rows.findIndex(
    ([lk, rk]) => isFlatplanEndEntryKey(lk) || (rk != null && isFlatplanEndEntryKey(rk))
  );
}

/**
 * When {@link flatplanPreviewPenultimateRowHasSingleSlot} is true, describes that preview row
 * (column + normalized pair keys) so the UI can replace the empty partner cell with a notice.
 */
export function flatplanPreviewPenultimateSingleSlotPlacement(split: {
  leftKeys: string[];
  rightKeys: string[];
}): { column: "left" | "right"; leftKey: string; rightKey: string } | null {
  const leftRows = flatplanPreviewLeftColumnRows(split.leftKeys);
  const rightRows = flatplanPreviewRightColumnRows(split.rightKeys);
  const leftEnd = previewRowIndexContainingEnd(leftRows);
  const rightEnd = previewRowIndexContainingEnd(rightRows);
  let rows: [string, string | undefined][] | null = null;
  let endIdx = -1;
  let column: "left" | "right" | null = null;
  if (rightEnd >= 0) {
    rows = rightRows;
    endIdx = rightEnd;
    column = "right";
  } else if (leftEnd >= 0) {
    rows = leftRows;
    endIdx = leftEnd;
    column = "left";
  }
  if (rows == null || endIdx < 1 || column == null) return null;
  const penultimate = rows[endIdx - 1];
  if (nonBufferSlotsInPreviewPair(penultimate) !== 1) return null;
  const leftKey = penultimate[0];
  const rightKey = penultimate[1] ?? FLATPLAN_BUFFER_KEY;
  return { column, leftKey, rightKey };
}

/**
 * True when the row **above** the row that contains `end` has exactly one real slot
 * (the partner cell is buffer / empty). Matches flatplan preview pairing logic.
 */
export function flatplanPreviewPenultimateRowHasSingleSlot(split: {
  leftKeys: string[];
  rightKeys: string[];
}): boolean {
  return flatplanPreviewPenultimateSingleSlotPlacement(split) != null;
}

/** Label from working-list index. */
export function flatplanWorkingLabel(workingIndex: number): string {
  return String(workingIndex - 2);
}

// ============================================================================
// Presentational components
// ============================================================================

export function CustomerMiniCard({
  customerId,
  name,
}: {
  customerId: string;
  name?: string | null;
}) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Customer</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{name?.trim() ? name : "—"}</p>
      <p className="text-xs font-mono text-gray-600 mt-1 break-all">{customerId}</p>
    </div>
  );
}

export function ProposalMiniCard({ row }: { row: PreferentialProposalSummary }) {
  const { proposal_id, title, customer_id, customer_name, proposal_status } = row;
  return (
    <Link
      href={`${PROPOSALS_BASE}/${encodeURIComponent(proposal_id)}`}
      className="block rounded-lg border border-blue-100 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow transition"
    >
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Proposal</p>
      <p className="text-xs font-mono text-gray-800 mt-0.5 break-all">{proposal_id}</p>
      {title ? <p className="text-sm text-gray-900 mt-1 line-clamp-2">{title}</p> : null}
      {proposal_status ? (
        <p className="text-xs text-gray-500 mt-1">Status: {proposal_status}</p>
      ) : null}
      {customer_id ? (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <p className="text-[10px] text-gray-500 uppercase">Customer</p>
          <p className="text-sm text-gray-900">{customer_name?.trim() ? customer_name : "—"}</p>
          <p className="text-xs font-mono text-gray-600 break-all">{customer_id}</p>
        </div>
      ) : null}
    </Link>
  );
}

/** Format a numeric €-amount with the user's locale and two decimals. */
function formatEur(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `€${Number(value).toFixed(2)}`;
  }
}

/**
 * Compact pill rendered inside the summary header so the user can scan whether
 * a preferential placement has a customer / is bought / is offered at a glance.
 */
function StatusPill({
  label,
  yes,
  yesTone = "emerald",
  detail,
}: {
  label: string;
  yes: boolean;
  yesTone?: "emerald" | "blue" | "amber";
  detail?: string | null;
}) {
  const toneClasses = yes
    ? yesTone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : yesTone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-gray-200 bg-gray-50 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClasses}`}
    >
      <span className="uppercase tracking-wide text-[10px] opacity-80">{label}</span>
      <span>{yes ? "Yes" : "No"}</span>
      {yes && detail ? <span className="opacity-80">· {detail}</span> : null}
    </span>
  );
}

/**
 * Sub-card rendered inside an offered preferential slot for every individual
 * `proposal_service_line` competing for that placement. Shows which proposal
 * it belongs to, customer, total proposal amount, line value with the unit
 * discount applied, and the agent.
 */
function ProposalServiceLineSubCard({
  proposal,
  line,
}: {
  proposal: PreferentialProposalSummary;
  line: PreferentialProposalServiceLine;
}) {
  const serviceName =
    (line.service_full_name ?? "").trim() ||
    line.proposal_service_custom_name.trim() ||
    "Service";
  return (
    <Link
      href={`${PROPOSALS_BASE}/${encodeURIComponent(proposal.proposal_id)}`}
      className="block rounded-lg border border-blue-100 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Service line</p>
          <p className="text-sm font-medium text-gray-900 truncate">{serviceName}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-gray-500 uppercase">Line value</p>
          <p className="text-sm font-semibold text-emerald-700">
            {formatEur(line.line_value_eur)}
          </p>
          {line.proposal_service_discount_pct ? (
            <p className="text-[10px] text-gray-500">
              −{line.proposal_service_discount_pct}% off {formatEur(line.service_unit_price)}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-gray-100 pt-2">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase">Proposal</p>
          <p className="text-xs text-gray-900 truncate">
            {proposal.title?.trim() || proposal.proposal_id}
          </p>
          <p className="text-[10px] font-mono text-gray-500 truncate">{proposal.proposal_id}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase">Customer</p>
          <p className="text-xs text-gray-900 truncate">
            {proposal.customer_name?.trim() || "—"}
          </p>
          {proposal.customer_id ? (
            <p className="text-[10px] font-mono text-gray-500 truncate">{proposal.customer_id}</p>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase">Proposal total</p>
          <p className="text-xs font-medium text-gray-900">
            {formatEur(proposal.proposal_amount_eur)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-gray-500 uppercase">Agent</p>
          <p className="text-xs text-gray-900 truncate">
            {proposal.agent_name?.trim() || proposal.agent_id || "—"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function PreferentialSlotBlock({ slot }: { slot: PreferentialSlotApiRow }) {
  const slotContentType = String(slot.slot_content_type ?? "").trim().toLowerCase();
  if (slotContentType === "summary" || slotContentType === "index") {
    const label = slotContentType === "summary" ? "Summary" : "Index";
    const description =
      slotContentType === "summary"
        ? "Reserved for the magazine summary"
        : "Reserved for the advertiser index";
    return (
      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-amber-700">Reserved</p>
        <p className="text-sm font-semibold text-amber-900">{label}</p>
        <p className="text-xs text-amber-800 mt-1">{description}</p>
      </div>
    );
  }

  const stRaw = String(slot.state ?? "").toLowerCase();
  const isBought = stRaw === "bought";
  const isOffered = stRaw === "offered";
  const isAssignedCustomer =
    stRaw === "assigned" && slot.assigned_kind === "customer" && Boolean(slot.assigned_customer_id?.trim());
  const hasAssignedCustomer = isBought || isAssignedCustomer;
  const assignedCustomerId = slot.assigned_customer_id?.trim() || "";
  const assignedCustomerLabel =
    slot.assigned_customer_name?.trim() || assignedCustomerId || "—";

  const offeredProposals = isOffered ? slot.proposal_summaries : [];
  const offeredLineCount = offeredProposals.reduce(
    (acc, p) => acc + (p.service_lines?.length ?? 0),
    0
  );

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill
          label="Customer assigned"
          yes={hasAssignedCustomer}
          yesTone="blue"
          detail={hasAssignedCustomer ? assignedCustomerLabel : null}
        />
        <StatusPill label="Bought" yes={isBought} yesTone="emerald" />
        <StatusPill
          label="Offered"
          yes={isOffered && offeredProposals.length > 0}
          yesTone="amber"
          detail={
            isOffered && offeredProposals.length > 0
              ? `${offeredProposals.length} proposal${
                  offeredProposals.length > 1 ? "s" : ""
                } · ${offeredLineCount} line${offeredLineCount === 1 ? "" : "s"}`
              : null
          }
        />
      </div>

      {hasAssignedCustomer && assignedCustomerId ? (
        <CustomerMiniCard customerId={assignedCustomerId} name={slot.assigned_customer_name} />
      ) : null}

      {isOffered && offeredProposals.length > 0 ? (
        <div className="space-y-2">
          {offeredProposals.flatMap((proposal) => {
            const lines = proposal.service_lines ?? [];
            if (lines.length === 0) {
              return [<ProposalMiniCard key={proposal.proposal_id} row={proposal} />];
            }
            return lines.map((line) => (
              <ProposalServiceLineSubCard
                key={`${proposal.proposal_id}:${line.proposal_service_line_id}`}
                proposal={proposal}
                line={line}
              />
            ));
          })}
        </div>
      ) : null}
    </div>
  );
}

function FlatplanGutterInsertButton({
  entryKey,
  side,
  enabled,
  onAdjacentSlotInsert,
}: {
  entryKey: string;
  side: "before" | "after";
  enabled: boolean;
  onAdjacentSlotInsert: (side: "before" | "after") => void;
}) {
  const drag = useFlatplanArticleDrag();
  const activeDrag = drag?.getActiveDrag() ?? drag?.activeDrag ?? null;
  const isDragging = activeDrag != null;
  const canDrop = Boolean(isDragging && drag?.canDropOn(entryKey, side));
  const isHot =
    canDrop &&
    drag?.hoveredDrop?.entryKey === entryKey &&
    drag?.hoveredDrop?.side === side;

  if (!enabled) return null;

  return (
    <button
      type="button"
      aria-label={side === "before" ? "Insert slot before" : "Insert slot after"}
      className={`${FLATPLAN_PREVIEW_CELL_INSERT_BTN_CLASS} flatplan-insert-btn${
        isDragging ? " flatplan-insert-btn--drag-active" : ""
      }${canDrop ? " !opacity-100 !pointer-events-auto border-emerald-500 ring-2 ring-emerald-300" : ""}${
        isHot ? " !bg-emerald-200" : ""
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragging) return;
        onAdjacentSlotInsert(side);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!drag?.canDropOn(entryKey, side)) return;
        drag.setHoveredDrop({ entryKey, side });
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!drag?.canDropOn(entryKey, side)) {
          e.dataTransfer.dropEffect = "none";
          return;
        }
        e.dataTransfer.dropEffect = "move";
        drag.setHoveredDrop({ entryKey, side });
      }}
      onDragLeave={() => {
        if (
          drag?.hoveredDrop?.entryKey === entryKey &&
          drag?.hoveredDrop?.side === side
        ) {
          drag?.setHoveredDrop(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        drag?.completeDrop(entryKey, side);
      }}
    >
      +
    </button>
  );
}

export type FlatplanPreviewCellProps = {
  publicationId: string;
  entryKey: string;
  side: "Left" | "Right";
  slot: SlotRow | null;
  workingIndex: number;
  /** When true (slots panel reduced / flatplan widened), tiles use the larger flatplan size tier. */
  previewExpanded: boolean;
  highlightedSlotId: number | null;
  /** Bulk-delete flow: whole tile acts as checkbox target for deletable slots. */
  bulkDeleteSelectMode?: boolean;
  bulkDeleteDeletable?: boolean;
  bulkDeleteSelected?: boolean;
  onBulkDeleteToggle?: (publicationSlotId: number) => void;
  /** Shown for non–core-layout slots: inserts a `regular_page` before / after this tile. */
  onAdjacentSlotInsert?: (side: "before" | "after") => void;
};

export function FlatplanPreviewCell({
  publicationId,
  entryKey,
  side,
  slot,
  workingIndex,
  previewExpanded,
  highlightedSlotId,
  bulkDeleteSelectMode = false,
  bulkDeleteDeletable = false,
  bulkDeleteSelected = false,
  onBulkDeleteToggle,
  onAdjacentSlotInsert,
}: FlatplanPreviewCellProps) {
  const tileW = flatplanPreviewTileWidthClass(previewExpanded);
  const tileTransition = FLATPLAN_PREVIEW_TILE_TRANSITION_CLASS;

  if (entryKey === FLATPLAN_BUFFER_KEY) {
    return (
      <div className={FLATPLAN_PREVIEW_CELL_OUTER_SHELL_CLASS}>
        <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden />
        <div
          className={`${tileW} ${FLATPLAN_PAGE_ASPECT_CLASS} shrink-0 opacity-0 pointer-events-none select-none ${tileTransition}`}
          aria-hidden
        />
        <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden />
      </div>
    );
  }
  const rawTopLeft = flatplanWorkingLabel(workingIndex);
  const topLeft =
    isArticlePageSlotEntryKey(entryKey) ||
    rawTopLeft === "-1" ||
    rawTopLeft === "0" ||
    entryKey === "end"
      ? ""
      : rawTopLeft;
  const baseTopRightLabel = isArticlePageSlotEntryKey(entryKey)
    ? slot?.flatplan_publication_article_id != null &&
        slot.flatplan_article_page_index != null &&
        slot.flatplan_article_page_total != null
      ? `Art. ${slot.flatplan_article_page_index}/${slot.flatplan_article_page_total}`
      : `Art. #${articlePageSlotEntryId(entryKey) ?? ""}`
    : slot
      ? magazineSlotsTablePrimaryLabel(slot)
      : entryKey;
  const topRightLabel = isPreferentialInteriorFlatplanEntry(entryKey, slot)
    ? PREFERENTIAL_INTERIOR_FLATPLAN_LABEL
    : baseTopRightLabel;
  const padding = isPaddingSlot(slot);
  const highlighted =
    highlightedSlotId != null &&
    slot?.publication_slot_id != null &&
    slot.publication_slot_id === highlightedSlotId;
  const slotContentType = slot ? normalizeSlotContentType(slot.slot_content_type) : null;
  const primaryFlatplanType: SlotContentTypeOption =
    slotContentType ?? DEFAULT_SLOT_CONTENT_TYPE;
  const primaryFlatplanLabel =
    primaryFlatplanType === "padding"
      ? "Padding"
      : primaryFlatplanType === "summary"
        ? "Summary"
        : primaryFlatplanType === "index"
          ? "Index"
          : primaryFlatplanType === "article"
            ? "Article"
            : "Advert";
  const flatplanSecondaryLine = flatplanSecondaryLineForSlot(slot, primaryFlatplanType);
  const coreStructuralTile =
    !padding &&
    !isArticlePageSlotEntryKey(entryKey) &&
    (slot ? isCoreStructuralMagazineSlot(slot) : isCoreStructuralMagazineEntryKey(entryKey));
  const tileBoxClass = padding
    ? "border border-red-300 bg-red-50 shadow-sm hover:shadow-md hover:border-red-400"
    : coreStructuralTile
      ? "border border-indigo-300/80 bg-gradient-to-br from-indigo-100 to-mist-400 shadow-sm hover:shadow-md hover:border-indigo-400"
      : "border border-gray-200 bg-white shadow-sm hover:shadow-md";
  const highlightClass = highlighted ? "border-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.45)]" : "";
  const topLeftClass = padding ? "font-semibold text-red-700" : "font-semibold text-gray-600";
  const topRightClass = padding ? "text-red-500" : "text-gray-400";
  const sideClass = padding ? "text-red-500" : "text-gray-400";

  const structuralCore =
    slot != null &&
    !isArticlePageSlotRow(slot) &&
    !isPaddingSlot(slot) &&
    isCoreStructuralMagazineSlot(slot);
  const adjacentInsertEnabled =
    Boolean(onAdjacentSlotInsert) && slot != null && !padding && !structuralCore;

  const articleDrag = useFlatplanArticleDrag();
  const isArticleDragSource = Boolean(slot && isFlatplanArticleDragSource(slot));
  const isDraggingThis =
    Boolean(articleDrag?.isDragging && articleDrag.activeDrag?.entryKey === entryKey);
  const isArmedForDrag =
    Boolean(articleDrag?.armedEntryKey && articleDrag.armedEntryKey === entryKey);
  const slotHref =
    slot?.publication_slot_id != null
      ? `${BASE}/${encodeURIComponent(publicationId)}/slots/${slot.publication_slot_id}`
      : null;

  /** Inner pill behind “Advert empty” / “Article empty” (not the whole slot tile). */
  const flatplanCenterTypeBadgeClass =
    primaryFlatplanType === "summary" || primaryFlatplanType === "index"
      ? "border-amber-300 bg-amber-50/95 text-amber-900"
      : primaryFlatplanType === "article"
        ? "border-purple-600 bg-purple-100/95 text-purple-950"
        : primaryFlatplanType === "advert"
          ? "border-blue-600 bg-blue-100/95 text-blue-950"
          : "border-amber-300 bg-amber-50/95 text-amber-900";
  const flatplanCenterTypeBadgeSecondaryClass =
    primaryFlatplanType === "summary" || primaryFlatplanType === "index"
      ? "text-amber-950/90"
      : primaryFlatplanType === "article"
        ? "text-purple-900/90"
        : primaryFlatplanType === "advert"
          ? "text-blue-900/90"
          : "text-amber-950/90";

  /** Editorial article tiles: show publication page on top, slot/content label below (avoids raw `regular_page` in header). */
  const slotKeyLower = String(slot?.slot_key ?? "").trim().toLowerCase();
  const pubPageRaw = slot?.publication_page;
  const pubPageNum =
    pubPageRaw != null && Number.isFinite(Number(pubPageRaw)) ? Math.round(Number(pubPageRaw)) : null;
  const useEditorialPublicationPageHeader =
    !padding &&
    pubPageNum != null &&
    (isArticlePageSlotEntryKey(entryKey) || slotKeyLower === ARTICLE_PAGE_SLOT_KEY);
  const editorialHeaderPageLine = useEditorialPublicationPageHeader ? `Page ${pubPageNum}` : null;
  const editorialCustomerLine = (() => {
    if (!useEditorialPublicationPageHeader || !slot) return null;
    const cid = (slot.customer_id ?? "").trim();
    if (!cid) return null;
    const name = (slot.customer_name ?? "").trim();
    return name || cid;
  })();
  const editorialDetailLine = (() => {
    if (!useEditorialPublicationPageHeader || !slot) return null;
    if (primaryFlatplanType === "advert") {
      const st = (slot.slot_state ?? "").trim();
      return st || "—";
    }
    if (primaryFlatplanType === "article") {
      const paId = slot.flatplan_publication_article_id;
      const xi = slot.flatplan_article_page_index;
      const yt = slot.flatplan_article_page_total;
      if (paId != null && xi != null && yt != null) {
        const name = flatplanArticleArtNameLine(slot.flatplan_publication_art_name);
        if (name) return name;
        const hasArticleThumb =
          Array.isArray(slot.flatplan_preview_chunks) && slot.flatplan_preview_chunks.length > 0;
        if (!hasArticleThumb) return flatplanArticlePageFractionLine(xi, yt);
        return null;
      }
      const portal = (slot.slot_article_id ?? "").trim();
      if (portal) {
        return `Portal article · ${portal.length > 18 ? `${portal.slice(0, 18)}…` : portal}`;
      }
      return "No publication article on this page";
    }
    if (primaryFlatplanType === "summary" || primaryFlatplanType === "index") {
      return "Reserved";
    }
    if (primaryFlatplanType === "padding") {
      return (slot.slot_state ?? "").trim() || "padding";
    }
    return primaryFlatplanLabel;
  })();

  /** Fixed-width side gutters so structural + editorial tiles share the same horizontal footprint. */
  function wrapStableFlatplanRow(inner: React.ReactElement): React.ReactElement {
    return (
      <div className={FLATPLAN_PREVIEW_CELL_OUTER_SHELL_CLASS}>
        <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden={!adjacentInsertEnabled}>
          {adjacentInsertEnabled && onAdjacentSlotInsert ? (
            <FlatplanGutterInsertButton
              entryKey={entryKey}
              side="before"
              enabled
              onAdjacentSlotInsert={onAdjacentSlotInsert}
            />
          ) : null}
        </div>
        {inner}
        <div className={FLATPLAN_PREVIEW_INSERT_GUTTER_COL_CLASS} aria-hidden={!adjacentInsertEnabled}>
          {adjacentInsertEnabled && onAdjacentSlotInsert ? (
            <FlatplanGutterInsertButton
              entryKey={entryKey}
              side="after"
              enabled
              onAdjacentSlotInsert={onAdjacentSlotInsert}
            />
          ) : null}
        </div>
      </div>
    );
  }

  function wrapAdjacentInsert(content: React.ReactElement): React.ReactElement {
    return wrapStableFlatplanRow(content);
  }

  const coverCompositeUrl =
    slotKeyLower === "cover" && slot?.flatplan_cover_composite_url
      ? String(slot.flatplan_cover_composite_url).trim()
      : "";
  const summaryIndexPreviewUrl =
    primaryFlatplanType === "summary"
      ? String(slot?.flatplan_summary_pdf_url ?? "").trim()
      : primaryFlatplanType === "index"
        ? String(slot?.flatplan_index_pdf_url ?? "").trim()
        : "";
  const advertPreviewUrl =
    primaryFlatplanType === "advert"
      ? coverCompositeUrl ||
        (slot?.slot_media_url ? String(slot.slot_media_url).trim() : "")
      : summaryIndexPreviewUrl;
  const articlePreviewChunks =
    primaryFlatplanType === "article" && Array.isArray(slot?.flatplan_preview_chunks)
      ? slot.flatplan_preview_chunks
      : [];
  const hasFlatplanVisualPreview =
    advertPreviewUrl.length > 0 || articlePreviewChunks.length > 0;
  const flatplanThumbTagPad = previewExpanded ? "px-1.5 py-0.5" : "px-1 py-px";
  const flatplanThumbTagText = previewExpanded ? "text-[10px]" : "text-[8px]";
  const flatplanThumbDarkTagBgClass = "bg-gradient-to-r from-zinc-950 to-indigo-950";
  const flatplanThumbPageTagClass = `inline-block max-w-full truncate rounded-sm ${flatplanThumbDarkTagBgClass} font-bold text-yellow-400 leading-tight ${flatplanThumbTagPad} ${flatplanThumbTagText}`;
  const flatplanThumbInfoTagClass = `inline-block max-w-[96%] rounded-sm ${flatplanThumbDarkTagBgClass} text-center font-medium leading-tight text-white ${flatplanThumbTagPad} ${flatplanThumbTagText}`;
  const flatplanThumbSideTagClass = `inline-block rounded-sm bg-gradient-to-r from-amber-400 to-yellow-400 font-bold leading-tight text-black ${flatplanThumbTagPad} ${flatplanThumbTagText}`;
  const flatplanThumbEditorialCenter =
    hasFlatplanVisualPreview && useEditorialPublicationPageHeader;
  const flatplanThumbArtNameLine =
    flatplanThumbEditorialCenter &&
    slot &&
    primaryFlatplanType === "article" &&
    slot.flatplan_publication_article_id != null
      ? flatplanArticleArtNameLine(slot.flatplan_publication_art_name)
      : null;
  const flatplanThumbArticlePageLine =
    flatplanThumbEditorialCenter &&
    slot &&
    primaryFlatplanType === "article" &&
    slot.flatplan_publication_article_id != null &&
    slot.flatplan_article_page_index != null &&
    slot.flatplan_article_page_total != null
      ? flatplanArticlePageFractionLine(
          slot.flatplan_article_page_index,
          slot.flatplan_article_page_total
        )
      : null;
  const flatplanThumbCenterInfoLine =
    flatplanThumbEditorialCenter && editorialDetailLine && !flatplanThumbArtNameLine
      ? editorialDetailLine
      : null;

  const tileInner = (
    <div
      className={`group/flatplan-tile relative ${FLATPLAN_PAGE_ASPECT_CLASS} rounded-lg flex flex-col justify-between ${tileBoxClass} ${highlightClass} ${tileW} ${
        previewExpanded ? "p-2" : "p-1"
      } ${tileTransition} ${bulkDeleteSelectMode && bulkDeleteDeletable ? "cursor-pointer" : "cursor-pointer"}`}
    >
      <div
        className={`relative z-20 flex items-start justify-between ${previewExpanded ? "gap-2" : "gap-1"}`}
      >
        <span
          className={`${topLeftClass} ${previewExpanded ? "text-xs leading-tight" : "text-[10px] leading-tight"} ${tileTransition}`}
        >
          {topLeft}
        </span>
        {flatplanThumbEditorialCenter && editorialHeaderPageLine != null ? (
          <span className={`shrink-0 ${flatplanThumbPageTagClass} ${tileTransition}`}>
            {editorialHeaderPageLine}
          </span>
        ) : useEditorialPublicationPageHeader && editorialHeaderPageLine != null && slot ? (
          <div
            className={`flex min-w-0 max-w-[58%] shrink-0 flex-col items-end text-right ${
              previewExpanded ? "gap-0.5" : "gap-0"
            }`}
          >
            {editorialCustomerLine ? (
              <span
                className={`max-w-full truncate font-medium text-gray-700 ${
                  previewExpanded ? "text-[10px] leading-tight" : "text-[8px] leading-tight"
                } ${tileTransition}`}
              >
                {editorialCustomerLine}
              </span>
            ) : null}
            <span
              className={`font-semibold text-gray-800 ${previewExpanded ? "text-xs leading-tight" : "text-[10px] leading-tight"} ${tileTransition}`}
            >
              {editorialHeaderPageLine}
            </span>
            {editorialDetailLine ? (
              <span
                className={`max-w-full break-words text-gray-700 ${
                  previewExpanded ? "text-[10px] leading-tight" : "text-[8px] leading-tight"
                } ${tileTransition}`}
              >
                {editorialDetailLine}
              </span>
            ) : null}
          </div>
        ) : hasFlatplanVisualPreview && topRightLabel ? (
          <span className={`shrink-0 max-w-[58%] truncate ${flatplanThumbInfoTagClass} ${tileTransition}`}>
            {topRightLabel}
          </span>
        ) : (
          <span
            className={`${topRightClass} ${previewExpanded ? "text-[10px] leading-tight" : "text-[8px] leading-tight"} ${tileTransition}`}
          >
            {topRightLabel}
          </span>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {advertPreviewUrl ? (
          <FlatplanAdvertMediaThumbnail url={advertPreviewUrl} />
        ) : null}
        {articlePreviewChunks.length > 0 && slot ? (
          <FlatplanSlotContentThumbnail
            publicationSlotId={slot.publication_slot_id}
            publicationPage={slot.publication_page}
            articlePageIndex={slot.flatplan_article_page_index ?? 1}
            magazinePageLayout={slot.magazine_page_layout}
            chunks={articlePreviewChunks}
            previewExpanded={previewExpanded}
            className="absolute inset-1 overflow-hidden rounded-md opacity-50 transition-opacity duration-150 group-hover/flatplan-tile:opacity-65"
          />
        ) : null}
        {hasFlatplanVisualPreview ? (
          <div
            className="absolute inset-1 z-[1] rounded-md bg-slate-50/82 transition-colors duration-150 group-hover/flatplan-tile:bg-white/92"
            aria-hidden
          />
        ) : null}
        <div
          className={`absolute inset-x-0 z-10 flex flex-col items-center px-1 pointer-events-none ${
            flatplanThumbEditorialCenter
              ? previewExpanded
                ? "top-7 bottom-7"
                : "top-5 bottom-5"
              : "inset-y-0 justify-center"
          }`}
        >
          {flatplanThumbEditorialCenter ? (
            <div
              className={`flex w-full min-h-0 flex-1 flex-col items-center justify-center ${
                previewExpanded ? "gap-1" : "gap-0.5"
              }`}
            >
              {editorialCustomerLine ? (
                <span className={`max-w-full truncate ${flatplanThumbInfoTagClass}`}>
                  {editorialCustomerLine}
                </span>
              ) : null}
              {flatplanThumbArtNameLine ? (
                <span className={`max-w-full break-words text-center ${flatplanThumbInfoTagClass}`}>
                  {flatplanThumbArtNameLine}
                </span>
              ) : flatplanThumbCenterInfoLine ? (
                <span className={`max-w-full break-words text-center ${flatplanThumbInfoTagClass}`}>
                  {flatplanThumbCenterInfoLine}
                </span>
              ) : null}
            </div>
          ) : null}
          <div
            className={`max-w-full shrink-0 rounded-md border flex flex-col items-center justify-center text-center gap-0.5 ${flatplanCenterTypeBadgeClass} ${
              flatplanThumbEditorialCenter ? (previewExpanded ? "mt-1 mb-0" : "mt-0.5 mb-0") : ""
            } ${previewExpanded ? "px-2 py-1" : "px-1 py-0.5"} ${tileTransition}`}
          >
            <span
              className={`font-semibold tracking-wide uppercase leading-tight truncate w-full ${previewExpanded ? "text-[10px]" : "text-[8px]"} ${tileTransition}`}
            >
              {primaryFlatplanLabel}
            </span>
            {flatplanSecondaryLine != null ? (
              <span
                className={`font-medium normal-case tracking-normal leading-tight truncate w-full ${flatplanCenterTypeBadgeSecondaryClass} ${previewExpanded ? "text-[9px]" : "text-[7px]"} ${tileTransition}`}
              >
                {flatplanSecondaryLine}
              </span>
            ) : null}
          </div>
          {flatplanThumbArticlePageLine ? (
            <span
              className={`max-w-full shrink-0 text-center ${flatplanThumbInfoTagClass} ${
                previewExpanded ? "mt-1" : "mt-0.5"
              }`}
            >
              {flatplanThumbArticlePageLine}
            </span>
          ) : null}
        </div>
      </div>
      <div
        className={`relative z-20 ${hasFlatplanVisualPreview ? "" : sideClass} ${previewExpanded ? "text-[10px]" : "text-[8px]"} ${tileTransition}`}
      >
        {hasFlatplanVisualPreview ? (
          <span className={flatplanThumbSideTagClass}>{side}</span>
        ) : (
          side
        )}
      </div>
    </div>
  );

  if (bulkDeleteSelectMode && bulkDeleteDeletable && slot) {
    return wrapAdjacentInsert(
      <label className={`relative block shrink-0 ${tileTransition}`}>
        <input
          type="checkbox"
          className={`absolute z-20 accent-red-700 rounded border-gray-400 ${
            previewExpanded ? "top-2 left-2 h-4 w-4" : "top-1 left-1 h-3 w-3"
          }`}
          checked={bulkDeleteSelected}
          onChange={() => onBulkDeleteToggle?.(slot.publication_slot_id)}
        />
        {tileInner}
      </label>
    );
  }

  if (bulkDeleteSelectMode && !bulkDeleteDeletable) {
    return wrapAdjacentInsert(
      <div
        className={`block shrink-0 opacity-50 pointer-events-none ${tileTransition}`}
        title="This slot cannot be deleted"
      >
        {tileInner}
      </div>
    );
  }

  if (isArticleDragSource && articleDrag && slot) {
    const paId = String(slot.flatplan_publication_article_id ?? "").trim();
    const showDragHandle = isArmedForDrag || isDraggingThis;
    return wrapAdjacentInsert(
      <div
        className={`group/article-drag-tile relative block shrink-0 ${tileTransition} ${
          isDraggingThis ? "opacity-50" : ""
        }${isArmedForDrag ? " z-40" : ""}`}
      >
        {slotHref ? (
          <Link href={slotHref} className="block" draggable={false}>
            {tileInner}
          </Link>
        ) : (
          <div className="block">{tileInner}</div>
        )}
        <div
          draggable
          role="button"
          tabIndex={0}
          title="Click to select, then drag onto a + gutter to move every page of this article."
          className={`absolute inset-x-0 top-0 z-[70] h-6 cursor-grab rounded-t-lg border border-purple-500/80 bg-purple-100 shadow-sm active:cursor-grabbing ${
            previewExpanded ? "text-[9px]" : "text-[7px]"
          } flex items-center justify-center font-semibold text-purple-950 transition-opacity duration-150${
            showDragHandle
              ? " opacity-100 pointer-events-auto ring-2 ring-purple-400"
              : " opacity-0 pointer-events-none group-hover/article-drag-tile:opacity-100 group-hover/article-drag-tile:pointer-events-auto"
          }${isDraggingThis ? " !opacity-100 !pointer-events-auto" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isArmedForDrag) {
              articleDrag.clearArmedDrag();
            } else {
              articleDrag.armDrag(slot);
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            articleDrag.armDrag(slot);
          }}
          onDragStart={(e) => {
            articleDrag.beginDrag(slot);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", entryKey);
            if (paId) {
              e.dataTransfer.setData("application/x-plynium-flatplan-article", paId);
            }
          }}
          onDragEnd={() => articleDrag.endDrag()}
        >
          {isArmedForDrag ? "Drag to +" : "Click to drag"}
        </div>
      </div>
    );
  }

  return wrapAdjacentInsert(
    <Link href={slotHref ?? "#"} className={`block shrink-0 ${tileTransition}`}>
      {tileInner}
    </Link>
  );
}

export type SlotContentCardProps = {
  publicationId: string;
  slot: SlotRow;
  variant: "expanded" | "reduced";
};

export function SlotContentCard({ publicationId, slot, variant }: SlotContentCardProps) {
  const slotHref = `${BASE}/${encodeURIComponent(publicationId)}/slots/${slot.publication_slot_id}`;
  const projectId = (slot.project_id ?? "").trim();
  const contractId = (slot.project_contract_id ?? "").trim();
  const customerName = (slot.customer_name ?? "").trim();
  const hasProject = projectId !== "";
  const slotContentType = normalizeSlotContentType(slot.slot_content_type);

  if (slotContentType === "summary" || slotContentType === "index") {
    const label = slotContentType === "summary" ? "Summary" : "Index";
    const description =
      slotContentType === "summary"
        ? "Reserved for the magazine summary"
        : "Reserved for the advertiser index";
    return (
      <Link
        href={slotHref}
        className="block rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm hover:border-amber-400 hover:shadow transition"
      >
        <p className="text-xs uppercase tracking-wide text-amber-700">Reserved</p>
        <p className="text-sm font-semibold text-amber-900">{label}</p>
        {variant === "expanded" ? (
          <p className="text-xs text-amber-800 mt-1">{description}</p>
        ) : null}
      </Link>
    );
  }

  if (isArticlePageSlotRow(slot) && slotContentType === "article" && !hasProject) {
    return (
      <Link
        href={slotHref}
        className="block rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm hover:border-emerald-400 hover:shadow transition"
      >
        <p className="text-xs uppercase tracking-wide text-emerald-700">Article page</p>
        <p className="text-sm font-semibold text-emerald-950">Slot #{slot.publication_slot_id}</p>
        {variant === "expanded" && slot.slot_article_id ? (
          <p className="text-xs font-mono text-emerald-800 mt-1 break-all">{slot.slot_article_id}</p>
        ) : null}
      </Link>
    );
  }

  if (variant === "reduced") {
    return (
      <Link
        href={slotHref}
        className="block rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 hover:shadow transition"
      >
        <p className="text-xs uppercase tracking-wide text-gray-400">Customer</p>
        <p className="text-sm text-gray-500 truncate">{customerName || "—"}</p>
        <p className="text-xs uppercase tracking-wide text-gray-400 mt-2">Project</p>
        <p className="text-sm text-gray-500 font-mono truncate">{projectId || "—"}</p>
      </Link>
    );
  }

  if (!hasProject) {
    return (
      <Link
        href={slotHref}
        className="block rounded-lg border border-dashed border-gray-300 bg-white p-3 shadow-sm hover:border-blue-300 hover:shadow transition"
      >
        <p className="text-sm font-medium text-gray-700">Unassigned slot</p>
        <p className="text-xs text-gray-500 mt-1">Click here to add a project</p>
      </Link>
    );
  }

  return (
    <Link
      href={slotHref}
      className="block rounded-lg border border-indigo-100 bg-white p-3 shadow-sm hover:border-indigo-300 hover:shadow transition"
    >
      <div className="flex flex-row gap-4">
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Project ID</p>
          <p className="text-xs font-mono text-gray-900 break-all">{projectId}</p>
        </div>
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] uppercase tracking-wide text-gray-500">Contract ID</p>
          <p className="text-xs font-mono text-gray-900 break-all">{contractId || "—"}</p>
        </div>
      </div>
      <div className="flex flex-col mt-2 pt-2 border-t border-gray-100 min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-500">Customer</p>
        <p className="text-sm text-gray-900 truncate">{customerName || "—"}</p>
      </div>
    </Link>
  );
}

/**
 * Cover masthead inspired by Vidrio magazine covers: black band, vertical URL
 * mark, big bold title and a compact subtitle underneath.
 */
export function CoverHeader({
  magazineName,
  fallbackName,
  subtitle,
  headerDomain,
  specialEditionSubtitle,
}: {
  magazineName: string | null;
  fallbackName: string;
  subtitle: string;
  headerDomain: string;
  /**
   * When non-empty, rendered as an additional line right under the magazine
   * subtitle. Intended to be passed only when `is_special_edition` is true so
   * it appears exclusively for the current publication.
   */
  specialEditionSubtitle?: string;
}) {
  const display = magazineName?.trim() || fallbackName.trim() || "Magazine";
  const domain = headerDomain.trim() || "vidrioperfil.com";
  const subtitleText = subtitle.trim() || "Flat glass and related industries";
  const specialEditionLine = (specialEditionSubtitle ?? "").trim();
  const len = display.length;
  const titleFontSize =
    len <= 6
      ? "clamp(31px, 9.1vw, 88px)"
      : len <= 9
      ? "clamp(26px, 7.3vw, 73px)"
      : len <= 13
      ? "clamp(21px, 5.5vw, 52px)"
      : len <= 18
      ? "clamp(17px, 4.4vw, 39px)"
      : "clamp(14px, 3.6vw, 31px)";
  const isGlassinformer = display.replace(/\s+/g, "").toLowerCase() === "glassinformer";
  return (
    <div className="h-full w-full bg-black text-white relative overflow-hidden px-3 py-2">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.38),transparent_48%)]" />
      <div className="relative z-10 h-full flex items-center">
        <div className="w-8 h-full flex items-center justify-center shrink-0">
          <div className="-rotate-90 whitespace-nowrap text-[10px] tracking-wide text-white/80">
            {domain}
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center px-2">
          <p
            className="font-sans font-black uppercase leading-none text-center w-full"
            style={{
              fontSize: titleFontSize,
              letterSpacing: "-0.02em",
              color: isGlassinformer ? undefined : "transparent",
              background: isGlassinformer
                ? undefined
                : "linear-gradient(90deg, #1f2937 0%, #1f2937 50%, #1e6fd9 50%, #1e6fd9 100%)",
              WebkitBackgroundClip: isGlassinformer ? undefined : "text",
              backgroundClip: isGlassinformer ? undefined : "text",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
            title={display}
          >
            {isGlassinformer ? (
              <>
                <span className="text-[#1e6fd9]">Glass</span>
                <span className="text-[#f1f5f9]">Informer</span>
              </>
            ) : (
              display
            )}
          </p>
          <p className="mt-1 font-sans text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 truncate max-w-full">
            {subtitleText}
          </p>
          {specialEditionLine ? (
            <p className="mt-0.5 font-sans text-[9px] sm:text-[10px] italic font-medium tracking-[0.18em] text-amber-200/90 truncate max-w-full">
              {specialEditionLine}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Left article strip inspired by professional magazine covers.
 */
export function ArticleMenu({
  miniatures,
  publicationYear,
  thisYearIssue,
  redBoxHeader,
  redBoxBody,
}: {
  miniatures: CoverMarginArticleMiniature[];
  publicationYear: number | null;
  thisYearIssue: number | null;
  redBoxHeader: string;
  redBoxBody: string;
}) {
  const issueCode =
    publicationYear != null && thisYearIssue != null
      ? `${publicationYear}-${thisYearIssue}`
      : "—";
  const issueLabel =
    publicationYear != null && thisYearIssue != null
      ? `${ordinal(thisYearIssue)} publication year ${publicationYear}`
      : "—";
  const headerLine =
    redBoxHeader.trim() || `1889 · ${publicationYear ?? "2026"}`;
  const bodyLines = (redBoxBody.trim() || "Spain\nPortugal\nAndorra")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <div className="h-full w-full flex flex-col bg-white border-r-2 border-black/30 relative">
      <div className="absolute left-1 -right-8 -top-7 z-30 pointer-events-none">
        <div className="-rotate-6 border-[3px] border-white bg-[#c5162e] text-white shadow-2xl px-3 py-3 text-center pointer-events-auto mx-auto">
          <p className="text-[14px] font-black tracking-tight leading-tight">
            {headerLine}
          </p>
          {bodyLines.map((line, index) => (
            <p
              key={`${line}-${index}`}
              className="text-[10px] uppercase font-bold tracking-wide leading-snug mt-0.5"
            >
              {line}
            </p>
          ))}
        </div>
      </div>
      <div className="h-32 shrink-0" />
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-2 flex flex-col justify-start">
        {miniatures.map((row, idx) => {
          const text = row.currentContent?.trim()
            ? row.currentContent
            : COVER_MARGIN_PLACEHOLDER_LOREM;
          const isLast = idx === miniatures.length - 1;
          return (
            <div
              key={row.position}
              className={`py-4 text-right ${isLast ? "" : "border-b border-black/10"}`}
            >
              <p
                className="font-bold uppercase tracking-tight text-gray-500"
                style={{ fontSize: "clamp(11px, 1.2vw, 14px)" }}
              >
                Article {row.position}
              </p>
              <p
                className="mt-1 font-sans font-normal uppercase text-black leading-tight line-clamp-3"
                style={{ fontSize: "clamp(7px, 0.85vw, 10px)" }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
      <div className="pl-6 pr-3 pb-7 pt-2 bg-white text-right">
        <p
          className="font-sans font-semibold leading-none text-black tabular-nums"
          style={{ fontSize: "clamp(18px, 2.6vw, 34px)", letterSpacing: "-0.03em" }}
        >
          {issueCode}
        </p>
        <p className="mt-1 text-[9px] uppercase tracking-wide text-gray-500 leading-tight">
          {issueLabel}
        </p>
      </div>
    </div>
  );
}

/**
 * Main advert area shown beneath the masthead.
 */
export function CoverAdvert({
  imageUrl,
  alt,
}: {
  imageUrl: string | null;
  alt: string;
}) {
  return (
    <div className="h-full w-full bg-[#f3f3f0] overflow-hidden">
      {imageUrl ? (
        <div className="relative h-full w-full" aria-label={alt}>
          <FlatplanAdvertMediaThumbnail
            url={imageUrl}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className="h-full w-full flex items-start justify-center relative"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 18%, rgba(255,255,255,0.9) 0 8%, transparent 9% 100%), linear-gradient(135deg, rgba(255,255,255,0.96), rgba(221,221,214,0.82)), linear-gradient(28deg, transparent 0 34%, rgba(255,255,255,0.85) 34% 37%, transparent 37% 100%), linear-gradient(145deg, transparent 0 58%, rgba(0,0,0,0.06) 58% 60%, transparent 60% 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:34px_34px]" />
          <div className="relative mt-[18%] text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35">
              Advertising space
            </p>
            <p className="mt-2 text-2xl font-black uppercase tracking-tight text-black/20">
              Cover advert
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
