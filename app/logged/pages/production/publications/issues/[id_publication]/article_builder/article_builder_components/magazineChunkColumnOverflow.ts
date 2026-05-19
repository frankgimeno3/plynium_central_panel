import { htmlToPlainText } from "@/app/logged/logged_components/RichTextEditor";
import type { MagazinePageLayout } from "./magazinePageLayout";
import {
  type FlowPublicationArticleChunk,
  type MagazineArticleFlowPageInput,
  effectiveChunkPageWeight,
  extractBodyFlowChunks,
  isFlowBodyChunk,
  weightCapacityPerColumn,
} from "./magazineArticleColumnFlow";

/** Tuned for ~3-col magazine preview body (triggers spill before visual footer overlap). */
const CHARS_PER_WEIGHT_UNIT = 36;

/** Matches 9px preview body (`ArticleSubpagePagePreview`). */
const PREVIEW_CHARS_PER_LINE = 40;

/** Lines per column before content clips (preview body area, incl. header/footer). */
export function previewLinesPerColumn(layout: MagazinePageLayout): number {
  return layout === "3_col_article" ? 8 : 11;
}

export type OverflowScope = "intra_page_column" | "inter_page";

export type ColumnOverflowDetection = {
  chunkId: string;
  chunkPageIndex: number;
  keptBlocks: string[];
  overflowBlocks: string[];
  entireChunkOverflow: boolean;
  /** 0-based column where the overflow portion should begin on this page. */
  overflowStartsAtColumnIndex: number;
  /** True when every column on this page is full and content must leave the page. */
  isLastColumnFull: boolean;
  scope: OverflowScope;
};

export type OverflowSegment = {
  slotContentId: number;
  html: string;
  weight: number;
  existingChunkId?: string;
};

export type TargetPageChunkShift = {
  from: number;
  to: number;
  format: string;
};

export type ColumnOverflowPlan = {
  scope: OverflowScope;
  /** 1-based column where overflow starts on the source page. */
  overflowStartsAtColumn: number;
  /** 1-based last column index for this page format (2 or 3). */
  lastColumnOnPage: number;
  isLastColumnFull: boolean;
  segments: OverflowSegment[];
  pageFormat: MagazinePageLayout;
  /** 1-based article page where overflow was detected. */
  sourceArticlePage: number;
  totalArticlePages: number;
  /** 1-based chunk index on the source page (editor list order). */
  sourceChunkNumber: number;
  /** 1-based article page that will receive the overflow chunk. */
  targetArticlePage: number;
  splitKeptHtml: string;
  splitOverflowHtml: string;
  /** True when nothing fits on the source page and the full chunk moves away. */
  entireChunkOverflow: boolean;
  /** Target page already exists in publication_slots_id_array. */
  targetPageExists: boolean;
  /** Overflow fits on the target page without overflowing its last column. */
  targetPageFitsOverflow: boolean;
  /** Confirm will add one article page via sync-pages before creating the overflow chunk. */
  willAddArticlePage: boolean;
  /** Existing chunks on target page that will shift down (1→2, 2→3, …). */
  targetPageChunkShifts: TargetPageChunkShift[];
  /** Intra-page: chunks on the same page shifted after the new column chunk is inserted. */
  samePageChunkShifts: TargetPageChunkShift[];
};

function articlePageLabel(pageIndex: number): number {
  return pageIndex + 1;
}

export function estimateWeightFromHtml(
  html: string,
  format: string,
  storedWeight?: number
): number {
  const fmt = String(format ?? "only_text").toLowerCase();
  if (fmt === "only_text") {
    const len = htmlToPlainText(html).length;
    const fromText = Math.max(1, Math.ceil(len / CHARS_PER_WEIGHT_UNIT));
    return Math.min(100, fromText);
  }
  const stub: FlowPublicationArticleChunk = {
    publication_article_chunk_id: "",
    publication_article_chunk_format: format,
    chunk_html: html,
    chunk_position: 0,
    chunk_page_weight: storedWeight,
  };
  return effectiveChunkPageWeight(stub);
}

export function columnCountFromLayout(layout: MagazinePageLayout): number {
  return layout === "3_col_article" ? 3 : 2;
}

export function lastColumnIndexFromLayout(layout: MagazinePageLayout): number {
  return columnCountFromLayout(layout);
}

function chunkWeight(
  chunk: FlowPublicationArticleChunk,
  htmlOverride?: string
): number {
  const html = htmlOverride ?? chunk.chunk_html;
  return estimateWeightFromHtml(
    html,
    chunk.publication_article_chunk_format,
    chunk.chunk_page_weight
  );
}

