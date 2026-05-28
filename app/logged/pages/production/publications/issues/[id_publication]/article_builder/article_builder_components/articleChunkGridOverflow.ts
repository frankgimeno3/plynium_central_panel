/**
 * Grid body text overflow: spill plain text to the next chunk in column-major order
 * (a1→a4, b1→b4, …). When the last cell of a page overflows, continue on the next
 * article page (creating one via sync-pages if needed).
 */

import { normalizeAreaCodes } from "./article_image_manager/articleAreaCodes";
import { IMAGE_AREA_ROWS } from "./article_image_manager/articleImagePlacement";
import {
  chunkHtmlToPlainText,
  chunkSupportsTextEditing,
  plainTextToChunkHtml,
  readChunkEditableHtml,
  writeChunkEditableHtml,
} from "./articleChunkPlainTextEditing";
import { normalizeChunkFormat } from "./magazineArticleColumnFlow";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";

const COL_LETTERS = ["a", "b", "c"] as const;

/** Matches {@link ArticleSubpagePagePreview} grid text editor typography. */
export const GRID_TEXT_OVERFLOW_MEASURE_CLASS =
  "block w-full border-0 bg-white px-8 py-2 text-3xl leading-snug text-gray-500 text-justify [overflow-wrap:anywhere] [&_p]:text-justify";

export type GridPageTextChunk = {
  chunkId: string;
  areaCode: string;
  format: string;
  html: string;
};

export type GridOverflowResult = {
  updates: Map<string, string>;
  remainingCarry: string;
};

/** Column-major cell order (newspaper flow within one page). */
export function gridCellOverflowOrder(columnCount: number): string[] {
  const cols = columnCount === 3 ? 3 : 2;
  const codes: string[] = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < IMAGE_AREA_ROWS; r++) {
      codes.push(`${COL_LETTERS[c]}${r + 1}`);
    }
  }
  return codes;
}

function primaryAreaCode(chunk: {
  chunk_area_array?: unknown;
}): string | null {
  const codes = normalizeAreaCodes(chunk.chunk_area_array);
  return codes[0] ?? null;
}

function sortSlotOnlyTextChunks<
  T extends {
    publication_article_chunk_id: string;
    chunk_position: number;
  },
>(onSlot: T[]): T[] {
  return [...onSlot].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
}

export function buildGridPageTextChunks(
  slotId: number,
  chunks: Array<{
    publication_article_chunk_id: string;
    publication_slot_id?: number | null;
    publication_slot_content_id?: number | null;
    publication_article_chunk_format: string;
    chunk_html: string;
    chunk_position: number;
    chunk_area_array?: unknown;
  }>,
  columnCount: number
): GridPageTextChunk[] {
  const order = gridCellOverflowOrder(columnCount);
  const onSlot = sortSlotOnlyTextChunks(
    chunks.filter((c) => {
      if (chunkPublicationSlotId(c) !== slotId) return false;
      const fmt = normalizeChunkFormat(c.publication_article_chunk_format);
      return fmt === "only_text" && chunkSupportsTextEditing(fmt);
    })
  );

  const byCode = new Map<string, GridPageTextChunk>();
  const orphans: typeof onSlot = [];

  for (const c of onSlot) {
    const code = primaryAreaCode(c);
    if (!code) {
      orphans.push(c);
      continue;
    }
    byCode.set(code, {
      chunkId: c.publication_article_chunk_id,
      areaCode: code,
      format: String(c.publication_article_chunk_format),
      html: String(c.chunk_html ?? ""),
    });
  }

  let orphanIdx = 0;
  for (const code of order) {
    if (byCode.has(code)) continue;
    const orphan = orphans[orphanIdx++];
    if (!orphan) break;
    byCode.set(code, {
      chunkId: orphan.publication_article_chunk_id,
      areaCode: code,
      format: String(orphan.publication_article_chunk_format),
      html: String(orphan.chunk_html ?? ""),
    });
  }

  return order
    .map((code) => byCode.get(code))
    .filter((x): x is GridPageTextChunk => x != null);
}

