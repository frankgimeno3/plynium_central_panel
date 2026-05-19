import type { MagazinePageLayout } from "./magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import {
  columnCountFromLayout,
  joinParagraphBlocks,
  paragraphLineCount,
  placeLinesWithOverflowStart,
  previewLinesPerColumn,
  splitHtmlBlockAtLineBoundary,
  splitHtmlIntoParagraphBlocks,
  type ColumnState,
} from "./magazineChunkColumnOverflow";
import {
  htmlOverflowsColumnArea,
  splitBlocksByMeasurement,
  type PreviewBodyDimensions,
} from "./magazinePreviewMeasurement";

export type BodyPageSegment = {
  pageIndex: number;
  slotContentId: number;
  html: string;
};

export type PageBodyChunkPlan = {
  slotContentId: number;
  /** One HTML blob per only_text chunk on that page (column splits become separate chunks). */
  htmlParts: string[];
};

export type BodyDistributionResult = {
  /** What fits on each existing page (in order). */
  pagePlans: PageBodyChunkPlan[];
  /** Paragraph blocks that did not fit on any provided page. */
  overflowBlocks: string[];
};

/**
 * Flow article body HTML through magazine columns page-by-page and emit chunk HTML per page.
 * Anything that does not fit on the provided pages is returned as `overflowBlocks` so the
 * caller can decide whether to add a new page (preferred) or fall back to the legacy
 * behaviour of appending it to the last page.
 */
export function planBodyChunksAcrossPages(
  html: string,
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout
): BodyDistributionResult {
  if (pages.length === 0) {
    const blocks = splitHtmlIntoParagraphBlocks(String(html ?? "").trim());
    return { pagePlans: [], overflowBlocks: blocks };
  }

  const cols = columnCountFromLayout(pageFormat);
  const linesPerCol = previewLinesPerColumn(pageFormat);
  let blocks = splitHtmlIntoParagraphBlocks(String(html ?? "").trim());
  const pagePlans: PageBodyChunkPlan[] = [];

  for (const page of pages) {
    const state: ColumnState = { colIdx: 0, colUsed: 0 };
    const htmlParts: string[] = [];
    let currentBlocks: string[] = [];

    const flush = () => {
      const joined = joinParagraphBlocks(currentBlocks);
      if (joined.trim()) {
        htmlParts.push(joined);
      }
      currentBlocks = [];
    };

    while (blocks.length > 0) {
      const block = blocks[0]!;
      const lines = paragraphLineCount(block);
      const trial: ColumnState = { colIdx: state.colIdx, colUsed: state.colUsed };
      const placement = placeLinesWithOverflowStart(cols, linesPerCol, trial, lines);

      if (placement.overflowStartsAtColumnIndex === null) {
        state.colIdx = trial.colIdx;
        state.colUsed = trial.colUsed;
        currentBlocks.push(block);
        blocks.shift();
        continue;
      }

      if (placement.placed > 0) {
        const { kept, overflow } = splitHtmlBlockAtLineBoundary(
          block,
          placement.placed,
          lines
        );
        state.colIdx = trial.colIdx;
        state.colUsed = trial.colUsed;
        if (kept.trim()) currentBlocks.push(kept);
        flush();
        if (overflow.trim()) {
          blocks[0] = overflow;
        } else {
          blocks.shift();
        }
        if (placement.isLastColumnFull) {
          break;
        }
        continue;
      }

      if (currentBlocks.length > 0 || state.colIdx > 0 || state.colUsed > 0) {
        flush();
        break;
      }

      currentBlocks.push(block);
      blocks.shift();
      flush();
      break;
    }

    flush();
    pagePlans.push({ slotContentId: page.slotContentId, htmlParts });

    if (blocks.length === 0) {
      break;
    }
  }

  return { pagePlans, overflowBlocks: blocks };
}