function escapeHtmlText(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapPlainParagraph(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return /^<[a-z]/i.test(t) ? t : `<p>${escapeHtmlText(t)}</p>`;
}

function stripInlineHtmlToText(fragment: string): string {
  return String(fragment ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (full, name: string) => {
      const n = name.toLowerCase();
      if (n === "nbsp") return " ";
      if (n === "amp") return "&";
      if (n === "lt") return "<";
      if (n === "gt") return ">";
      if (n === "quot") return '"';
      if (n === "apos") return "'";
      return full;
    })
    .replace(/\s+/g, " ")
    .trim();
}

/** Plain-text paragraphs without collapsing line breaks (unlike htmlToPlainText). */
function htmlToParagraphPlainTexts(html: string): string[] {
  let s = String(html ?? "").trim();
  if (!s) return [];

  s = s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/div\s*>/gi, "\n\n")
    .replace(/<\/h[1-6]\s*>/gi, "\n\n");

  const plain = s
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (full, name: string) => {
      const n = name.toLowerCase();
      if (n === "nbsp") return " ";
      if (n === "amp") return "&";
      return full;
    })
    .replace(/\r\n/g, "\n");

  let parts = plain.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  if (parts.length <= 1) {
    parts = plain.split(/\n/).map((t) => t.trim()).filter(Boolean);
  }
  return parts;
}

function splitSingleParagraphByBr(paragraphHtml: string): string[] | null {
  const match = paragraphHtml.match(/^<p\b[^>]*>([\s\S]*)<\/p>$/i);
  if (!match) return null;
  const inner = match[1]!;
  if (!/<br\s*\/?>/i.test(inner)) return null;

  const segments = inner
    .split(/<br\s*\/?>/i)
    .map((part) => stripInlineHtmlToText(part))
    .filter(Boolean);

  if (segments.length <= 1) return null;
  return segments.map((t) => `<p>${escapeHtmlText(t)}</p>`);
}

/**
 * Split chunk HTML into paragraph-sized blocks for overflow.
 * Uses structural tags first (contenteditable often uses div/p per paragraph).
 */
export function splitHtmlIntoParagraphBlocks(html: string): string[] {
  const raw = String(html ?? "").trim();
  if (!raw) return [];

  const pBlocks = [...raw.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)].map((m) => m[0].trim());
  if (pBlocks.length > 1) return pBlocks;

  if (pBlocks.length === 1) {
    const byBr = splitSingleParagraphByBr(pBlocks[0]!);
    if (byBr && byBr.length > 1) return byBr;
  }

  const divBlocks = [...raw.matchAll(/<div\b[^>]*>[\s\S]*?<\/div>/gi)].map((m) =>
    m[0].trim()
  );
  if (divBlocks.length > 1) {
    return divBlocks.map((block) => {
      const text = stripInlineHtmlToText(block);
      return text ? wrapPlainParagraph(text) : block;
    }).filter((b) => stripInlineHtmlToText(b).length > 0);
  }

  if (divBlocks.length === 1) {
    const inner = divBlocks[0]!.replace(/^<div\b[^>]*>/i, "").replace(/<\/div>$/i, "");
    if (/<br\s*\/?>/i.test(inner)) {
      const segments = inner
        .split(/<br\s*\/?>/i)
        .map((part) => stripInlineHtmlToText(part))
        .filter(Boolean);
      if (segments.length > 1) {
        return segments.map((t) => `<p>${escapeHtmlText(t)}</p>`);
      }
    }
  }

  const plainParagraphs = htmlToParagraphPlainTexts(raw);
  if (plainParagraphs.length > 1) {
    return plainParagraphs.map((t) => wrapPlainParagraph(t));
  }

  if (pBlocks.length === 1) return pBlocks;
  if (divBlocks.length === 1) {
    const text = stripInlineHtmlToText(divBlocks[0]!);
    return text ? [wrapPlainParagraph(text)] : [divBlocks[0]!];
  }

  if (/<[a-z][\s\S]*>/i.test(raw)) return [raw];
  return plainParagraphs.length === 1
    ? [wrapPlainParagraph(plainParagraphs[0]!)]
    : [wrapPlainParagraph(stripInlineHtmlToText(raw))];
}

export function joinParagraphBlocks(blocks: string[]): string {
  return blocks.join("").trim();
}

export type ColumnState = { colIdx: number; colUsed: number };

