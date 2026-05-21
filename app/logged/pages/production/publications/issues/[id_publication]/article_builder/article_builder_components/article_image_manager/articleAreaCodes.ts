import type { GridCell, ImageAreaPlacement } from "./articleImagePlacement";

export const AREA_ROWS = 4;
const COL_LETTERS = ["a", "b", "c"] as const;

export function cellToAreaCode(col: number, row: number): string | null {
  if (col < 0 || col > 2 || row < 0 || row >= AREA_ROWS) return null;
  return `${COL_LETTERS[col]}${row + 1}`;
}

export function areaCodeToCell(code: string): GridCell | null {
  const m = String(code ?? "")
    .trim()
    .toLowerCase()
    .match(/^([abc])([1-4])$/);
  if (!m) return null;
  const col = COL_LETTERS.indexOf(m[1] as (typeof COL_LETTERS)[number]);
  const row = Number(m[2]) - 1;
  if (col < 0) return null;
  return { col, row };
}

export function normalizeAreaCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const code = String(item ?? "")
      .trim()
      .toLowerCase();
    if (!/^([abc])[1-4]$/.test(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.sort(
    (a, b) => {
      const ca = areaCodeToCell(a);
      const cb = areaCodeToCell(b);
      if (!ca || !cb) return a.localeCompare(b);
      return ca.col - cb.col || ca.row - cb.row;
    }
  );
}

export function cellsToAreaCodes(cells: GridCell[]): string[] {
  return normalizeAreaCodes(
    cells.map((c) => cellToAreaCode(c.col, c.row)).filter(Boolean)
  );
}

export function areaCodesToPlacement(
  codes: string[],
  columnCount: number
): ImageAreaPlacement | null {
  const cells = normalizeAreaCodes(codes)
    .map(areaCodeToCell)
    .filter((c): c is GridCell => c != null);
  if (!cells.length) return null;
  const cols = cells.map((c) => c.col);
  const rows = cells.map((c) => c.row);
  const colStart = Math.min(...cols);
  const colEnd = Math.max(...cols);
  const rowStart = Math.min(...rows);
  const rowEnd = Math.max(...rows);
  const maxCol = columnCount === 3 ? 2 : 1;
  if (colStart < 0 || colEnd > maxCol) return null;
  const w = colEnd - colStart + 1;
  const h = rowEnd - rowStart + 1;
  if (cells.length !== w * h) return null;
  for (let c = colStart; c <= colEnd; c++) {
    for (let r = rowStart; r <= rowEnd; r++) {
      if (!cells.some((x) => x.col === c && x.row === r)) return null;
    }
  }
  return { colStart, colEnd, rowStart, rowEnd };
}

export function areaCodesOverlap(a: string[], b: string[]): boolean {
  const setB = new Set(normalizeAreaCodes(b));
  return normalizeAreaCodes(a).some((code) => setB.has(code));
}

export function formatAreaCodesLabel(codes: string[], columnCount: number): string {
  const placement = areaCodesToPlacement(codes, columnCount);
  if (!placement) return normalizeAreaCodes(codes).join(", ");
  const span = placement.colEnd - placement.colStart + 1;
  const colPart =
    span >= columnCount
      ? "full width"
      : span === 1
        ? `column ${COL_LETTERS[placement.colStart]}`
        : `columns ${COL_LETTERS[placement.colStart]}–${COL_LETTERS[placement.colEnd]}`;
  const rowPart =
    placement.rowEnd === placement.rowStart
      ? `row ${placement.rowStart + 1}`
      : `rows ${placement.rowStart + 1}–${placement.rowEnd + 1}`;
  return `${colPart}, ${rowPart}`;
}

export function defaultColumnAreaCode(columnIndex: number): string | null {
  return cellToAreaCode(columnIndex, 0);
}

/**
 * Placement for a body text chunk in the area grid (preview + displacement).
 * Uses `chunk_area_array` when set; otherwise matches CSS column-fill order.
 */
function gridBodyChunkCellScore(chunk: {
  chunk_html?: string;
  chunk_area_array?: unknown;
}): number {
  const hasArea = normalizeAreaCodes(chunk.chunk_area_array).length > 0;
  const hasHtml = String(chunk.chunk_html ?? "").trim().length > 0;
  return (hasArea ? 4 : 0) + (hasHtml ? 2 : 0);
}

/**
 * When legacy and grid chunks share a cell, keep the one with content / explicit area.
 */
export function dedupeGridBodyChunksByCell<
  T extends {
    publication_article_chunk_id: string;
    chunk_html: string;
    chunk_position: number;
    chunk_area_array?: unknown;
  },
>(chunks: T[], columnCount: number): T[] {
  const sorted = [...chunks].sort(
    (a, b) =>
      a.chunk_position - b.chunk_position ||
      a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
  );
  const keepIds = new Set<string>();
  const bestByCell = new Map<string, { chunk: T; score: number }>();

  sorted.forEach((chunk, textChunkIndex) => {
    const placement = textChunkPlacementForPreview(
      chunk,
      textChunkIndex,
      columnCount
    );
    if (!placement) {
      keepIds.add(chunk.publication_article_chunk_id);
      return;
    }
    const key = `${placement.colStart}-${placement.rowStart}`;
    const score = gridBodyChunkCellScore(chunk);
    const prev = bestByCell.get(key);
    if (!prev) {
      bestByCell.set(key, { chunk, score });
      return;
    }
    if (score > prev.score) {
      bestByCell.set(key, { chunk, score });
      return;
    }
    if (score === prev.score) {
      const lenA = String(chunk.chunk_html ?? "").trim().length;
      const lenB = String(prev.chunk.chunk_html ?? "").trim().length;
      if (lenA > lenB || (lenA === lenB && chunk.chunk_position > prev.chunk.chunk_position)) {
        bestByCell.set(key, { chunk, score });
      }
    }
  });

  for (const { chunk } of bestByCell.values()) {
    keepIds.add(chunk.publication_article_chunk_id);
  }

  return sorted.filter((c) => keepIds.has(c.publication_article_chunk_id));
}

export function textChunkPlacementForPreview(
  chunk: { chunk_area_array?: unknown },
  textChunkIndex: number,
  columnCount: number
): ImageAreaPlacement | null {
  const codes = normalizeAreaCodes(chunk.chunk_area_array);
  if (codes.length) {
    const placement = areaCodesToPlacement(codes, columnCount);
    if (placement) return placement;
    const cell = areaCodeToCell(codes[0]);
    if (cell) {
      return {
        colStart: cell.col,
        colEnd: cell.col,
        rowStart: cell.row,
        rowEnd: cell.row,
      };
    }
  }
  const col = textChunkIndex % columnCount;
  const row = Math.floor(textChunkIndex / columnCount);
  if (row >= AREA_ROWS) return null;
  return { colStart: col, colEnd: col, rowStart: row, rowEnd: row };
}

/** Stable key so merged selections count as one block in the picker. */
export function areaSelectionKey(codes: string[]): string {
  return normalizeAreaCodes(codes).join(",");
}

/** Stable declined-merge key from two footprints (order-independent). */
export function areaPairDeclineKey(codesA: string[], codesB: string[]): string {
  return [areaSelectionKey(codesA), areaSelectionKey(codesB)].sort().join("|");
}

export function buildSimpleImageChunkHtml(src: string, alt = ""): string {
  const esc = (s: string) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  if (!src.trim()) return "";
  return `<figure class="plyn-mag-chunk__figure"><img src="${esc(src.trim())}" alt="${esc(alt)}" /></figure>`;
}