/**
 * Persists `chunk_area_array` on legacy body chunks that predate the grid, so they
 * occupy the same cells as the preview and do not get shadowed by empty duplicates.
 */
export async function assignGridAreaCodesToOrphanTextChunks<
  T extends {
    publication_article_chunk_id: string;
    publication_slot_id?: number | null;
    publication_slot_content_id?: number | null;
    publication_article_chunk_format: string;
    chunk_html: string;
    chunk_position: number;
    chunk_area_array?: unknown;
  },
>(options: {
  slotId: number;
  columnCount: number;
  chunks: T[];
}): Promise<T[]> {
  const { slotId, columnCount } = options;
  let working = [...options.chunks];
  const order = gridCellOverflowOrder(columnCount);
  const onSlot = sortSlotOnlyTextChunks(
    working.filter((c) => {
      if (chunkPublicationSlotId(c) !== slotId) return false;
      const fmt = normalizeChunkFormat(c.publication_article_chunk_format);
      return fmt === "only_text" && chunkSupportsTextEditing(fmt);
    })
  );

  const occupied = new Set<string>();
  for (const c of onSlot) {
    const code = primaryAreaCode(c);
    if (code) occupied.add(code);
  }

  const orphans = onSlot.filter((c) => !primaryAreaCode(c));
  if (!orphans.length) return working;

  let codeIdx = 0;
  for (const orphan of orphans) {
    while (codeIdx < order.length && occupied.has(order[codeIdx]!)) {
      codeIdx += 1;
    }
    if (codeIdx >= order.length) break;
    const areaCode = order[codeIdx]!;
    occupied.add(areaCode);

    try {
      const res = await fetch(
        `/api/v1/publication-article-chunks/${encodeURIComponent(
          orphan.publication_article_chunk_id
        )}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chunk_area_array: [areaCode] }),
        }
      );
      if (!res.ok) continue;
      const updated = (await res.json()) as T;
      working = working.map((c) =>
        c.publication_article_chunk_id === updated.publication_article_chunk_id
          ? {
              ...c,
              chunk_area_array:
                (updated as { chunk_area_array?: string[] }).chunk_area_array ?? [
                  areaCode,
                ],
            }
          : c
      );
    } catch {
      /* best-effort */
    }
  }

  return working;
}

let measureHost: HTMLDivElement | null = null;

function measureHtmlHeight(html: string, widthPx: number): number {
  if (typeof document === "undefined") return 0;
  if (!measureHost) {
    measureHost = document.createElement("div");
    measureHost.setAttribute("aria-hidden", "true");
    document.body.appendChild(measureHost);
  }
  measureHost.className = GRID_TEXT_OVERFLOW_MEASURE_CLASS;
  measureHost.style.cssText = `position:fixed;left:-10000px;top:0;width:${Math.max(1, Math.round(widthPx))}px;visibility:hidden;pointer-events:none;`;
  measureHost.innerHTML = html || "";
  return measureHost.scrollHeight;
}

function splitPlainTextForMaxHeight(
  plain: string,
  maxHeightPx: number,
  widthPx: number
): { keep: string; overflow: string } {
  const normalized = String(plain ?? "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) return { keep: "", overflow: "" };

  const fullHtml = plainTextToChunkHtml(normalized);
  if (measureHtmlHeight(fullHtml, widthPx) <= maxHeightPx) {
    return { keep: normalized, overflow: "" };
  }

  let lo = 0;
  let hi = normalized.length;
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (mid === 0) {
      lo = 1;
      continue;
    }
    let cut = mid;
    const nl = normalized.lastIndexOf("\n", mid - 1);
    if (nl >= 0) cut = nl + 1;
    else {
      const sp = normalized.lastIndexOf(" ", mid - 1);
      if (sp > 0) cut = sp + 1;
    }
    const slice = normalized.slice(0, cut).trimEnd();
    if (!slice) {
      hi = mid - 1;
      continue;
    }
    const h = measureHtmlHeight(plainTextToChunkHtml(slice), widthPx);
    if (h <= maxHeightPx) {
      best = cut;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (best <= 0) {
    return { keep: "", overflow: normalized.trimStart() };
  }

  const keep = normalized.slice(0, best).trimEnd();
  const overflow = normalized.slice(best).trimStart();
  return { keep, overflow };
}

/**
 * Push `carryPlain` through chunks starting at `startIndex`, prepending into each
 * cell and spilling overflow downward. Mutates `updates`.
 */
export function distributeCarryThroughOrderedChunks(
  ordered: GridPageTextChunk[],
  startIndex: number,
  carryPlain: string,
  maxHeightPx: number,
  widthPx: number,
  updates: Map<string, string>
): string {
  let carry = String(carryPlain ?? "").trim();
  if (!carry) return "";

  for (let i = Math.max(0, startIndex); i < ordered.length && carry; i++) {
    const target = ordered[i]!;
    const previousHtml = updates.get(target.chunkId) ?? target.html;
    const existingPlain = chunkHtmlToPlainText(
      readChunkEditableHtml(previousHtml, target.format)
    );
    const mergedPlain = existingPlain ? `${carry}\n${existingPlain}` : carry;
    const split = splitPlainTextForMaxHeight(mergedPlain, maxHeightPx, widthPx);
    updates.set(
      target.chunkId,
      writeChunkEditableHtml(
        previousHtml,
        target.format,
        plainTextToChunkHtml(split.keep)
      )
    );
    carry = split.overflow;
  }

  return carry;
}

/**
 * Split the source chunk and spill through later chunks on the same page.
 */
export function computeGridTextOverflowUpdates(options: {
  sourceChunkId: string;
  sourceInnerHtml: string;
  sourcePreviousChunkHtml: string;
  sourceFormat: string;
  maxHeightPx: number;
  widthPx: number;
  pageTextChunks: GridPageTextChunk[];
  columnCount: number;
}): GridOverflowResult | null {
  const {
    sourceChunkId,
    sourceInnerHtml,
    sourcePreviousChunkHtml,
    sourceFormat,
    maxHeightPx,
    widthPx,
    pageTextChunks,
    columnCount,
  } = options;

  if (maxHeightPx < 12 || widthPx < 8) return null;

  const ordered = gridCellOverflowOrder(columnCount)
    .map((code) => pageTextChunks.find((c) => c.areaCode === code))
    .filter((x): x is GridPageTextChunk => x != null);

  const sourceIdx = ordered.findIndex((c) => c.chunkId === sourceChunkId);
  if (sourceIdx < 0) return null;

  const lastAreaCode =
    gridCellOverflowOrder(columnCount)[gridCellOverflowOrder(columnCount).length - 1];
  const sourceAreaCode = ordered[sourceIdx]?.areaCode ?? null;
  const isLastGridCellOnPage = sourceAreaCode === lastAreaCode;

  const sourcePlain = chunkHtmlToPlainText(
    readChunkEditableHtml(
      writeChunkEditableHtml(sourcePreviousChunkHtml, sourceFormat, sourceInnerHtml),
      sourceFormat
    )
  );

  const firstSplit = splitPlainTextForMaxHeight(
    sourcePlain,
    maxHeightPx,
    widthPx
  );
  if (!firstSplit.overflow.trim()) return null;

  const updates = new Map<string, string>();
  updates.set(
    sourceChunkId,
    writeChunkEditableHtml(
      sourcePreviousChunkHtml,
      sourceFormat,
      plainTextToChunkHtml(firstSplit.keep)
    )
  );

  const remainingCarry = isLastGridCellOnPage
    ? firstSplit.overflow
    : distributeCarryThroughOrderedChunks(
        ordered,
        sourceIdx + 1,
        firstSplit.overflow,
        maxHeightPx,
        widthPx,
        updates
      );

  return { updates, remainingCarry };
}