function advanceColumn(cols: number, state: ColumnState) {
  state.colIdx++;
  state.colUsed = 0;
}

export function paragraphLineCount(html: string): number {
  const len = stripInlineHtmlToText(html).length;
  return Math.max(1, Math.ceil(len / PREVIEW_CHARS_PER_LINE));
}

function chunkLineCount(chunk: FlowPublicationArticleChunk, htmlOverride?: string): number {
  const fmt = String(chunk.publication_article_chunk_format ?? "").toLowerCase();
  if (fmt === "only_text") {
    return paragraphLineCount(htmlOverride ?? chunk.chunk_html);
  }
  const weight = chunkWeight(chunk, htmlOverride);
  const cols = 2;
  const colCapacity = weightCapacityPerColumn(cols);
  return Math.max(1, Math.ceil(weight / colCapacity));
}

type LinePlacementResult = {
  placed: number;
  overflowStartsAtColumnIndex: number | null;
  /** No column on this page can accept more content. */
  isLastColumnFull: boolean;
};

function placeUnitsInPageColumns(
  cols: number,
  capacityPerColumn: number,
  state: ColumnState,
  units: number
): boolean {
  return (
    placeLinesWithOverflowStart(cols, capacityPerColumn, state, units)
      .overflowStartsAtColumnIndex === null
  );
}

function scopeFromPlacement(isLastColumnFull: boolean): OverflowScope {
  return isLastColumnFull ? "inter_page" : "intra_page_column";
}

/**
 * Place line units column-by-column. Overflow into another on-page column is intra;
 * only when all columns are exhausted does isLastColumnFull become true (inter-page).
 */
export function placeLinesWithOverflowStart(
  cols: number,
  capacityPerColumn: number,
  state: ColumnState,
  units: number
): LinePlacementResult {
  let remaining = units;
  let placed = 0;

  while (remaining > 0) {
    if (state.colIdx >= cols) {
      return {
        placed,
        overflowStartsAtColumnIndex: cols - 1,
        isLastColumnFull: true,
      };
    }

    const room = capacityPerColumn - state.colUsed;
    if (room <= 0) {
      advanceColumn(cols, state);
      if (state.colIdx >= cols) {
        return {
          placed,
          overflowStartsAtColumnIndex: cols - 1,
          isLastColumnFull: true,
        };
      }
      continue;
    }

    const take = Math.min(remaining, room);
    remaining -= take;
    placed += take;
    state.colUsed += take;

    if (remaining <= 0) {
      if (state.colUsed >= capacityPerColumn && state.colIdx < cols - 1) {
        advanceColumn(cols, state);
      }
      return {
        placed,
        overflowStartsAtColumnIndex: null,
        isLastColumnFull: false,
      };
    }

    advanceColumn(cols, state);
    if (state.colIdx >= cols) {
      return {
        placed,
        overflowStartsAtColumnIndex: cols - 1,
        isLastColumnFull: true,
      };
    }
    return {
      placed,
      overflowStartsAtColumnIndex: state.colIdx,
      isLastColumnFull: false,
    };
  }

  return { placed, overflowStartsAtColumnIndex: null, isLastColumnFull: false };
}

export function splitHtmlBlockAtLineBoundary(
  html: string,
  keepLines: number,
  totalLines: number
): { kept: string; overflow: string } {
  if (keepLines <= 0) return { kept: "", overflow: html };
  if (keepLines >= totalLines) return { kept: html, overflow: "" };

  const plain = stripInlineHtmlToText(html);
  if (!plain) return { kept: html, overflow: "" };

  const keepChars = Math.min(
    plain.length,
    Math.max(1, Math.floor((plain.length * keepLines) / totalLines))
  );
  const wordBreak = plain.lastIndexOf(" ", keepChars);
  const breakAt = wordBreak > keepChars * 0.35 ? wordBreak : keepChars;

  const keptPlain = plain.slice(0, breakAt).trim();
  const overflowPlain = plain.slice(breakAt).trim();
  if (!keptPlain) return { kept: "", overflow: html };
  if (!overflowPlain) return { kept: html, overflow: "" };

  const useP = /^<p\b/i.test(html);
  return {
    kept: useP ? `<p>${escapeHtmlText(keptPlain)}</p>` : wrapPlainParagraph(keptPlain),
    overflow: useP
      ? `<p>${escapeHtmlText(overflowPlain)}</p>`
      : wrapPlainParagraph(overflowPlain),
  };
}

