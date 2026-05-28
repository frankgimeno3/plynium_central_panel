export type PageCell =
  | {
      kind: "page";
      slotId: number;
      articleIdx: number;
      magazinePage: number | null;
      isLeftPage: boolean;
    }
  | { kind: "starts-on-right" }
  | { kind: "add-new" }
  | { kind: "empty" };

export type SpreadRow = readonly [PageCell, PageCell];

/**
 * Build the list of magazine spreads (rows of 2 cells: left + right) for the
 * Article editor tab. The first article page anchors to a left or right cell
 * depending on the parity of its magazine page; the remaining article pages
 * fill cells in reading order.
 *
 * After the last article page, an "add new page" cell is appended at the next
 * available position. When that cell lands on the left of a fresh row, an
 * empty placeholder is added on the right of the same row. When the article
 * is empty, a single row with `[add-new, empty]` is returned so the user can
 * still create the first page.
 */
export function buildSpreadRows(
  slotIds: number[],
  pageBySlot: Record<number, number>
): SpreadRow[] {
  const firstSlot = slotIds[0];
  const firstMagPage = firstSlot != null ? pageBySlot[firstSlot] : undefined;
  // Magazine convention: odd publication_page = right (recto), even = left (verso).
  // Default to "left" when we don't yet know — usually the safer guess and the
  // layout snaps once the slot data arrives.
  const firstIsLeft = firstMagPage != null ? firstMagPage % 2 === 0 : true;

  const rows: SpreadRow[] = [];
  let buffer: PageCell[] = [];

  const flush = () => {
    if (buffer.length === 2) {
      rows.push([buffer[0]!, buffer[1]!] as const);
      buffer = [];
    }
  };

  if (slotIds.length > 0 && !firstIsLeft) {
    buffer.push({ kind: "starts-on-right" });
  }

  slotIds.forEach((slotId, idx) => {
    const mag = pageBySlot[slotId] ?? null;
    // Cell parity is determined by the cell's index in the buffer (0 = left,
    // 1 = right), which already accounts for the starts-on-right placeholder.
    const isLeftPage = buffer.length === 0;
    buffer.push({
      kind: "page",
      slotId,
      articleIdx: idx + 1,
      magazinePage: mag,
      isLeftPage,
    });
    flush();
  });

  if (buffer.length === 0) {
    // "+" starts a fresh row on the left → empty placeholder on the right.
    buffer.push({ kind: "add-new" });
    buffer.push({ kind: "empty" });
  } else {
    // Last article page is on the left of the current row; "+" sits next to
    // it on the right and no extra empty placeholder is needed.
    buffer.push({ kind: "add-new" });
  }
  flush();

  return rows;
}

