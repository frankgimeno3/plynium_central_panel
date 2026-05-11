"use client";

import React from "react";
import Link from "next/link";

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
};

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

export const BASE = "/logged/pages/production/publications";
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
export const SUMMARY_INDEX_SLOT_KEYS = new Set(["2", "4", "6", "8"]);

/**
 * `slot_state` value used for artificial padding slots inserted automatically
 * to keep the magazine page count valid.
 */
export const PADDING_SLOT_STATE = "padding";

/** Sentinel entries in `flatplan_position_working_list` (not DB slots). */
export const FLATPLAN_BUFFER_KEY = "__flatplan_buffer__";

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

/** Human spread index: 0 cover, 1 inside, 2… for numeric keys, end follows last interior. */
export function spreadIndexLabel(slotKey: string, maxNumericKey: number): string {
  const k = String(slotKey || "");
  if (k === "cover") return "0";
  if (k === "inside_cover") return "1";
  if (k === "end") return String(Math.max(10, maxNumericKey + 2));
  if (isNumericSlotKey(k)) return String(Number(k) + 1);
  return k;
}

export function normalizeSlotContentType(value: unknown): SlotContentTypeOption {
  const v = String(value ?? "").trim().toLowerCase();
  return (SLOT_CONTENT_TYPE_OPTIONS as readonly string[]).includes(v)
    ? (v as SlotContentTypeOption)
    : DEFAULT_SLOT_CONTENT_TYPE;
}

export function allowedSlotContentTypes(
  slotKey: string | null | undefined
): SlotContentTypeOption[] {
  const key = String(slotKey ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= 9) {
    return SUMMARY_INDEX_SLOT_KEYS.has(String(n))
      ? ["advert", "summary", "index"]
      : ["advert"];
  }
  return ["advert", "article"];
}

export function isPaddingSlot(slot: SlotRow | null | undefined): boolean {
  return String(slot?.slot_state ?? "").toLowerCase() === PADDING_SLOT_STATE;
}

/**
 * Number of artificial padding slots needed so `k % 4 === 1`.
 */
export function paddingSlotsNeeded(k: number): number {
  const safe = Number.isFinite(k) && k >= 0 ? Math.trunc(k) : 0;
  return ((1 - safe) % 4 + 4) % 4;
}

/** Column width = two tiles + inner row gap. */
export function flatplanPreviewColClass(previewExpanded: boolean): string {
  return previewExpanded ? "w-[576px] shrink-0" : "w-[288px] shrink-0";
}

export function flatplanSlotSortKey(slotKey: string): number {
  const k = String(slotKey || "");
  const articleSlotId = articlePageSlotEntryId(k);
  if (articleSlotId != null) return 9500 + articleSlotId;
  if (k === "cover") return 0;
  if (k === "inside_cover") return 1;
  if (k === "end") return 10000;
  if (isNumericSlotKey(k)) return 2 + Number(k);
  return 5000;
}

export function chunkKeysIntoPairs(keys: string[]): [string, string | undefined][] {
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < keys.length; i += 2) {
    pairs.push([keys[i], keys[i + 1]]);
  }
  return pairs;
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

export type FlatplanPreviewCellProps = {
  publicationId: string;
  entryKey: string;
  side: "Left" | "Right";
  slot: SlotRow | null;
  workingIndex: number;
  /** When true (slots panel reduced / flatplan widened), tiles and type double ~2×. */
  previewExpanded: boolean;
  highlightedSlotId: number | null;
};

export function FlatplanPreviewCell({
  publicationId,
  entryKey,
  side,
  slot,
  workingIndex,
  previewExpanded,
  highlightedSlotId,
}: FlatplanPreviewCellProps) {
  const tileW = previewExpanded ? "w-[280px] min-w-[280px]" : "w-[140px] min-w-[140px]";
  const tileTransition =
    "motion-reduce:transition-none motion-reduce:duration-0 transition-[width,min-width,padding,font-size,line-height,box-shadow,border-color] duration-[1400ms] ease-in-out";

  if (entryKey === FLATPLAN_BUFFER_KEY) {
    return (
      <div
        className={`${tileW} aspect-square shrink-0 opacity-0 pointer-events-none select-none ${tileTransition}`}
        aria-hidden
      />
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
  const topRightLabel = isArticlePageSlotEntryKey(entryKey)
    ? `Art. #${articlePageSlotEntryId(entryKey) ?? ""}`
    : entryKey;
  const padding = isPaddingSlot(slot);
  const highlighted =
    highlightedSlotId != null &&
    slot?.publication_slot_id != null &&
    slot.publication_slot_id === highlightedSlotId;
  const slotContentType = slot ? normalizeSlotContentType(slot.slot_content_type) : null;
  const reservedLabel =
    slotContentType === "summary"
      ? "Summary"
      : slotContentType === "index"
        ? "Index"
        : isArticlePageSlotEntryKey(entryKey) || (slot && isArticlePageSlotRow(slot))
          ? "Article"
          : null;
  const tileBoxClass = padding
    ? "border border-red-300 bg-red-50 shadow-sm hover:shadow-md hover:border-red-400"
    : "border border-gray-200 bg-white shadow-sm hover:shadow-md";
  const highlightClass = highlighted ? "border-slate-900 shadow-[0_12px_28px_rgba(15,23,42,0.45)]" : "";
  const topLeftClass = padding ? "font-semibold text-red-700" : "font-semibold text-gray-600";
  const topRightClass = padding ? "text-red-500" : "text-gray-400";
  const sideClass = padding ? "text-red-500" : "text-gray-400";
  return (
    <Link
      href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${slot?.publication_slot_id ?? ""}`}
      className={`block shrink-0 ${tileTransition}`}
    >
      <div
        className={`relative aspect-square rounded-lg cursor-pointer flex flex-col justify-between ${tileBoxClass} ${highlightClass} ${tileW} ${
          previewExpanded ? "p-4 gap-2" : "p-2"
        } ${tileTransition}`}
      >
        <div className={`flex items-start justify-between ${previewExpanded ? "gap-3" : "gap-2"}`}>
          <span
            className={`${topLeftClass} ${previewExpanded ? "text-base leading-tight" : "text-xs"} ${tileTransition}`}
          >
            {topLeft}
          </span>
          <span
            className={`${topRightClass} ${previewExpanded ? "text-sm leading-tight" : "text-[10px]"} ${tileTransition}`}
          >
            {topRightLabel}
          </span>
        </div>
        {/* Reserved overlay for summary / index slots. */}
        {reservedLabel ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span
              className={`rounded-md border border-amber-300 bg-amber-50/95 text-amber-900 font-semibold tracking-wide uppercase ${
                previewExpanded ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-[10px]"
              } ${tileTransition}`}
            >
              {reservedLabel}
            </span>
          </div>
        ) : null}
        <div className={`${sideClass} ${previewExpanded ? "text-sm" : "text-[10px]"} ${tileTransition}`}>{side}</div>
      </div>
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
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="h-full w-full flex items-center justify-center relative"
          style={{
            backgroundImage:
              "linear-gradient(135deg,rgba(255,255,255,0.95),rgba(220,220,214,0.78)), linear-gradient(30deg, transparent 0 42%, rgba(255,255,255,0.8) 42% 44%, transparent 44% 100%), linear-gradient(145deg, transparent 0 58%, rgba(0,0,0,0.04) 58% 60%, transparent 60% 100%)",
          }}
        >
          <div className="text-center">
            <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em] text-black/35">
              Advertising space
            </p>
            <p className="mt-2 text-2xl font-black uppercase tracking-tight text-black/15">
              Cover advert
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