function buildSamePageChunkShiftsAfterInsert(
  pageChunks: FlowPublicationArticleChunk[],
  sourceChunkId: string,
  insertPosition: number
): TargetPageChunkShift[] {
  const sorted = [...pageChunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );

  const shifts: TargetPageChunkShift[] = [];
  let nextNum = 2;
  for (const c of sorted) {
    if (c.publication_article_chunk_id === sourceChunkId) continue;
    if (c.chunk_position < insertPosition) continue;
    shifts.push({
      from: nextNum,
      to: nextNum + 1,
      format: String(c.publication_article_chunk_format ?? "only_text"),
    });
    nextNum++;
  }
  return shifts;
}

function simulateColumnStateBeforeChunk(
  pageChunks: FlowPublicationArticleChunk[],
  pageFormat: MagazinePageLayout,
  targetChunkId: string
): ColumnState | null {
  const cols = columnCountFromLayout(pageFormat);
  const linesPerCol = previewLinesPerColumn(pageFormat);
  const stream = extractBodyFlowChunks(pageChunks);
  const state: ColumnState = { colIdx: 0, colUsed: 0 };

  for (const ch of stream) {
    if (ch.publication_article_chunk_id === targetChunkId) {
      return { ...state };
    }
    const units = chunkLineCount(ch);
    const placement = placeLinesWithOverflowStart(cols, linesPerCol, state, units);
    if (placement.isLastColumnFull) {
      return { colIdx: cols, colUsed: linesPerCol };
    }
  }

  return null;
}

/**
 * Detect overflow for one chunk on its assigned article page only (matches page preview columns).
 */
export function detectOverflowOnArticlePage(
  pageChunks: FlowPublicationArticleChunk[],
  pageFormat: MagazinePageLayout,
  targetChunkId: string,
  htmlOverride?: string
): ColumnOverflowDetection | null {
  const stream = extractBodyFlowChunks(pageChunks);
  const target = stream.find((c) => c.publication_article_chunk_id === targetChunkId);
  if (!target || !isFlowBodyChunk(target)) return null;

  const cols = columnCountFromLayout(pageFormat);
  const linesPerCol = previewLinesPerColumn(pageFormat);
  const html = htmlOverride ?? target.chunk_html;

  const startState = simulateColumnStateBeforeChunk(pageChunks, pageFormat, targetChunkId);
  if (!startState) return null;

  const blocks = splitHtmlIntoParagraphBlocks(html);
  if (blocks.length === 0) return null;

  const state: ColumnState = { ...startState };
  const keptBlocks: string[] = [];

  const finish = (
    kept: string[],
    overflow: string[],
    overflowStartsAtColumnIndex: number,
    isLastColumnFull: boolean
  ): ColumnOverflowDetection => ({
    chunkId: targetChunkId,
    chunkPageIndex: -1,
    keptBlocks: kept,
    overflowBlocks: overflow,
    entireChunkOverflow: kept.length === 0,
    overflowStartsAtColumnIndex,
    isLastColumnFull,
    scope: scopeFromPlacement(isLastColumnFull),
  });

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]!;
    const lines = paragraphLineCount(block);
    const placement = placeLinesWithOverflowStart(cols, linesPerCol, state, lines);

    if (placement.overflowStartsAtColumnIndex != null) {
      const overflowColIdx = placement.overflowStartsAtColumnIndex;

      if (placement.placed <= 0) {
        const overflowBlocks = blocks.slice(i);
        if (overflowBlocks.length === 0) return null;
        return finish(
          keptBlocks,
          overflowBlocks,
          overflowColIdx,
          placement.isLastColumnFull
        );
      }

      const { kept, overflow } = splitHtmlBlockAtLineBoundary(
        block,
        placement.placed,
        lines
      );
      const overflowBlocks = [
        ...(overflow.trim() ? [overflow] : []),
        ...blocks.slice(i + 1),
      ];
      if (overflowBlocks.length === 0) return null;

      const keptForPage = kept.trim() ? [...keptBlocks, kept] : keptBlocks;
      return finish(
        keptForPage,
        overflowBlocks,
        overflowColIdx,
        placement.isLastColumnFull
      );
    }

    keptBlocks.push(block);
  }

  return null;
}

