/**
 * Magazine page body grid: columns a,b,c (or a,b) and rows 1–4.
 */

export const AREA_ROWS = 4;
const COL_LETTERS = ["a", "b", "c"];

/**
 * @param {number} col 0-based column index
 * @param {number} row 0-based row index
 * @returns {string|null}
 */
export function cellToAreaCode(col, row) {
    const c = Number(col);
    const r = Number(row);
    if (!Number.isFinite(c) || c < 0 || c > 2) return null;
    if (!Number.isFinite(r) || r < 0 || r >= AREA_ROWS) return null;
    return `${COL_LETTERS[c]}${r + 1}`;
}

/**
 * @param {string} code e.g. "b2"
 * @returns {{ col: number, row: number }|null}
 */
export function areaCodeToCell(code) {
    const m = String(code ?? "")
        .trim()
        .toLowerCase()
        .match(/^([abc])([1-4])$/);
    if (!m) return null;
    const col = COL_LETTERS.indexOf(m[1]);
    const row = Number(m[2]) - 1;
    if (col < 0 || row < 0 || row >= AREA_ROWS) return null;
    return { col, row };
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeChunkAreaArray(raw) {
    if (!Array.isArray(raw)) return [];
    const out = [];
    const seen = new Set();
    for (const item of raw) {
        const code = String(item ?? "")
            .trim()
            .toLowerCase();
        if (!/^([abc])[1-4]$/.test(code)) continue;
        if (seen.has(code)) continue;
        seen.add(code);
        out.push(code);
    }
    return out.sort(compareAreaCodes);
}

function compareAreaCodes(a, b) {
    const ca = areaCodeToCell(a);
    const cb = areaCodeToCell(b);
    if (!ca || !cb) return a.localeCompare(b);
    return ca.col - cb.col || ca.row - cb.row;
}

/**
 * @param {string[]} a
 * @param {string[]} b
 */
export function areaArraysOverlap(a, b) {
    const setB = new Set(normalizeChunkAreaArray(b));
    for (const code of normalizeChunkAreaArray(a)) {
        if (setB.has(code)) return true;
    }
    return false;
}

/**
 * @param {string[]} codes
 * @param {number} columnCount 2 or 3
 * @returns {{ colStart: number, colEnd: number, rowStart: number, rowEnd: number }|null}
 */
export function areaCodesToPlacement(codes, columnCount = 3) {
    const cells = normalizeChunkAreaArray(codes)
        .map(areaCodeToCell)
        .filter(Boolean);
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

/**
 * @param {number} col
 * @param {number} columnCount
 * @returns {string[]}
 */
/**
 * All grid cells for the article body (full page text block on new pages).
 * @param {number} columnCount 2 or 3
 * @returns {string[]}
 */
export function fullPageBodyAreaCodes(columnCount = 3) {
    const maxCol = columnCount === 3 ? 2 : 1;
    const codes = [];
    for (let col = 0; col <= maxCol; col++) {
        for (let row = 0; row < AREA_ROWS; row++) {
            const code = cellToAreaCode(col, row);
            if (code) codes.push(code);
        }
    }
    return codes;
}

/**
 * @param {{ colStart: number, colEnd: number, rowStart: number, rowEnd: number }|null} placement
 * @param {number} columnCount
 */
export function isFullPageBodyPlacement(placement, columnCount = 3) {
    if (!placement) return false;
    const maxCol = columnCount === 3 ? 2 : 1;
    return (
        placement.colStart === 0 &&
        placement.colEnd === maxCol &&
        placement.rowStart === 0 &&
        placement.rowEnd === AREA_ROWS - 1
    );
}

/** @param {number} columnCount 2 or 3 */
export function perCellBodyGridExpectedCount(columnCount = 3) {
    const cols = columnCount === 3 ? 3 : 2;
    return cols * AREA_ROWS;
}

/**
 * Ordered list of single-cell area codes (row-major: a1–a4, b1–b4, c1–c4).
 * @param {number} columnCount
 * @returns {string[]}
 */
export function perCellBodyGridAreaCodes(columnCount = 3) {
    const maxCol = columnCount === 3 ? 2 : 1;
    const codes = [];
    for (let row = 0; row < AREA_ROWS; row++) {
        for (let col = 0; col <= maxCol; col++) {
            const code = cellToAreaCode(col, row);
            if (code) codes.push(code);
        }
    }
    return codes;
}

/** Column-major cell order (matches article builder grid overflow / preview). */
export function gridCellOverflowOrder(columnCount = 3) {
    const cols = columnCount === 3 ? 3 : 2;
    const codes = [];
    for (let c = 0; c < cols; c++) {
        for (let row = 0; row < AREA_ROWS; row++) {
            const code = cellToAreaCode(c, row);
            if (code) codes.push(code);
        }
    }
    return codes;
}

/**
 * @param {string[]} codes
 */
export function isSingleCellAreaCodes(codes) {
    const normalized = normalizeChunkAreaArray(codes);
    return normalized.length === 1 && areaCodeToCell(normalized[0]) != null;
}

/**
 * True when every grid cell has exactly one body text chunk on this slot.
 * @param {Array<{ get: (k: string) => unknown }>} bodyChunks
 * @param {number} columnCount
 */
export function hasCompletePerCellBodyGrid(bodyChunks, columnCount = 3) {
    const expected = perCellBodyGridExpectedCount(columnCount);
    const seen = new Set();
    for (const c of bodyChunks) {
        const areas = normalizeChunkAreaArray(c.get("chunk_area_array"));
        if (!isSingleCellAreaCodes(areas)) return false;
        const cell = areaCodeToCell(areas[0]);
        if (!cell) return false;
        seen.add(areas[0]);
    }
    return seen.size === expected;
}

export function columnAreaCodes(col, columnCount = 3) {
    const maxCol = columnCount === 3 ? 2 : 1;
    if (col < 0 || col > maxCol) return [];
    return Array.from({ length: AREA_ROWS }, (_, r) => cellToAreaCode(col, r)).filter(Boolean);
}

/**
 * Next free area in the same column, scanning downward from `startRow`.
 * @param {Set<string>} occupied
 */
export function nextFreeAreaInColumn(col, startRow, occupied, columnCount = 3) {
    for (let r = startRow; r < AREA_ROWS; r++) {
        const code = cellToAreaCode(col, r);
        if (code && !occupied.has(code)) return code;
    }
    return null;
}

/**
 * @param {string[]} codes
 * @param {number} columnCount
 */
export function formatAreaCodesLabel(codes, columnCount = 3) {
    const placement = areaCodesToPlacement(codes, columnCount);
    if (!placement) {
        return normalizeChunkAreaArray(codes).join(", ");
    }
    const span = placement.colEnd - placement.colStart + 1;
    const colPart =
        span >= columnCount
            ? "full width"
            : span === 1
              ? `column ${String.fromCharCode(97 + placement.colStart)}`
              : `columns ${String.fromCharCode(97 + placement.colStart)}–${String.fromCharCode(97 + placement.colEnd)}`;
    const rowSpan = placement.rowEnd - placement.rowStart + 1;
    const rowLabels = ["top", "upper-mid", "lower-mid", "bottom"];
    const rowPart =
        rowSpan >= AREA_ROWS
            ? "full height"
            : rowSpan === 1
              ? `row ${placement.rowStart + 1} (${rowLabels[placement.rowStart] ?? ""})`
              : `rows ${placement.rowStart + 1}–${placement.rowEnd + 1}`;
    return `${colPart}, ${rowPart}`;
}