/** Collapse any leftover overflow into the last page's chunk list (legacy behaviour). */
export function collapseOverflowIntoLastPage(
  result: BodyDistributionResult,
  pages: MagazineArticleFlowPageInput[]
): PageBodyChunkPlan[] {
  if (result.overflowBlocks.length === 0) return result.pagePlans;
  const tail = joinParagraphBlocks(result.overflowBlocks);
  if (!tail.trim()) return result.pagePlans;

  if (result.pagePlans.length === 0) {
    const fallback = pages[pages.length - 1];
    if (!fallback) return [];
    return [{ slotContentId: fallback.slotContentId, htmlParts: [tail] }];
  }

  const collapsed = result.pagePlans.map((p) => ({ ...p, htmlParts: [...p.htmlParts] }));
  const last = collapsed[collapsed.length - 1]!;
  last.htmlParts = [...last.htmlParts, tail];
  return collapsed;
}

/** Body HTML split per article page (for editor zones — same rules as save/preview). */
export function splitBodyHtmlIntoPageSegments(
  html: string,
  pages: MagazineArticleFlowPageInput[],
  pageFormat: MagazinePageLayout,
  dims?: PreviewBodyDimensions | null
): BodyPageSegment[] {
  if (pages.length === 0) return [];

  const result = dims
    ? planBodyChunksAcrossPagesByMeasurement(html, pages, dims)
    : planBodyChunksAcrossPages(html, pages, pageFormat);
  const plans = collapseOverflowIntoLastPage(result, pages);
  const htmlBySlot = new Map(
    plans.map((p) => [p.slotContentId, joinParagraphBlocks(p.htmlParts)] as const)
  );

  return pages.map((page, i) => ({
    pageIndex: i + 1,
    slotContentId: page.slotContentId,
    html: htmlBySlot.get(page.slotContentId) ?? "",
  }));
}

/**
 * Measurement-based distribution: same shape as `planBodyChunksAcrossPages`
 * but uses the live CSS-columns engine to decide what fits per page. This is
 * the source of truth for both save and overflow detection when the preview
 * is mounted.
 */
export function planBodyChunksAcrossPagesByMeasurement(
  html: string,
  pages: MagazineArticleFlowPageInput[],
  dims: PreviewBodyDimensions
): BodyDistributionResult {
  if (pages.length === 0) {
    const leftover = splitHtmlIntoParagraphBlocks(String(html ?? "").trim());
    return { pagePlans: [], overflowBlocks: leftover };
  }

  const blocks = splitHtmlIntoParagraphBlocks(String(html ?? "").trim());
  const pagePlans: PageBodyChunkPlan[] = [];
  let remaining = blocks;

  for (const page of pages) {
    if (remaining.length === 0) {
      pagePlans.push({ slotContentId: page.slotContentId, htmlParts: [] });
      continue;
    }
    const { kept, overflow } = splitBlocksByMeasurement(remaining, dims);
    const joined = joinParagraphBlocks(kept);
    pagePlans.push({
      slotContentId: page.slotContentId,
      htmlParts: joined ? [joined] : [],
    });
    remaining = overflow;
  }

  return { pagePlans, overflowBlocks: remaining };
}

export type BodyOverflowMeasurement = {
  /** Joined HTML of the trailing content that did not fit on the last page. */
  overflowHtml: string;
  /** Paragraph blocks (post-split) that did not fit. */
  overflowBlocks: string[];
};

/**
 * Returns the trailing content that does not fit, or `null` when everything
 * fits cleanly. Uses real DOM measurement so it matches what the user sees.
 */
export function detectBodyOverflowByMeasurement(
  html: string,
  pages: MagazineArticleFlowPageInput[],
  dims: PreviewBodyDimensions
): BodyOverflowMeasurement | null {
  if (pages.length === 0) return null;
  const { overflowBlocks } = planBodyChunksAcrossPagesByMeasurement(html, pages, dims);
  if (overflowBlocks.length === 0) return null;
  const overflowHtml = joinParagraphBlocks(overflowBlocks);
  if (!overflowHtml.trim()) return null;
  return { overflowHtml, overflowBlocks };
}

/** Re-export for callers that just want the raw overflow check. */
export { htmlOverflowsColumnArea };

export function joinPageSegmentHtml(segments: Pick<BodyPageSegment, "html">[]): string {
  return segments.map((s) => String(s.html ?? "")).join("");
}