/** @deprecated Use detectOverflowOnArticlePage — kept for any external callers. */
export function detectLastColumnOverflow(
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout,
  targetChunkId: string,
  htmlOverride?: string
): {
  chunkId: string;
  chunkPageIndex: number;
  remainderWeight: number;
  overflowWeight: number;
  totalWeight: number;
  nextSlotContentId: number | null;
  entireChunkOnNextPage: boolean;
} | null {
  const chunk = pages
    .flatMap((p) => p.chunks)
    .find((c) => c.publication_article_chunk_id === targetChunkId);
  if (!chunk) return null;

  const pageIndex = pages.findIndex(
    (p) =>
      p.slotContentId ===
      Number(chunk.publication_slot_id ?? chunk.publication_slot_content_id)
  );
  if (pageIndex < 0) return null;

  const detection = detectOverflowOnArticlePage(
    pages[pageIndex]!.chunks,
    pageFormat,
    targetChunkId,
    htmlOverride
  );
  if (!detection) return null;

  const html = htmlOverride ?? chunk.chunk_html;
  const totalWeight = chunkWeight(chunk, html);
  const keptHtml = joinParagraphBlocks(detection.keptBlocks);
  const keptWeight = keptHtml ? estimateWeightFromHtml(keptHtml, chunk.publication_article_chunk_format) : 0;
  const overflowWeight = Math.max(0, totalWeight - keptWeight);

  return {
    chunkId: targetChunkId,
    chunkPageIndex: pageIndex,
    remainderWeight: keptWeight,
    overflowWeight,
    totalWeight,
    nextSlotContentId: pages[pageIndex + 1]?.slotContentId ?? null,
    entireChunkOnNextPage: detection.entireChunkOverflow,
  };
}

/** Split HTML so the kept part is ~fitWeight of totalWeight (by plain-text length). */
export function splitHtmlByWeight(
  html: string,
  fitWeight: number,
  totalWeight: number
): { kept: string; overflow: string } {
  const raw = String(html ?? "");
  if (fitWeight >= totalWeight - 1e-6 || totalWeight <= 0) {
    return { kept: raw, overflow: "" };
  }

  const plain = htmlToPlainText(raw);
  if (!plain) return { kept: raw, overflow: "" };

  const ratio = Math.min(1, Math.max(0, fitWeight / totalWeight));
  let targetLen = Math.floor(plain.length * ratio);
  if (targetLen <= 0) {
    return { kept: "", overflow: raw };
  }
  if (targetLen >= plain.length) {
    return { kept: raw, overflow: "" };
  }

  const sentenceBreak = plain.lastIndexOf(". ", targetLen);
  const wordBreak = plain.lastIndexOf(" ", targetLen);
  const breakAt =
    sentenceBreak > targetLen * 0.5
      ? sentenceBreak + 1
      : wordBreak > 0
        ? wordBreak
        : targetLen;

  const keptPlain = plain.slice(0, breakAt).trim();
  const overflowPlain = plain.slice(breakAt).trim();
  if (!keptPlain) return { kept: "", overflow: raw };
  if (!overflowPlain) return { kept: raw, overflow: "" };

  const blockParts = raw.split(/(?=<\/p\s*>)/i);
  if (blockParts.length > 1) {
    let acc = "";
    const keptBlocks: string[] = [];
    for (const part of blockParts) {
      const next = acc + part;
      if (htmlToPlainText(next).length <= keptPlain.length + 8) {
        keptBlocks.push(part);
        acc = next;
      } else {
        break;
      }
    }
    if (keptBlocks.length > 0) {
      const kept = keptBlocks.join("");
      const overflow = raw.slice(kept.length).trim();
      if (htmlToPlainText(overflow).length > 0) {
        return { kept, overflow };
      }
    }
  }

  return {
    kept: `<p>${keptPlain}</p>`,
    overflow: `<p>${overflowPlain}</p>`,
  };
}

/** slotContentId 0 = resolved on confirm after sync-pages when willAddArticlePage is true. */
export const OVERFLOW_DEFERRED_SLOT_CONTENT_ID = 0;

