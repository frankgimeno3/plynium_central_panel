"use client";

/**
 * Real-DOM overflow measurement for the magazine page body column area.
 *
 * Word-style flow only works correctly if we use the same column engine the
 * preview actually renders with. The previous heuristic counted "lines per
 * column" by hard-coded constants, which under-estimated capacity by 3-4x and
 * forced new pages while the existing columns still had visible whitespace.
 *
 * Strategy:
 *   1. Locate the live preview body element (tagged with `data-magazine-preview-body`).
 *   2. Mirror its computed dimensions + column styling into a hidden measure node.
 *   3. Inject candidate HTML and ask the browser whether `scrollHeight` exceeds
 *      `clientHeight` (the preview clips with `overflow: hidden`, so this is
 *      precisely where the visible "lost text" appears).
 *
 * Everything runs synchronously: each measurement is a forced reflow. We only
 * measure on debounced saves (not per keystroke) so the cost is acceptable.
 */

export type PreviewBodyDimensions = {
  width: number;
  height: number;
  columnCount: number;
  columnGapPx: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  fontSizePx: number;
  lineHeightPx: number;
  fontFamily: string;
  letterSpacing: string;
  className?: string;
};

const MIN_VALID_DIM = 8;

/** Reads dimensions from a live preview body element. */
export function previewBodyDimensionsFromElement(
  el: HTMLElement | null
): PreviewBodyDimensions | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width < MIN_VALID_DIM || rect.height < MIN_VALID_DIM) return null;
  const cs = window.getComputedStyle(el);

  const fontSizePx = parseFloat(cs.fontSize) || 12;
  const lineHeightRaw = cs.lineHeight;
  let lineHeightPx = parseFloat(lineHeightRaw);
  if (!Number.isFinite(lineHeightPx)) {
    // line-height can also be "normal"; approximate with 1.2× font size.
    lineHeightPx = fontSizePx * 1.2;
  }

  const cols =
    parseInt(el.getAttribute("data-magazine-preview-columns") ?? "", 10) ||
    parseInt(cs.columnCount, 10) ||
    1;

  return {
    width: rect.width,
    height: rect.height,
    columnCount: cols,
    columnGapPx: parseFloat(cs.columnGap) || 0,
    paddingLeft: parseFloat(cs.paddingLeft) || 0,
    paddingRight: parseFloat(cs.paddingRight) || 0,
    paddingTop: parseFloat(cs.paddingTop) || 0,
    paddingBottom: parseFloat(cs.paddingBottom) || 0,
    fontSizePx,
    lineHeightPx,
    fontFamily: cs.fontFamily,
    letterSpacing: cs.letterSpacing,
    className: el.className,
  };
}

/** Finds the live preview body in the DOM (the closest visible one). */
export function findLivePreviewBody(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>("[data-magazine-preview-body]")
  );
  // Prefer the first visible candidate (non-zero rect).
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > MIN_VALID_DIM && rect.height > MIN_VALID_DIM) return el;
  }
  return candidates[0] ?? null;
}

export function currentPreviewBodyDimensions(): PreviewBodyDimensions | null {
  return previewBodyDimensionsFromElement(findLivePreviewBody());
}

/**
 * Build (or reuse) a hidden measurement node that mirrors the preview body.
 * We keep a single node attached to <body> and reuse it across calls for
 * speed; consumers should not retain references to it across calls.
 */
let measureNode: HTMLDivElement | null = null;

