import {
  areaCodeToCell,
  areaCodesToPlacement,
  normalizeAreaCodes,
} from "../article_image_manager/articleAreaCodes";
import { parseOverlayPlacement } from "../article_image_manager/articleImagePlacement";
import type { PublicationArticleChunk } from "./types";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";

export type ArticleBoxPlacementStrategy =
  | "use_last_page"
  | "new_page"
  | "replace_on_last_page"
  /** Edit mode: keep box on the current last page (default). */
  | "keep_current"
  /** Edit mode: move box to the previous page (removes the current last page). */
  | "move_to_previous_page";

export function articleBoxTargetAreaCode(columnCount: number): string {
  return columnCount === 3 ? "c4" : "b4";
}

export function articleBoxTargetAreaLabel(columnCount: number): string {
  return articleBoxTargetAreaCode(columnCount).toUpperCase();
}

export function chunkOccupiesBoxTargetCell(
  chunk: PublicationArticleChunk,
  columnCount: number,
  targetCode: string
): boolean {
  const cell = areaCodeToCell(targetCode);
  if (!cell) return false;

  const codes = normalizeAreaCodes((chunk as { chunk_area_array?: unknown }).chunk_area_array);
  if (codes.includes(targetCode)) return true;

  const placement =
    codes.length > 0
      ? areaCodesToPlacement(codes, columnCount)
      : parseOverlayPlacement(chunk.chunk_html);
  if (!placement) return false;

  return (
    cell.col >= placement.colStart &&
    cell.col <= placement.colEnd &&
    cell.row >= placement.rowStart &&
    cell.row <= placement.rowEnd
  );
}

export function getLastPublicationSlotId(slotIds: number[]): number | null {
  const ordered = slotIds.filter((sid) => Number.isFinite(sid) && sid > 0);
  return ordered.length ? ordered[ordered.length - 1]! : null;
}

export function analyzeArticleBoxTargetSlot(
  chunks: PublicationArticleChunk[],
  slotId: number,
  columnCount: number
): {
  targetAreaCode: string;
  targetAreaLabel: string;
  occupied: boolean;
  conflictingChunkIds: string[];
} {
  const targetAreaCode = articleBoxTargetAreaCode(columnCount);
  const targetAreaLabel = articleBoxTargetAreaLabel(columnCount);
  const pageChunks = chunks.filter((ch) => chunkPublicationSlotId(ch) === slotId);
  const conflictingChunkIds: string[] = [];

  for (const ch of pageChunks) {
    if (chunkOccupiesBoxTargetCell(ch, columnCount, targetAreaCode)) {
      conflictingChunkIds.push(ch.publication_article_chunk_id);
    }
  }

  return {
    targetAreaCode,
    targetAreaLabel,
    occupied: conflictingChunkIds.length > 0,
    conflictingChunkIds,
  };
}