function chunkNumberOnPage(
  pageChunks: FlowPublicationArticleChunk[],
  chunkId: string
): number {
  const sorted = [...pageChunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  const idx = sorted.findIndex((c) => c.publication_article_chunk_id === chunkId);
  return idx >= 0 ? idx + 1 : 1;
}

function buildTargetPageChunkShifts(
  targetPageChunks: FlowPublicationArticleChunk[]
): TargetPageChunkShift[] {
  const sorted = [...targetPageChunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  return sorted.map((c, i) => ({
    from: i + 1,
    to: i + 2,
    format: String(c.publication_article_chunk_format ?? "only_text"),
  }));
}

export function buildColumnOverflowPlan(
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout,
  chunk: FlowPublicationArticleChunk,
  pendingHtml: string
): ColumnOverflowPlan | null {
  const slotId = Number(chunk.publication_slot_id ?? chunk.publication_slot_content_id);
  const pageIndex = pages.findIndex((p) => p.slotContentId === slotId);
  if (pageIndex < 0) return null;

  const pageChunks = pages[pageIndex]!.chunks;
  const detection = detectOverflowOnArticlePage(
    pageChunks,
    pageFormat,
    chunk.publication_article_chunk_id,
    pendingHtml
  );
  if (!detection) return null;

  const kept = joinParagraphBlocks(detection.keptBlocks);
  const overflow = joinParagraphBlocks(detection.overflowBlocks);
  if (!overflow.trim()) return null;
  if (!detection.entireChunkOverflow && !kept.trim()) return null;

  const currentPage = pages[pageIndex]!;
  const sourceChunkNumber = chunkNumberOnPage(pageChunks, chunk.publication_article_chunk_id);
  const nextPage = pages[pageIndex + 1];
  const sourceArticlePage = articlePageLabel(pageIndex);
  const totalArticlePages = pages.length;
  const scope = detection.scope;
  const overflowStartsAtColumn = detection.overflowStartsAtColumnIndex + 1;
  const lastColumnOnPage = lastColumnIndexFromLayout(pageFormat);
  const isLastColumnFull = detection.isLastColumnFull;
  const isInterPage = scope === "inter_page";
  const targetArticlePage = isInterPage ? sourceArticlePage + 1 : sourceArticlePage;
  const targetPageExists = isInterPage ? nextPage != null : true;
  const willAddArticlePage = isInterPage && !nextPage;

  const keptWeight = Math.min(
    100,
    Math.max(
      1,
      Math.round(
        kept
          ? estimateWeightFromHtml(kept, chunk.publication_article_chunk_format)
          : 1
      )
    )
  );
  const overflowSegWeight = Math.min(
    100,
    Math.max(
      1,
      Math.round(
        estimateWeightFromHtml(overflow, chunk.publication_article_chunk_format)
      )
    )
  );

  const insertPosition = chunk.chunk_position + 1;
  const samePageChunkShifts = isInterPage
    ? []
    : buildSamePageChunkShiftsAfterInsert(
        pageChunks,
        chunk.publication_article_chunk_id,
        insertPosition
      );

  const segments: OverflowSegment[] = [
    {
      slotContentId: currentPage.slotContentId,
      html: kept,
      weight: keptWeight,
      existingChunkId: chunk.publication_article_chunk_id,
    },
    {
      slotContentId: isInterPage
        ? targetPageExists
          ? nextPage!.slotContentId
          : OVERFLOW_DEFERRED_SLOT_CONTENT_ID
        : currentPage.slotContentId,
      html: overflow,
      weight: overflowSegWeight,
    },
  ];

  let targetPageFitsOverflow = true;
  const targetPageChunkShifts =
    isInterPage && targetPageExists ? buildTargetPageChunkShifts(nextPage!.chunks) : [];

  if (isInterPage && targetPageExists) {
    targetPageFitsOverflow = !wouldOverflowOnTargetPage(
      nextPage!.chunks,
      pageFormat,
      overflow,
      chunk.publication_article_chunk_format
    );
  }

  return {
    scope,
    overflowStartsAtColumn,
    lastColumnOnPage,
    isLastColumnFull,
    segments,
    pageFormat,
    sourceArticlePage,
    totalArticlePages,
    sourceChunkNumber,
    targetArticlePage,
    splitKeptHtml: kept,
    splitOverflowHtml: overflow,
    entireChunkOverflow: detection.entireChunkOverflow,
    targetPageExists,
    targetPageFitsOverflow,
    willAddArticlePage,
    targetPageChunkShifts,
    samePageChunkShifts,
  };
}

/** Overflow chunk is inserted before existing body chunks on the target page. */
function wouldOverflowOnTargetPage(
  existingPageChunks: FlowPublicationArticleChunk[],
  pageFormat: MagazinePageLayout,
  overflowHtml: string,
  format: string
): boolean {
  const synthetic: FlowPublicationArticleChunk = {
    publication_article_chunk_id: "__overflow_candidate",
    publication_article_chunk_format: format,
    chunk_html: overflowHtml,
    chunk_position: -1,
  };

  const combined = [synthetic, ...extractBodyFlowChunks(existingPageChunks)];

  return (
    detectOverflowOnArticlePage(
      combined,
      pageFormat,
      "__overflow_candidate",
      overflowHtml
    ) != null
  );
}