function ensureMeasureNode(dims: PreviewBodyDimensions): HTMLDivElement {
  if (!measureNode) {
    measureNode = document.createElement("div");
    measureNode.setAttribute("aria-hidden", "true");
    measureNode.setAttribute("data-magazine-preview-measurement", "");
  }
  const el = measureNode;
  el.className = dims.className ?? "";
  Object.assign(el.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    zIndex: "-1",
    pointerEvents: "none",
    visibility: "hidden",
    boxSizing: "border-box",
    width: `${dims.width}px`,
    height: `${dims.height}px`,
    columnCount: String(dims.columnCount),
    columnFill: "auto",
    columnGap: `${dims.columnGapPx}px`,
    columnRule: "0",
    overflow: "hidden",
    paddingLeft: `${dims.paddingLeft}px`,
    paddingRight: `${dims.paddingRight}px`,
    paddingTop: `${dims.paddingTop}px`,
    paddingBottom: `${dims.paddingBottom}px`,
    fontSize: `${dims.fontSizePx}px`,
    lineHeight: `${dims.lineHeightPx}px`,
    fontFamily: dims.fontFamily,
    letterSpacing: dims.letterSpacing,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    background: "transparent",
  } as Partial<CSSStyleDeclaration>);

  if (!el.isConnected) {
    document.body.appendChild(el);
  }
  return el;
}

/** True when `html` overflows the column area at the given dimensions. */
export function htmlOverflowsColumnArea(
  html: string,
  dims: PreviewBodyDimensions
): boolean {
  if (typeof document === "undefined") return false;
  if (!html.trim()) return false;
  const node = ensureMeasureNode(dims);
  node.innerHTML = html;
  // Force a synchronous reflow before reading metrics.
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  node.offsetHeight;
  const overflowH = node.scrollHeight > node.clientHeight + 1;
  const overflowW = node.scrollWidth > node.clientWidth + 1;
  return overflowH || overflowW;
}

/**
 * Greedy paragraph-block packing. Adds blocks one at a time and stops as soon
 * as the candidate overflows. When the *first* block alone overflows we fall
 * back to a binary search to split that block mid-text so we still emit
 * something on this page (otherwise we'd spin forever).
 */
export function splitBlocksByMeasurement(
  blocks: string[],
  dims: PreviewBodyDimensions
): { kept: string[]; overflow: string[] } {
  if (blocks.length === 0) return { kept: [], overflow: [] };
  const kept: string[] = [];
  const remaining = [...blocks];

  while (remaining.length > 0) {
    const candidate = [...kept, remaining[0]!].join("");
    if (!htmlOverflowsColumnArea(candidate, dims)) {
      kept.push(remaining.shift()!);
      continue;
    }
    if (kept.length === 0) {
      const block = remaining[0]!;
      const split = splitSingleBlockByMeasurement(block, dims);
      if (split.kept.trim()) kept.push(split.kept);
      if (split.overflow.trim()) {
        remaining[0] = split.overflow;
      } else {
        remaining.shift();
      }
    }
    break;
  }

  return { kept, overflow: remaining };
}

function escapeHtmlText(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function plainTextFromHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\u00a0/g, " ");
}

/** Binary-search the longest prefix of a single block that fits in the column area. */
function splitSingleBlockByMeasurement(
  blockHtml: string,
  dims: PreviewBodyDimensions
): { kept: string; overflow: string } {
  const plain = plainTextFromHtml(blockHtml).trim();
  if (!plain) return { kept: "", overflow: blockHtml };

  let lo = 0;
  let hi = plain.length;
  let best = 0;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const candidate = `<p>${escapeHtmlText(plain.slice(0, mid))}</p>`;
    if (!htmlOverflowsColumnArea(candidate, dims)) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best <= 0) {
    return { kept: "", overflow: blockHtml };
  }
  if (best >= plain.length) {
    return { kept: blockHtml, overflow: "" };
  }

  // Snap to a word boundary so we don't split mid-word visually.
  const wordBreak = plain.lastIndexOf(" ", best);
  const cut = wordBreak > best * 0.5 ? wordBreak : best;
  const keptText = plain.slice(0, cut).trim();
  const overflowText = plain.slice(cut).trim();

  return {
    kept: keptText ? `<p>${escapeHtmlText(keptText)}</p>` : "",
    overflow: overflowText ? `<p>${escapeHtmlText(overflowText)}</p>` : "",
  };
}
