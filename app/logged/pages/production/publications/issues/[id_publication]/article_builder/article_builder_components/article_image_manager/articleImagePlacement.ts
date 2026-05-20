import { extractFirstImgSrc } from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/magazineChunkMediaHtml";

/**
 * Number of stacked image-area cells per column. The page-body is divided
 * into a `columnCount × IMAGE_AREA_ROWS` grid that authors use to draw
 * floating image overlays on top of the article text.
 */
export const IMAGE_AREA_ROWS = 4;
export const MAX_IMAGE_AREAS_PER_PAGE = 4;

export type GridCell = { col: number; row: number };

export type ImageAreaPlacement = {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
};

export type ImageAreaSelection = {
  id: string;
  cells: GridCell[];
  placement: ImageAreaPlacement;
  /** Grid labels (a1, b2, …) — canonical footprint for persistence. */
  areaCodes?: string[];
};

export function cellKey(c: GridCell): string {
  return `${c.col}-${c.row}`;
}

export function placementFromCells(cells: GridCell[]): ImageAreaPlacement | null {
  if (!cells.length) return null;
  const cols = cells.map((c) => c.col);
  const rows = cells.map((c) => c.row);
  const colStart = Math.min(...cols);
  const colEnd = Math.max(...cols);
  const rowStart = Math.min(...rows);
  const rowEnd = Math.max(...rows);
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

export function isVerticallyAdjacent(a: GridCell, b: GridCell): boolean {
  return a.col === b.col && Math.abs(a.row - b.row) === 1;
}

export function isHorizontallyAdjacent(a: GridCell, b: GridCell): boolean {
  return a.row === b.row && Math.abs(a.col - b.col) === 1;
}

export function isAdjacent(a: GridCell, b: GridCell): boolean {
  return isVerticallyAdjacent(a, b) || isHorizontallyAdjacent(a, b);
}

export function mergeCells(...groups: GridCell[][]): GridCell[] {
  const map = new Map<string, GridCell>();
  for (const group of groups) {
    for (const cell of group) {
      map.set(cellKey(cell), cell);
    }
  }
  return [...map.values()];
}

export function canMergeCells(...groups: GridCell[][]): boolean {
  return placementFromCells(mergeCells(...groups)) != null;
}

export function canAddCellToSelection(cells: GridCell[], cell: GridCell): boolean {
  if (cells.some((c) => c.col === cell.col && c.row === cell.row)) return false;
  if (cells.length === 0) return true;
  if (!cells.some((c) => isAdjacent(c, cell))) return false;
  return canMergeCells(cells, [cell]);
}

export function findMergeableAreaForCell(
  areas: ImageAreaSelection[],
  cell: GridCell
): ImageAreaSelection | null {
  for (const area of areas) {
    if (area.cells.some((c) => c.col === cell.col && c.row === cell.row)) continue;
    if (!area.cells.some((c) => isAdjacent(c, cell))) continue;
    if (canMergeCells(area.cells, [cell])) return area;
  }
  return null;
}

export function areasAreMergeable(
  a: ImageAreaSelection,
  b: ImageAreaSelection
): boolean {
  if (a.id === b.id) return false;
  return canMergeCells(a.cells, b.cells);
}

export function mergePairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("|");
}

export type MergeableAreaPair = {
  areaIds: [string, string];
  areas: [ImageAreaSelection, ImageAreaSelection];
  mergedPlacement: ImageAreaPlacement;
};

export function findFirstMergeableAreaPair(
  areas: ImageAreaSelection[]
): MergeableAreaPair | null {
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const a = areas[i];
      const b = areas[j];
      if (!areasAreMergeable(a, b)) continue;
      const mergedCells = mergeCells(a.cells, b.cells);
      const mergedPlacement = placementFromCells(mergedCells);
      if (!mergedPlacement) continue;
      return {
        areaIds: [a.id, b.id],
        areas: [a, b],
        mergedPlacement,
      };
    }
  }
  return null;
}

