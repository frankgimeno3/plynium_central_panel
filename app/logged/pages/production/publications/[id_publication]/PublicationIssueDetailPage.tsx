"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import MoveContentTypeModal, {
  MovableContentType,
} from "@/app/logged/logged_components/modals/MoveContentTypeModal";

type PublicationDbRow = {
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

/** Hard cap enforced on the editable Red Box body input. */
const RED_BOX_BODY_MAX_WORDS = 25;

/** Truncate `text` so it contains at most `maxWords` whitespace-separated words. */
function limitToWords(text: string, maxWords: number): string {
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

function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

type SlotRow = {
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

type PreferentialProposalSummary = {
  proposal_id: string;
  customer_id: string | null;
  customer_name: string | null;
  proposal_status: string | null;
  title: string | null;
};

type PreferentialSlotApiRow = {
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

type CoverMarginArticleMiniature = {
  position: number;
  article: {
    id: string;
    title: string;
  } | null;
  currentContent: string;
  draftContent: string;
  editing: boolean;
};

type MagazineApiRow = {
  id_magazine: string;
  name: string;
  subtitle?: string;
};

type TabId = "data" | "flatplan";

const BASE = "/logged/pages/production/publications";
const PROPOSALS_BASE = "/logged/pages/account-management/proposals";

function ordinal(n: number | null | undefined): string {
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

function CustomerMiniCard({ customerId, name }: { customerId: string; name?: string | null }) {
  return (
    <div className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm">
      <p className="text-[10px] text-gray-500 uppercase tracking-wide">Customer</p>
      <p className="text-sm font-medium text-gray-900 mt-0.5">{name?.trim() ? name : "—"}</p>
      <p className="text-xs font-mono text-gray-600 mt-1 break-all">{customerId}</p>
    </div>
  );
}

function ProposalMiniCard({ row }: { row: PreferentialProposalSummary }) {
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

function PreferentialSlotBlock({ slot }: { slot: PreferentialSlotApiRow }) {
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

  if (slot.missing || slot.state == null || slot.state === "") {
    return <p className="text-xs text-amber-800 mt-2">No preferential slot row for this position.</p>;
  }

  const st = slot.state.toLowerCase();
  const isBought = st === "bought";
  const custId = slot.assigned_customer_id?.trim() ?? "";

  return (
    <div className="mt-2 space-y-2">
      {isBought ? (
        <>
          <p className="text-xs font-semibold text-emerald-800">Bought</p>
          {custId ? (
            <CustomerMiniCard customerId={custId} name={slot.assigned_customer_name} />
          ) : (
            <p className="text-xs text-gray-500">No customer on record.</p>
          )}
        </>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-700">Not Bought</p>
          <p className="text-xs text-gray-600">
            State: <span className="font-medium text-gray-800">{slot.state}</span>
          </p>
          {st === "assigned" && slot.assigned_kind === "summary" ? (
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm text-sm text-gray-800">
              Assigned to publication layout: summary
            </div>
          ) : null}
          {st === "assigned" && slot.assigned_kind === "advertiser_index" ? (
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm text-sm text-gray-800">
              Assigned to publication layout: advertiser index
            </div>
          ) : null}
          {st === "assigned" && slot.assigned_kind === "customer" && custId ? (
            <CustomerMiniCard customerId={custId} name={slot.assigned_customer_name} />
          ) : null}
          {st === "offered" && slot.proposal_summaries.length > 0 ? (
            <div className="space-y-2">
              {slot.proposal_summaries.map((p) => (
                <ProposalMiniCard key={p.proposal_id} row={p} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function monthName(m: number | null): string {
  if (m == null || m < 1 || m > 12) return "—";
  return new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" });
}

function toNullableInt(v: string): number | null {
  const t = String(v ?? "").trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNullableMonth(v: string): number | null {
  const n = toNullableInt(v);
  if (n == null) return null;
  if (n < 1 || n > 12) return null;
  return n;
}

function normalizeDateString(v: string): string | null {
  const t = String(v ?? "").trim();
  return t === "" ? null : t;
}

function isNumericSlotKey(k: string): boolean {
  const n = Number(k);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1;
}

/** Human spread index: 0 cover, 1 inside, 2… for numeric keys (slot_key n → label n+1), end follows last interior. */
function spreadIndexLabel(slotKey: string, maxNumericKey: number): string {
  const k = String(slotKey || "");
  if (k === "cover") return "0";
  if (k === "inside_cover") return "1";
  if (k === "end") return String(Math.max(10, maxNumericKey + 2));
  if (isNumericSlotKey(k)) return String(Number(k) + 1);
  return k;
}

const MIN_FLATPLAN_NUMERIC_KEYS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/** Canonical set of slot_content_type values exposed in the editable Slots table. */
const SLOT_CONTENT_TYPE_OPTIONS = ["advert", "article", "summary", "index"] as const;
type SlotContentTypeOption = (typeof SLOT_CONTENT_TYPE_OPTIONS)[number];
const DEFAULT_SLOT_CONTENT_TYPE: SlotContentTypeOption = "advert";
const LOCKED_ADVERT_SLOT_KEYS = new Set(["cover", "inside_cover", "inside cover", "end", "end_page", "end page"]);
const SUMMARY_INDEX_SLOT_KEYS = new Set(["2", "4", "6", "8"]);

function normalizeSlotContentType(value: unknown): SlotContentTypeOption {
  const v = String(value ?? "").trim().toLowerCase();
  return (SLOT_CONTENT_TYPE_OPTIONS as readonly string[]).includes(v)
    ? (v as SlotContentTypeOption)
    : DEFAULT_SLOT_CONTENT_TYPE;
}

function allowedSlotContentTypes(slotKey: string | null | undefined): SlotContentTypeOption[] {
  const key = String(slotKey ?? "").trim().toLowerCase();
  if (LOCKED_ADVERT_SLOT_KEYS.has(key)) return ["advert"];
  const n = Number(key);
  if (Number.isInteger(n) && n >= 1 && n <= 9) {
    return SUMMARY_INDEX_SLOT_KEYS.has(String(n)) ? ["advert", "summary", "index"] : ["advert"];
  }
  return ["advert", "article"];
}

/**
 * `slot_state` value used for artificial padding slots inserted automatically
 * to keep the magazine page count valid (multiple of 4 inner items, i.e.
 * numeric pages count `k` such that `k % 4 === 1`). Padding slots are surfaced
 * with a red row in the Slots table and a red tile in the Flatplan preview
 * to flag the parity issue.
 */
const PADDING_SLOT_STATE = "padding";

function isPaddingSlot(slot: SlotRow | null | undefined): boolean {
  return String(slot?.slot_state ?? "").toLowerCase() === PADDING_SLOT_STATE;
}

/**
 * Number of artificial padding slots we need to add so the numeric page count
 * `k` satisfies `k % 4 === 1`. With cover + inside_cover + k + end = k + 3
 * inner items, the layout fits cleanly (left has one more row than right and
 * both extremes are complete) only when `k + 3 ≡ 0 (mod 4)`.
 */
function paddingSlotsNeeded(k: number): number {
  const safe = Number.isFinite(k) && k >= 0 ? Math.trunc(k) : 0;
  return ((1 - safe) % 4 + 4) % 4;
}

/** Sentinel entries in `flatplan_position_working_list` (not DB slots). */
const FLATPLAN_BUFFER_KEY = "__flatplan_buffer__";

/** Column width = two tiles + inner row gap (matches widest row in that column). */
function flatplanPreviewColClass(previewExpanded: boolean): string {
  return previewExpanded ? "w-[576px] shrink-0" : "w-[288px] shrink-0";
}

function flatplanSlotSortKey(slotKey: string): number {
  const k = String(slotKey || "");
  if (k === "cover") return 0;
  if (k === "inside_cover") return 1;
  if (k === "end") return 10000;
  if (isNumericSlotKey(k)) return 2 + Number(k);
  return 5000;
}

function chunkKeysIntoPairs(keys: string[]): [string, string | undefined][] {
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < keys.length; i += 2) {
    pairs.push([keys[i], keys[i + 1]]);
  }
  return pairs;
}

/** Label from working-list index (top-left number = index − 2 → cover −1, inside 0, …). */
function flatplanWorkingLabel(workingIndex: number): string {
  return String(workingIndex - 2);
}

type FlatplanPreviewCellProps = {
  publicationId: string;
  entryKey: string;
  side: "Left" | "Right";
  slot: SlotRow | null;
  workingIndex: number;
  /** When true (slots panel reduced / flatplan widened), tiles and type double ~2×. */
  previewExpanded: boolean;
  highlightedSlotId: number | null;
};

function FlatplanPreviewCell({
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
  const topLeft = rawTopLeft === "-1" || rawTopLeft === "0" || entryKey === "end" ? "" : rawTopLeft;
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
            {entryKey}
          </span>
        </div>
        {/* Reserved overlay for summary / index slots so the role is visible
            from the flatplan preview at a glance. */}
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

type SlotContentCardProps = {
  publicationId: string;
  slot: SlotRow;
  variant: "expanded" | "reduced";
};

function SlotContentCard({ publicationId, slot, variant }: SlotContentCardProps) {
  const slotHref = `${BASE}/${encodeURIComponent(publicationId)}/slots/${slot.publication_slot_id}`;
  const projectId = (slot.project_id ?? "").trim();
  const contractId = (slot.project_contract_id ?? "").trim();
  const customerName = (slot.customer_name ?? "").trim();
  const hasProject = projectId !== "";
  const slotContentType = normalizeSlotContentType(slot.slot_content_type);

  // Slots reserved for the magazine summary or advertiser index don't carry
  // a customer/project relation, so we render a dedicated card flagging the
  // reservation instead of the customer/project layout.
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
 * mark, huge italic glass-like title, and a compact subtitle underneath.
 */
function Cabecera({
  magazineName,
  fallbackName,
  subtitle,
  headerDomain,
}: {
  magazineName: string | null;
  fallbackName: string;
  subtitle: string;
  headerDomain: string;
}) {
  const display = magazineName?.trim() || fallbackName.trim() || "Magazine";
  const domain = headerDomain.trim() || "vidrioperfil.com";
  const subtitleText = subtitle.trim() || "Plano e industrias afines";
  /**
   * Pick a font size band based on the name length so long titles never
   * get cropped. Tuned for the typical cover preview width (~1/2 of the
   * Data tab grid).
   */
  const len = display.length;
  const titleFontSize =
    len <= 6
      ? "clamp(24px, 7vw, 68px)"
      : len <= 9
      ? "clamp(20px, 5.6vw, 56px)"
      : len <= 13
      ? "clamp(16px, 4.2vw, 40px)"
      : len <= 18
      ? "clamp(13px, 3.4vw, 30px)"
      : "clamp(11px, 2.8vw, 24px)";
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
              letterSpacing: "-0.025em",
              background:
                "linear-gradient(180deg,#f3f6fa 0%,#c4cdd8 45%,#6b7785 60%,#2c3744 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextStroke: "0.4px rgba(255,255,255,0.25)",
              textShadow:
                "0 1px 0 rgba(255,255,255,0.45), 0 3px 6px rgba(0,0,0,0.55), 0 6px 14px rgba(0,0,0,0.45)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "clip",
            }}
            title={display}
          >
            {display}
          </p>
          <p className="mt-1 font-sans text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.22em] text-white/75 truncate max-w-full">
            {subtitleText}
          </p>
        </div>
      </div>
    </div>
  );
}

const COVER_MARGIN_PLACEHOLDER_LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";

/**
 * Left article strip inspired by the supplied cover: white column, red stamp,
 * compact uppercase teasers aligned to the right, and a large issue number
 * block at the bottom.
 */
function ArticleMenu({
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
  const bodyLines = (redBoxBody.trim() || "España\nPortugal\nAndorra")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    <div className="h-full w-full flex flex-col bg-white border-r-2 border-black/30 relative">
      {/*
        Red angled stamp. Absolutely positioned so it visually bleeds upward
        into the black Cabecera and rightward over the CoverAdvert, creating
        the dynamic overlap typical of magazine covers.
      */}
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
      {/*
        Spacer that keeps the article teasers visually clear of the red stamp
        bleed. The stamp is absolutely positioned, so this purely creates
        breathing room above the first article.
      */}
      <div className="h-32 shrink-0" />
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2 flex flex-col justify-start">
        {miniatures.map((row, idx) => {
          const text = row.currentContent?.trim()
            ? row.currentContent
            : COVER_MARGIN_PLACEHOLDER_LOREM;
          const isLast = idx === miniatures.length - 1;
          return (
            <div
              key={row.position}
              className={`py-2 text-right ${isLast ? "" : "border-b border-black/10"}`}
            >
              <p className="text-[8px] font-black uppercase tracking-tight text-black">
                Article {row.position}
              </p>
              <p
                className="mt-0.5 font-sans font-bold uppercase text-black/85 leading-tight line-clamp-3"
                style={{ fontSize: "clamp(7px, 0.85vw, 10px)" }}
              >
                {text}
              </p>
            </div>
          );
        })}
      </div>
      <div className="px-3 pb-4 pt-2 bg-white">
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
 * Main advert area: bright, geometric, and clean like the supplied cover.
 * The floating "Cover image" management box is anchored over this region by
 * the parent.
 */
function CoverAdvert({ imageUrl, alt }: { imageUrl: string | null; alt: string }) {
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

export const PublicationIssueDetailPage: FC<{ publicationId: string }> = ({ publicationId }) => {
  const { setPageMeta } = usePageContent();

  const [activeTab, setActiveTab] = useState<TabId>("data");
  const [publication, setPublication] = useState<PublicationDbRow | null>(null);
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [preferentialSlots, setPreferentialSlots] = useState<PreferentialSlotApiRow[]>([]);
  const [magazine, setMagazine] = useState<MagazineApiRow | null>(null);
  /** Flatplan tab: slots panel docked to 1/4 width with reduced table. */
  const [slotsReduced, setSlotsReduced] = useState(false);
  const [hoveredSlotId, setHoveredSlotId] = useState<number | null>(null);
  const flatplanAutoCollapseTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Active "Change Summary/Index Location" modal state. Holds the content type
   * being moved and an optional initial target (used when the modal is opened
   * from the Type select inside the Slots editable table).
   */
  const [moveContentTypeModal, setMoveContentTypeModal] = useState<{
    contentType: MovableContentType;
    initialTarget: string | null;
  } | null>(null);
  const [coverMarginArticleModalPosition, setCoverMarginArticleModalPosition] =
    useState<number | null>(null);
  const [coverMarginMiniatures, setCoverMarginMiniatures] = useState<
    CoverMarginArticleMiniature[]
  >(() =>
    Array.from({ length: 6 }, (_, index) => ({
      position: index + 1,
      article: null,
      currentContent: "",
      draftContent: "",
      editing: false,
    }))
  );
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pubRes, slotsRes, prefRes] = await Promise.all([
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);
      if (!pubRes.ok) throw new Error("Failed to load issue");
      const pub = (await pubRes.json()) as PublicationDbRow;
      const slotList = slotsRes.ok ? ((await slotsRes.json()) as SlotRow[]) : [];
      setPublication(pub);
      setSlots(Array.isArray(slotList) ? slotList : []);
      if (prefRes.ok) {
        const prefJson = (await prefRes.json()) as { slots?: PreferentialSlotApiRow[] };
        setPreferentialSlots(Array.isArray(prefJson?.slots) ? prefJson.slots : []);
      } else {
        setPreferentialSlots([]);
      }
      if (pub.magazine_id) {
        try {
          const magRes = await fetch(
            `/api/v1/magazines/${encodeURIComponent(pub.magazine_id)}`,
            { cache: "no-store", credentials: "include" }
          );
          setMagazine(magRes.ok ? ((await magRes.json()) as MagazineApiRow) : null);
        } catch {
          setMagazine(null);
        }
      } else {
        setMagazine(null);
      }
    } catch (e: any) {
      setPublication(null);
      setSlots([]);
      setPreferentialSlots([]);
      setMagazine(null);
      setError(e?.message ?? "Failed to load issue");
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Swap the publication slot that owns the reserved `content_type`
   * (summary / index) with the publication slot at `targetPosition`. The
   * backend handles the swap atomically; we just refresh local state when it
   * succeeds so the Flatplan, Slots table and Preferential placements pick up
   * the new layout.
   */
  const moveReservedContentType = React.useCallback(
    async (contentType: MovableContentType, targetPosition: string) => {
      const res = await fetch(
        `/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots/move-content-type`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            content_type: contentType,
            target_position: targetPosition,
          }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let message = txt || `Failed to move ${contentType} location.`;
        try {
          const j = JSON.parse(txt);
          if (j?.message) message = String(j.message);
        } catch {}
        throw new Error(message);
      }
      await load();
    },
    [publicationId, load]
  );

  useEffect(() => {
    if (coverMarginArticleModalPosition == null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCoverMarginArticleModalPosition(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [coverMarginArticleModalPosition]);

  const selectPlaceholderCoverMarginArticle = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) => {
        if (row.position !== position) return row;
        const article = {
          id: `placeholder-article-${position}`,
          title: `Placeholder article ${position}`,
        };
        const content = `Display content for ${article.title}.`;
        return {
          ...row,
          article,
          currentContent: content,
          draftContent: content,
          editing: false,
        };
      })
    );
    setCoverMarginArticleModalPosition(null);
  }, []);

  const removeCoverMarginArticle = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? {
              ...row,
              article: null,
              currentContent: "",
              draftContent: "",
              editing: false,
            }
          : row
      )
    );
  }, []);

  const startEditingCoverMarginContent = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? { ...row, draftContent: row.currentContent, editing: true }
          : row
      )
    );
  }, []);

  const updateCoverMarginDraftContent = React.useCallback(
    (position: number, draftContent: string) => {
      setCoverMarginMiniatures((prev) =>
        prev.map((row) => (row.position === position ? { ...row, draftContent } : row))
      );
    },
    []
  );

  const saveCoverMarginDraftContent = React.useCallback((position: number) => {
    setCoverMarginMiniatures((prev) =>
      prev.map((row) =>
        row.position === position
          ? { ...row, currentContent: row.draftContent, editing: false }
          : row
      )
    );
  }, []);

  useEffect(() => {
    if (activeTab !== "flatplan") {
      if (flatplanAutoCollapseTimerRef.current != null) {
        clearTimeout(flatplanAutoCollapseTimerRef.current);
        flatplanAutoCollapseTimerRef.current = null;
      }
      setSlotsReduced(false);
    }
  }, [activeTab]);

  const [draftPub, setDraftPub] = useState<PublicationDbRow | null>(null);
  useEffect(() => {
    setDraftPub(publication ? { ...publication } : null);
    setSaveError(null);
  }, [publication?.publication_id]);

  const hasPubChanges = useMemo(() => {
    if (!publication || !draftPub) return false;
    return JSON.stringify(publication) !== JSON.stringify(draftPub);
  }, [publication, draftPub]);

  /**
   * Auto-save state machine. Replaces the previous "Save changes / Reset"
   * buttons by writing draft changes to the backend after a short debounce.
   */
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const autoSaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFlashTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const savePublication = React.useCallback(async () => {
    if (!draftPub) return;
    setSaving(true);
    setAutoSaveStatus("saving");
    setSaveError(null);
    try {
      const res = await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          magazine_id: draftPub.magazine_id,
          publication_year: draftPub.publication_year,
          publication_edition_name: draftPub.publication_edition_name,
          magazine_general_issue_number: draftPub.magazine_general_issue_number,
          magazine_this_year_issue: draftPub.magazine_this_year_issue,
          publication_expected_publication_month: draftPub.publication_expected_publication_month,
          real_publication_month_date: draftPub.real_publication_month_date,
          publication_materials_deadline: draftPub.publication_materials_deadline,
          is_special_edition: draftPub.is_special_edition,
          publication_theme: draftPub.publication_theme,
          publication_status: draftPub.publication_status,
          publication_format: draftPub.publication_format,
          publication_main_image_url: draftPub.publication_main_image_url,
          publication_header_domain: draftPub.publication_header_domain ?? "",
          red_box_header: draftPub.red_box_header ?? "",
          red_box_body: draftPub.red_box_body ?? "",
        }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save changes");
      }
      setPublication((prev) => (prev ? { ...prev, ...draftPub } : prev));
      setAutoSaveStatus("saved");
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
      savedFlashTimerRef.current = setTimeout(() => {
        savedFlashTimerRef.current = null;
        setAutoSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 1500);
    } catch (e: any) {
      setSaveError(e?.message ?? "Failed to save changes");
      setAutoSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }, [draftPub, publicationId]);

  /**
   * Whenever the editable draft drifts from the persisted publication, schedule
   * an auto-save 600ms after the last keystroke. Subsequent edits inside that
   * window cancel and restart the timer (debouncing).
   */
  useEffect(() => {
    if (!hasPubChanges) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveTimerRef.current = null;
      void savePublication();
    }, 600);
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [hasPubChanges, draftPub, savePublication]);

  useEffect(
    () => () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedFlashTimerRef.current) clearTimeout(savedFlashTimerRef.current);
    },
    []
  );

  useEffect(() => {
    const title = publication?.publication_edition_name
      ? publication.publication_edition_name
      : `Issue ${publicationId}`;
    setPageMeta({
      pageTitle: title,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: title },
      ],
      buttons: [{ label: "Back to Issues", href: `${BASE}/issues` }],
    });
  }, [setPageMeta, publication?.publication_edition_name, publicationId]);

  const slotByKey = useMemo(() => {
    const map = new Map<string, SlotRow>();
    slots.forEach((s) => map.set(String(s.slot_key || ""), s));
    return map;
  }, [slots]);

  /** publication_slots_db.publication_slot_id for slot_key='cover'. */
  const coverSlotId = useMemo(
    () => slotByKey.get("cover")?.publication_slot_id ?? null,
    [slotByKey]
  );

  const numericSlotKeys = useMemo(() => {
    return slots
      .map((s) => String(s.slot_key || ""))
      .filter((k) => isNumericSlotKey(k))
      .sort((a, b) => Number(a) - Number(b));
  }, [slots]);

  const maxNumericSlotKey = useMemo(() => {
    let m = 0;
    for (const k of numericSlotKeys) {
      const n = Number(k);
      if (Number.isFinite(n) && n > m) m = n;
    }
    return m;
  }, [numericSlotKeys]);

  const sortedSlotsForFlatplan = useMemo(() => {
    return [...slots].sort(
      (a, b) => flatplanSlotSortKey(String(a.slot_key)) - flatplanSlotSortKey(String(b.slot_key))
    );
  }, [slots]);

  /**
   * `flatplan_position_working_list`: invisible buffers at start/end; real slots are slice(1, -1).
   * Split so the LEFT column always has one row more than the right (`L = R + 1`).
   * Combined with the parity-fix that pads the numeric slots so `k % 4 === 1`,
   * this makes the bottom row of the left column and the row above `end` complete.
   */
  const flatplanWorkingSplit = useMemo(() => {
    const inner: string[] = [];
    if (slotByKey.has("cover")) inner.push("cover");
    if (slotByKey.has("inside_cover")) inner.push("inside_cover");
    numericSlotKeys.forEach((k) => inner.push(k));
    if (slotByKey.has("end")) inner.push("end");
    const working = [FLATPLAN_BUFFER_KEY, ...inner, FLATPLAN_BUFFER_KEY];
    const n = working.length;
    const leftCount = n === 0 ? 0 : Math.min(n, Math.ceil(n / 2) + 1);
    return {
      working,
      leftKeys: working.slice(0, leftCount),
      rightKeys: working.slice(leftCount),
      leftCount,
    };
  }, [slotByKey, numericSlotKeys]);

  const slotKeyToWorkingIndex = useMemo(() => {
    const m = new Map<string, number>();
    flatplanWorkingSplit.working.forEach((k, i) => {
      if (k !== FLATPLAN_BUFFER_KEY) m.set(k, i);
    });
    return m;
  }, [flatplanWorkingSplit.working]);

  const hasMinimalFlatplanSlots = useMemo(() => {
    if (!slotByKey.has("cover") || !slotByKey.has("inside_cover") || !slotByKey.has("end")) return false;
    for (const n of MIN_FLATPLAN_NUMERIC_KEYS) {
      if (!slotByKey.has(String(n))) return false;
    }
    return true;
  }, [slotByKey]);

  const ensureCoreSlots = React.useCallback(async () => {
    if (!publication) return;

    const createIfMissing = async (slot_key: string) => {
      if (slotByKey.has(slot_key)) return;
      await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slot_key,
          publication_format: publication.publication_format,
          slot_content_type: DEFAULT_SLOT_CONTENT_TYPE,
          slot_state: "pending",
        }),
      });
    };

    const keysToEnsure = ["cover", "inside_cover", "end", ...MIN_FLATPLAN_NUMERIC_KEYS.map(String)];
    await Promise.all(keysToEnsure.map((k) => createIfMissing(k)));
  }, [publication, slotByKey, publicationId]);

  useEffect(() => {
    // Ensure cover, inside, end, and numeric pages 1–8 exist (spread labels 0–9 before end at 10)
    if (!publication) return;
    if (hasMinimalFlatplanSlots) return;
    ensureCoreSlots()
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.publication_id, hasMinimalFlatplanSlots]);

  /**
   * Add `count` artificial padding slots right before `end`, with sequential
   * numeric `slot_key`s following the current max numeric key, and `slot_state`
   * set to `padding` so the UI flags them in red.
   */
  const ensurePaddingSlots = React.useCallback(
    async (count: number) => {
      if (!publication || count <= 0) return;
      let nextKey = (maxNumericSlotKey || 0) + 1;
      const requests: Promise<unknown>[] = [];
      for (let i = 0; i < count; i++) {
        const keyForThisOne = String(nextKey);
        requests.push(
          fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              slot_key: keyForThisOne,
              publication_format: publication.publication_format,
              slot_content_type: DEFAULT_SLOT_CONTENT_TYPE,
              slot_state: PADDING_SLOT_STATE,
            }),
          })
        );
        nextKey++;
      }
      await Promise.all(requests);
    },
    [publication, publicationId, maxNumericSlotKey]
  );

  useEffect(() => {
    // After the core slots exist, keep numeric page count at `k % 4 === 1`
    // by inserting artificial `padding` slots right before `end`. This makes
    // the row above `end` complete and lets the layout fit cleanly.
    if (!publication || !hasMinimalFlatplanSlots) return;
    const need = paddingSlotsNeeded(numericSlotKeys.length);
    if (need <= 0) return;
    ensurePaddingSlots(need)
      .then(() => load())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publication?.publication_id, hasMinimalFlatplanSlots, numericSlotKeys.length]);

  /** Inserts a spread (two consecutive numeric pages) so the magazine keeps an even page count. */
  const addSpreadAfter = React.useCallback(
    async (afterKey: string) => {
      if (!publication) return;

      const afterN = Number(afterKey);
      const toShift = numericSlotKeys
        .map((k) => Number(k))
        .filter((n) => n > afterN)
        .sort((a, b) => b - a);

      for (const n of toShift) {
        const slot = slotByKey.get(String(n));
        if (!slot) continue;
        await fetch(`/api/v1/publication-slots/${slot.publication_slot_id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slot_key: String(n + 2) }),
        });
      }

      const k1 = String(afterN + 1);
      const k2 = String(afterN + 2);
      const body = {
        publication_format: publication.publication_format,
        slot_content_type: DEFAULT_SLOT_CONTENT_TYPE,
        slot_state: "pending",
      };
      await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slot_key: k1, ...body }),
      });
      await fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slot_key: k2, ...body }),
      });

      await load();
    },
    [publication, numericSlotKeys, slotByKey, publicationId, load]
  );

  const handleSlotTypeChange = React.useCallback(
    async (slotId: number, newType: string) => {
      setSlots((prev) =>
        prev.map((s) =>
          s.publication_slot_id === slotId ? { ...s, slot_content_type: newType } : s
        )
      );
      try {
        const res = await fetch(`/api/v1/publication-slots/${slotId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ slot_content_type: newType }),
        });
        if (!res.ok) await load();
      } catch {
        await load();
      }
    },
    [load]
  );

  /**
   * Lookup table from `publication_slots_db.publication_slot_id` to its
   * canonical `position_in_magazine` (e.g. "Preferential page 4"). Used to
   * decide whether a Type select change in the Slots editable table requires
   * the swap modal.
   */
  const positionByPublicationSlotId = useMemo(() => {
    const m = new Map<number, string>();
    preferentialSlots.forEach((p) => {
      if (p.publication_slot_id != null) {
        m.set(Number(p.publication_slot_id), String(p.position_in_magazine));
      }
    });
    return m;
  }, [preferentialSlots]);

  const SWAPPABLE_PREFERENTIAL_POSITIONS = useMemo(
    () =>
      new Set([
        "Preferential page 2",
        "Preferential page 4",
        "Preferential page 6",
      ]),
    []
  );

  /**
   * Wrapper around the Slots editable table Type select. Whenever a change
   * involves `summary` or `index` and the slot maps to one of the swappable
   * preferential positions (2 / 4 / 6), open the move modal instead of
   * patching directly. The modal is responsible for confirming the swap and
   * triggering the backend POST that updates `publication_slots_db`.
   */
  const handleSlotsTableTypeChange = React.useCallback(
    (slot: SlotRow, newType: string) => {
      const oldType = normalizeSlotContentType(slot.slot_content_type);
      const next = String(newType ?? "").trim().toLowerCase();
      if (next === oldType) return;

      const slotPosition =
        slot.publication_slot_id != null
          ? positionByPublicationSlotId.get(Number(slot.publication_slot_id)) ?? null
          : null;

      // Setting summary/index: swap modal only when this slot maps to one of
      // the supported preferential pages (2/4/6). For unsupported pages we
      // fall back to the direct patch (existing behaviour).
      if (next === "summary" || next === "index") {
        if (slotPosition && SWAPPABLE_PREFERENTIAL_POSITIONS.has(slotPosition)) {
          setMoveContentTypeModal({
            contentType: next as MovableContentType,
            initialTarget: slotPosition,
          });
          return;
        }
      }

      // Replacing summary/index with anything else (e.g. advert) on a slot
      // that is one of the reserved positions: relocate the reserved type
      // first via the modal so the publication never ends up without a
      // summary or index.
      if (
        (oldType === "summary" || oldType === "index") &&
        slotPosition &&
        SWAPPABLE_PREFERENTIAL_POSITIONS.has(slotPosition)
      ) {
        setMoveContentTypeModal({
          contentType: oldType as MovableContentType,
          initialTarget: null,
        });
        return;
      }

      // Default: behave like before and patch the slot directly.
      void handleSlotTypeChange(slot.publication_slot_id, next);
    },
    [
      positionByPublicationSlotId,
      SWAPPABLE_PREFERENTIAL_POSITIONS,
      handleSlotTypeChange,
    ]
  );

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading issue…</div>
      </PageContentSection>
    );
  }

  if (!publication) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Issue not found."}</p>
          <Link
            href={`${BASE}/issues`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Issues
          </Link>
        </div>
      </PageContentSection>
    );
  }

  const title = publication.publication_edition_name || `Issue ${publication.publication_id}`;

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 bg-gray-50 rounded-t-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setActiveTab("data")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "data"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Data
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab !== "flatplan") {
                  if (flatplanAutoCollapseTimerRef.current != null) {
                    clearTimeout(flatplanAutoCollapseTimerRef.current);
                    flatplanAutoCollapseTimerRef.current = null;
                  }
                  setActiveTab("flatplan");
                  setSlotsReduced(false);
                  flatplanAutoCollapseTimerRef.current = setTimeout(() => {
                    flatplanAutoCollapseTimerRef.current = null;
                    setSlotsReduced(true);
                  }, 120);
                  return;
                }
                setSlotsReduced(true);
              }}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "flatplan"
                  ? "text-blue-950 border-b-2 border-blue-950 bg-white"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              Flatplan
              <span className="ml-2 text-xs text-gray-500">({slots.length} slots)</span>
            </button>
            <div className="flex-1" />
            {activeTab === "data" && (
              <div className="flex items-center mr-3 text-xs">
                {autoSaveStatus === "saving" ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-500">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Saving…
                  </span>
                ) : autoSaveStatus === "saved" ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Saved
                  </span>
                ) : autoSaveStatus === "error" ? (
                  <span className="inline-flex items-center gap-1.5 text-red-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                    Save failed
                  </span>
                ) : hasPubChanges ? (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
                    Pending…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gray-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
                    All changes saved
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {activeTab === "data" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {saveError && (
                      <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
                        {saveError}
                      </div>
                    )}
                    <div className="flex flex-row flex-wrap items-end justify-between gap-x-6 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 uppercase">Publication ID</p>
                        <p className="font-medium text-gray-900 break-all">{publication.publication_id}</p>
                      </div>
                      <div className="shrink-0">
                        <p className="text-xs text-gray-500 uppercase">Special edition</p>
                        <label className="mt-1 inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={Boolean(draftPub?.is_special_edition)}
                            onChange={(e) =>
                              setDraftPub((p) => (p ? { ...p, is_special_edition: e.target.checked } : p))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-800">This issue is a special edition</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Edition name</p>
                      <input
                        value={draftPub?.publication_edition_name ?? ""}
                        onChange={(e) =>
                          setDraftPub((p) =>
                            p ? { ...p, publication_edition_name: e.target.value } : p
                          )
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Edition name"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Theme</p>
                      <input
                        value={draftPub?.publication_theme ?? ""}
                        onChange={(e) =>
                          setDraftPub((p) => (p ? { ...p, publication_theme: e.target.value } : p))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Theme"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Year</p>
                        <input
                          value={draftPub?.publication_year != null ? String(draftPub.publication_year) : ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, publication_year: toNullableInt(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 2026"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Expected month</p>
                        <input
                          value={
                            draftPub?.publication_expected_publication_month != null
                              ? String(draftPub.publication_expected_publication_month)
                              : ""
                          }
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p
                                ? {
                                    ...p,
                                    publication_expected_publication_month: toNullableMonth(e.target.value),
                                  }
                                : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="1-12"
                          inputMode="numeric"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          {monthName(draftPub?.publication_expected_publication_month ?? null)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Magazine ID</p>
                        <input
                          value={draftPub?.magazine_id ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, magazine_id: e.target.value || null } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="mag-001"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Issue # (this year)</p>
                        <input
                          value={draftPub?.magazine_this_year_issue != null ? String(draftPub.magazine_this_year_issue) : ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, magazine_this_year_issue: toNullableInt(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 3"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Status</p>
                        <select
                          value={draftPub?.publication_status ?? "draft"}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, publication_status: e.target.value } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="planned">planned</option>
                          <option value="draft">draft</option>
                          <option value="published">published</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Format</p>
                        <select
                          value={draftPub?.publication_format ?? "flipbook"}
                          onChange={(e) =>
                            setDraftPub((p) => (p ? { ...p, publication_format: e.target.value } : p))
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="flipbook">flipbook</option>
                          <option value="informer">informer</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Materials deadline</p>
                        <input
                          type="date"
                          value={draftPub?.publication_materials_deadline ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, publication_materials_deadline: normalizeDateString(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Published date</p>
                        <input
                          type="date"
                          value={draftPub?.real_publication_month_date ?? ""}
                          onChange={(e) =>
                            setDraftPub((p) =>
                              p ? { ...p, real_publication_month_date: normalizeDateString(e.target.value) } : p
                            )
                          }
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-200 space-y-3 min-w-0">
                      <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                        <div className="flex flex-col">
                          <p className="text-sm font-semibold text-gray-900">Preferential placements</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Summary of <span className="font-mono">publication_preferential_slots</span> for this
                            publication.
                          </p>
                        </div>
                        <div className="flex flex-row items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setMoveContentTypeModal({
                                contentType: "summary",
                                initialTarget: null,
                              })
                            }
                            className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                          >
                            Change Summary Location
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setMoveContentTypeModal({
                                contentType: "index",
                                initialTarget: null,
                              })
                            }
                            className="px-3 py-2 text-xs font-medium rounded-lg border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
                          >
                            Change Index Location
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[min(70vh,720px)] overflow-y-auto pr-1 auto-rows-min">
                        {preferentialSlots.length === 0 ? (
                          <p className="col-span-2 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4">
                            No preferential slot data returned. If this is a magazine issue, ensure slots were
                            provisioned for this publication.
                          </p>
                        ) : (
                          preferentialSlots.map((slot) => (
                            <div
                              key={slot.position_in_magazine}
                              className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/90 p-3 sm:p-4 shadow-sm"
                            >
                              <h3 className="text-sm font-semibold text-gray-900">{slot.section_title}</h3>
                              <PreferentialSlotBlock slot={slot} />
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-4 mt-2 border-t border-gray-200 space-y-3 min-w-0">
                      <div className="flex flex-col">
                        <p className="text-sm font-semibold text-gray-900">
                          Cover margin article miniatures
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Manage the six ordered article miniatures shown in the cover margin.
                        </p>
                      </div>
                      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Position
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Article
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Content to show
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {coverMarginMiniatures.map((row) => (
                              <tr key={row.position} className="align-top">
                                <td className="px-3 py-3 font-mono text-sm text-gray-800">
                                  {row.position}
                                </td>
                                <td className="px-3 py-3 min-w-[220px]">
                                  {row.article ? (
                                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 shadow-sm">
                                      <p className="text-[10px] uppercase tracking-wide text-blue-700">
                                        Article
                                      </p>
                                      <p className="text-sm font-semibold text-blue-950">
                                        {row.article.title}
                                      </p>
                                      <p className="mt-1 text-xs font-mono text-blue-800 break-all">
                                        {row.article.id}
                                      </p>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCoverMarginArticleModalPosition(row.position)
                                      }
                                      className="px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                                    >
                                      Select article from publication
                                    </button>
                                  )}
                                </td>
                                <td className="px-3 py-3 min-w-[320px]">
                                  {row.article ? (
                                    row.editing ? (
                                      <div className="grid grid-cols-1 gap-2">
                                        <div>
                                          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                                            Current content
                                          </label>
                                          <textarea
                                            value={row.currentContent}
                                            readOnly
                                            className="w-full min-h-[80px] rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-700 cursor-not-allowed"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                                            Modified content
                                          </label>
                                          <textarea
                                            value={row.draftContent}
                                            onChange={(e) =>
                                              updateCoverMarginDraftContent(
                                                row.position,
                                                e.target.value
                                              )
                                            }
                                            className="w-full min-h-[80px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            saveCoverMarginDraftContent(row.position)
                                          }
                                          className="justify-self-start px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                        >
                                          Save content
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          startEditingCoverMarginContent(row.position)
                                        }
                                        className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left text-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                                      >
                                        {row.currentContent || "Click to edit display content"}
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-xs text-gray-400">No article selected.</span>
                                  )}
                                </td>
                                <td className="px-3 py-3">
                                  {row.article ? (
                                    <div className="flex flex-col gap-2">
                                      <button
                                        type="button"
                                        onClick={() => removeCoverMarginArticle(row.position)}
                                        className="px-3 py-2 text-xs font-medium rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                                      >
                                        Remove article
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setCoverMarginArticleModalPosition(row.position)
                                        }
                                        className="px-3 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-white text-blue-800 hover:bg-blue-50"
                                      >
                                        Select another article
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-sm overflow-hidden border border-black/10 shadow-sm bg-white flex flex-col w-full aspect-[4/5]">
                      <div className="basis-1/5 w-full">
                        <Cabecera
                          magazineName={magazine?.name ?? null}
                          fallbackName={draftPub?.publication_edition_name ?? title}
                          subtitle={magazine?.subtitle ?? ""}
                          headerDomain={draftPub?.publication_header_domain ?? ""}
                        />
                      </div>
                      <div className="basis-4/5 w-full flex flex-row min-h-0 overflow-visible relative z-20">
                        <div className="basis-1/4 min-w-0 overflow-visible relative">
                          <ArticleMenu
                            miniatures={coverMarginMiniatures}
                            publicationYear={draftPub?.publication_year ?? null}
                            thisYearIssue={draftPub?.magazine_this_year_issue ?? null}
                            redBoxHeader={draftPub?.red_box_header ?? ""}
                            redBoxBody={draftPub?.red_box_body ?? ""}
                          />
                        </div>
                        <div className="flex-1 min-w-0 relative">
                          <CoverAdvert
                            imageUrl={draftPub?.publication_main_image_url || null}
                            alt={title}
                          />
                          <div className="absolute top-3 right-3 rounded-xl shadow-lg bg-white/90 p-3 flex flex-col gap-2 min-w-[200px] max-w-[260px]">
                            <span className="text-xs font-semibold text-gray-700">
                              Cover image
                            </span>
                            {coverSlotId != null ? (
                              <Link
                                href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${coverSlotId}`}
                                className="block text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
                              >
                                Update image
                              </Link>
                            ) : (
                              <span
                                className="block text-center px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 font-medium text-sm cursor-not-allowed"
                                title="Cover slot is being provisioned…"
                              >
                                Update image
                              </span>
                            )}
                            {draftPub?.publication_main_image_url ? (
                              <div className="relative aspect-[5/2] w-full max-h-24 overflow-hidden rounded-lg border border-gray-200 bg-white">
                                <img
                                  src={draftPub.publication_main_image_url}
                                  alt=""
                                  className="h-full w-full object-contain object-center p-2"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-gray-900">Cover miniature settings</p>
                      <p className="mt-1 text-xs text-gray-500">
                        These controls manage the variable text rendered inside the cover miniature.
                      </p>
                      <div className="mt-3 grid grid-cols-1 gap-3">
                        <label className="block">
                          <span className="text-xs uppercase tracking-wide text-gray-500">
                            Header Side Web Domain
                          </span>
                          <input
                            type="text"
                            value={draftPub?.publication_header_domain ?? ""}
                            onChange={(e) =>
                              setDraftPub((p) =>
                                p ? { ...p, publication_header_domain: e.target.value } : p
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="vidrioperfil.com"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase tracking-wide text-gray-500">
                            Red Box Content Header
                          </span>
                          <input
                            type="text"
                            value={draftPub?.red_box_header ?? ""}
                            onChange={(e) =>
                              setDraftPub((p) =>
                                p ? { ...p, red_box_header: e.target.value } : p
                              )
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1889 · 2026"
                          />
                        </label>
                        <label className="block">
                          <span className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
                            <span>Red Box Content Body</span>
                            <span
                              className={
                                countWords(draftPub?.red_box_body ?? "") >= RED_BOX_BODY_MAX_WORDS
                                  ? "text-amber-600 font-semibold"
                                  : "text-gray-400 font-normal"
                              }
                            >
                              {countWords(draftPub?.red_box_body ?? "")} / {RED_BOX_BODY_MAX_WORDS} words
                            </span>
                          </span>
                          <textarea
                            value={draftPub?.red_box_body ?? ""}
                            onChange={(e) => {
                              const next = limitToWords(e.target.value, RED_BOX_BODY_MAX_WORDS);
                              setDraftPub((p) => (p ? { ...p, red_box_body: next } : p));
                            }}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={"España\nPortugal\nAndorra"}
                          />
                        </label>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                          The cover subtitle comes from the magazine title. Edit it in the magazine settings page.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "flatplan" && (
                <div className="flex flex-row w-full min-h-[420px] items-stretch gap-0">
                  <div
                    className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,max-width] duration-[1400ms] ${
                      slotsReduced ? "flex-[3] max-w-[10000px]" : "flex-1 max-w-[640px]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-700 mb-3">Flatplan preview</p>
                    <div className="min-w-0 overflow-x-auto border border-gray-200 rounded-lg bg-gray-50 p-4">
                      <div
                        className={`inline-flex flex-row items-start max-w-full motion-reduce:transition-none motion-reduce:duration-0 transition-[gap] duration-[1400ms] ease-in-out ${
                          slotsReduced ? "gap-12" : "gap-3"
                        }`}
                      >
                        <div
                          className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
                            slotsReduced ? "gap-4" : "gap-2"
                          } ${flatplanPreviewColClass(slotsReduced)}`}
                        >
                          {flatplanWorkingSplit.leftKeys.length > 0 ? (
                            <>
                              <div className={`flex flex-row justify-end ${slotsReduced ? "gap-4" : "gap-2"}`}>
                                <FlatplanPreviewCell
                                  publicationId={publicationId}
                                  entryKey={flatplanWorkingSplit.leftKeys[0]}
                                  side="Left"
                                  slot={slotByKey.get(flatplanWorkingSplit.leftKeys[0]) ?? null}
                                  workingIndex={0}
                                  previewExpanded={slotsReduced}
                                  highlightedSlotId={hoveredSlotId}
                                />
                                {flatplanWorkingSplit.leftKeys[1] != null ? (
                                  <FlatplanPreviewCell
                                    publicationId={publicationId}
                                    entryKey={flatplanWorkingSplit.leftKeys[1]}
                                    side="Right"
                                    slot={slotByKey.get(flatplanWorkingSplit.leftKeys[1]) ?? null}
                                    workingIndex={1}
                                    previewExpanded={slotsReduced}
                                    highlightedSlotId={hoveredSlotId}
                                  />
                                ) : (
                                  <div
                                    className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                                    aria-hidden
                                  />
                                )}
                              </div>
                              {chunkKeysIntoPairs(flatplanWorkingSplit.leftKeys.slice(2)).map(([lk, rk], idx) => {
                                const base = 2 + idx * 2;
                                return (
                                  <div
                                    key={`flatplan-left-${idx}`}
                                    className={`flex flex-row ${slotsReduced ? "gap-4" : "gap-2"}`}
                                  >
                                    <FlatplanPreviewCell
                                      publicationId={publicationId}
                                      entryKey={lk}
                                      side="Left"
                                      slot={slotByKey.get(lk) ?? null}
                                      workingIndex={base}
                                      previewExpanded={slotsReduced}
                                      highlightedSlotId={hoveredSlotId}
                                    />
                                    {rk ? (
                                      <FlatplanPreviewCell
                                        publicationId={publicationId}
                                        entryKey={rk}
                                        side="Right"
                                        slot={slotByKey.get(rk) ?? null}
                                        workingIndex={base + 1}
                                        previewExpanded={slotsReduced}
                                        highlightedSlotId={hoveredSlotId}
                                      />
                                    ) : (
                                      <div
                                        className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                                        aria-hidden
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            <p className="text-xs text-gray-400">No flatplan positions.</p>
                          )}
                        </div>
                        <div
                          className={`flex flex-col motion-reduce:transition-none motion-reduce:duration-0 transition-[gap,width] duration-[1400ms] ease-in-out ${
                            slotsReduced ? "gap-4" : "gap-2"
                          } ${flatplanPreviewColClass(slotsReduced)}`}
                        >
                          {flatplanWorkingSplit.rightKeys.length > 0 ? (
                            <>
                              {chunkKeysIntoPairs(
                                flatplanWorkingSplit.rightKeys.slice(0, Math.max(0, flatplanWorkingSplit.rightKeys.length - 2))
                              ).map(([lk, rk], idx) => {
                                const off = flatplanWorkingSplit.leftCount;
                                const base = off + idx * 2;
                                return (
                                  <div
                                    key={`flatplan-right-${idx}`}
                                    className={`flex flex-row ${slotsReduced ? "gap-4" : "gap-2"}`}
                                  >
                                    <FlatplanPreviewCell
                                      publicationId={publicationId}
                                      entryKey={lk}
                                      side="Left"
                                      slot={slotByKey.get(lk) ?? null}
                                      workingIndex={base}
                                      previewExpanded={slotsReduced}
                                      highlightedSlotId={hoveredSlotId}
                                    />
                                    {rk ? (
                                      <FlatplanPreviewCell
                                        publicationId={publicationId}
                                        entryKey={rk}
                                        side="Right"
                                        slot={slotByKey.get(rk) ?? null}
                                        workingIndex={base + 1}
                                        previewExpanded={slotsReduced}
                                        highlightedSlotId={hoveredSlotId}
                                      />
                                    ) : (
                                      <div
                                        className={`aspect-square shrink-0 ${slotsReduced ? "w-[280px] min-w-[280px]" : "w-[140px]"}`}
                                        aria-hidden
                                      />
                                    )}
                                  </div>
                                );
                              })}
                              {flatplanWorkingSplit.rightKeys.length >= 2 ? (
                                <div className={`flex flex-row justify-start ${slotsReduced ? "gap-4" : "gap-2"}`}>
                                  <FlatplanPreviewCell
                                    publicationId={publicationId}
                                    entryKey={flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2]}
                                    side="Left"
                                    slot={
                                      slotByKey.get(
                                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 2]
                                      ) ?? null
                                    }
                                    workingIndex={
                                      flatplanWorkingSplit.leftCount + flatplanWorkingSplit.rightKeys.length - 2
                                    }
                                    previewExpanded={slotsReduced}
                                    highlightedSlotId={hoveredSlotId}
                                  />
                                  <FlatplanPreviewCell
                                    publicationId={publicationId}
                                    entryKey={flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1]}
                                    side="Right"
                                    slot={
                                      slotByKey.get(
                                        flatplanWorkingSplit.rightKeys[flatplanWorkingSplit.rightKeys.length - 1]
                                      ) ?? null
                                    }
                                    workingIndex={
                                      flatplanWorkingSplit.leftCount + flatplanWorkingSplit.rightKeys.length - 1
                                    }
                                    previewExpanded={slotsReduced}
                                    highlightedSlotId={hoveredSlotId}
                                  />
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`min-w-0 flex flex-col ease-in-out motion-reduce:transition-none motion-reduce:duration-0 transition-[flex,flex-grow,flex-basis,box-shadow,border-radius,padding,margin,border-color] duration-[1400ms] ${
                      slotsReduced
                        ? "flex-[1] relative z-10 rounded-l-xl border-l border-y border-gray-200 bg-white shadow-lg pl-3 -ml-1"
                        : "flex-1 border border-transparent pl-0 shadow-none"
                    }`}
                  >
                    <div className="mb-3 flex flex-row items-center gap-2">
                      {slotsReduced ? (
                        <button
                          type="button"
                          title="<- Expand"
                          aria-label="Expand slots panel"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlotsReduced(false);
                          }}
                          className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          &lt;
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Collapse"
                          aria-label="Collapse slots panel"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSlotsReduced(true);
                          }}
                          className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          &gt;
                        </button>
                      )}
                      <p className="text-sm font-semibold text-gray-700">Slots (editable)</p>
                    </div>
                    <div className="overflow-x-auto min-w-0">
                      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase bg-slate-900 text-white">
                              Slot
                            </th>
                            {!slotsReduced ? (
                              <>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                              </>
                            ) : (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {slots.length === 0 ? (
                            <tr>
                              <td
                                colSpan={slotsReduced ? 2 : 4}
                                className="px-4 py-6 text-center text-sm text-gray-500"
                              >
                                No slots found for this issue.
                              </td>
                            </tr>
                          ) : (
                            sortedSlotsForFlatplan.map((s) => {
                              const wi = slotKeyToWorkingIndex.get(String(s.slot_key));
                              const spreadLine =
                                wi != null ? `Spread ${flatplanWorkingLabel(wi)}` : `Spread ${spreadIndexLabel(String(s.slot_key), maxNumericSlotKey)}`;

                              const padding = isPaddingSlot(s);
                              const allowedTypes = allowedSlotContentTypes(s.slot_key);
                              const normalizedType = normalizeSlotContentType(s.slot_content_type);
                              const currentType = allowedTypes.includes(normalizedType)
                                ? normalizedType
                                : DEFAULT_SLOT_CONTENT_TYPE;
                              return (
                                <tr
                                  key={s.publication_slot_id}
                                  className={`align-top ${padding ? "bg-red-100" : ""}`}
                                >
                                  <td
                                    className={`px-4 py-3 text-sm ${
                                      padding ? "bg-red-700 text-white" : "bg-slate-900 text-white"
                                    }`}
                                    onMouseEnter={() => setHoveredSlotId(s.publication_slot_id)}
                                    onMouseLeave={() => setHoveredSlotId(null)}
                                    onFocus={() => setHoveredSlotId(s.publication_slot_id)}
                                    onBlur={() => setHoveredSlotId(null)}
                                  >
                                    <Link
                                      href={`${BASE}/${encodeURIComponent(publicationId)}/slots/${s.publication_slot_id}`}
                                      className="font-medium text-white hover:text-gray-200"
                                    >
                                      {s.slot_key}
                                    </Link>
                                    {!slotsReduced ? (
                                      <>
                                        <div className="text-xs text-gray-300 mt-0.5">{spreadLine}</div>
                                        <div className="text-xs text-gray-400">#{s.publication_slot_id}</div>
                                      </>
                                    ) : null}
                                  </td>
                                  {!slotsReduced ? (
                                    <>
                                      <td className="px-4 py-3">
                                        <select
                                          value={currentType}
                                          onChange={(e) =>
                                            handleSlotsTableTypeChange(s, e.target.value)
                                          }
                                          disabled={allowedTypes.length === 1}
                                          className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {allowedTypes.map((opt) => (
                                            <option key={opt} value={opt}>
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className="inline-block w-32 px-2 py-1 text-sm text-white">
                                          {s.slot_state?.trim() ? s.slot_state : "—"}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <SlotContentCard
                                          publicationId={publicationId}
                                          slot={s}
                                          variant="expanded"
                                        />
                                      </td>
                                    </>
                                  ) : (
                                    <td className="px-4 py-3">
                                      <SlotContentCard
                                        publicationId={publicationId}
                                        slot={s}
                                        variant="reduced"
                                      />
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
      {coverMarginArticleModalPosition != null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cover-margin-article-modal-title"
          onClick={() => setCoverMarginArticleModalPosition(null)}
        >
          <div
            className="w-full max-w-xl mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2
                id="cover-margin-article-modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                Select article from publication
              </h2>
              <button
                type="button"
                onClick={() => setCoverMarginArticleModalPosition(null)}
                className="text-2xl leading-none text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <p className="text-sm text-gray-600">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
                vitae neque vitae justo congue luctus. This placeholder will be
                replaced by the publication article selector.
              </p>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Target position
                </p>
                <p className="mt-1 font-mono text-sm text-gray-800">
                  {coverMarginArticleModalPosition}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setCoverMarginArticleModalPosition(null)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  selectPlaceholderCoverMarginArticle(coverMarginArticleModalPosition)
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Select placeholder article
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <MoveContentTypeModal
        open={moveContentTypeModal !== null}
        contentType={moveContentTypeModal?.contentType ?? "summary"}
        initialTarget={moveContentTypeModal?.initialTarget ?? null}
        preferentialSlots={preferentialSlots}
        onClose={() => setMoveContentTypeModal(null)}
        onConfirm={async (targetPosition) => {
          if (moveContentTypeModal) {
            await moveReservedContentType(
              moveContentTypeModal.contentType,
              targetPosition
            );
          }
        }}
      />
    </>
  );
};