export function sortAreasForDisplay(areas: ImageAreaSelection[]): ImageAreaSelection[] {
  return [...areas].sort(
    (a, b) =>
      a.placement.rowStart - b.placement.rowStart ||
      a.placement.colStart - b.placement.colStart
  );
}

export function findAreaContainingCell(
  areas: ImageAreaSelection[],
  cell: GridCell
): ImageAreaSelection | null {
  return (
    areas.find((a) => a.cells.some((c) => c.col === cell.col && c.row === cell.row)) ?? null
  );
}

export function parseOverlayPlacement(html: string): ImageAreaPlacement | null {
  const raw = String(html ?? "");
  const m = raw.match(/data-pmc-overlay="([^"]*)"/);
  if (!m?.[1]) return null;
  try {
    const json = decodeURIComponent(m[1]);
    const p = JSON.parse(json) as ImageAreaPlacement;
    if (
      Number.isFinite(p.colStart) &&
      Number.isFinite(p.colEnd) &&
      Number.isFinite(p.rowStart) &&
      Number.isFinite(p.rowEnd)
    ) {
      return {
        colStart: Number(p.colStart),
        colEnd: Number(p.colEnd),
        rowStart: Number(p.rowStart),
        rowEnd: Number(p.rowEnd),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function escAttr(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function buildOverlayImageHtml(
  src: string,
  placement: ImageAreaPlacement,
  alt = ""
): string {
  if (!src?.trim()) return "";
  const encoded = encodeURIComponent(JSON.stringify(placement));
  return `<figure class="plyn-mag-chunk__figure plyn-mag-overlay-image" data-pmc-overlay="${escAttr(encoded)}"><img src="${escAttr(src.trim())}" alt="${escAttr(alt)}" /></figure>`;
}

export function isOverlayImageChunk(
  html: string,
  format: string,
  chunkAreaArray?: unknown
): boolean {
  if (String(format).toLowerCase() !== "only_image") return false;
  if (Array.isArray(chunkAreaArray) && chunkAreaArray.length > 0) return true;
  return parseOverlayPlacement(html) != null;
}

export function overlayImageSrc(html: string): string | null {
  return extractFirstImgSrc(html);
}

export function placementPercentStyle(
  placement: ImageAreaPlacement,
  columnCount: number
): { left: string; top: string; width: string; height: string } {
  const colSpan = placement.colEnd - placement.colStart + 1;
  const rowSpan = placement.rowEnd - placement.rowStart + 1;
  return {
    left: `${(placement.colStart / columnCount) * 100}%`,
    width: `${(colSpan / columnCount) * 100}%`,
    top: `${(placement.rowStart / IMAGE_AREA_ROWS) * 100}%`,
    height: `${(rowSpan / IMAGE_AREA_ROWS) * 100}%`,
  };
}

const BODY_ROW_LABELS = ["top third", "middle third", "bottom third"] as const;

function columnSpanLabel(
  placement: ImageAreaPlacement,
  columnCount: number
): string {
  const span = placement.colEnd - placement.colStart + 1;
  if (span >= columnCount) return "full width";
  if (span === 1) return `column ${placement.colStart + 1}`;
  return `columns ${placement.colStart + 1} to ${placement.colEnd + 1}`;
}

function rowSpanLabel(placement: ImageAreaPlacement): string {
  const span = placement.rowEnd - placement.rowStart + 1;
  if (span >= IMAGE_AREA_ROWS) return "full body height";
  if (span === 1) {
    return BODY_ROW_LABELS[placement.rowStart] ?? `row ${placement.rowStart + 1}`;
  }
  const start =
    BODY_ROW_LABELS[placement.rowStart] ?? `row ${placement.rowStart + 1}`;
  const end = BODY_ROW_LABELS[placement.rowEnd] ?? `row ${placement.rowEnd + 1}`;
  return `${start} through ${end}`;
}

/** Plain-language summary for UI lists (no grid coordinates). */
export function formatImageAreaLabel(
  placement: ImageAreaPlacement,
  columnCount: number
): string {
  return `${columnSpanLabel(placement, columnCount)}, ${rowSpanLabel(placement)}`;
}
