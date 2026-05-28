"use client";

import type { ImageAreaPlacement } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import { GRID_BODY_ROW_WEIGHTS } from "./gridBodyLayout";

export {
  GRID_BODY_CONTAINER_PAD_CLASS,
  GRID_BODY_LAST_ROW_WEIGHT,
  GRID_BOTTOM_ROW_CONTENT_PAD_CLASS,
  GRID_BOTTOM_ROW_OVERFLOW_HEIGHT_FUDGE_PX,
  GRID_CHUNK_HORIZONTAL_PAD_CLASS,
  GRID_OVERLAY_IMAGE_PAD_CLASS,
  isBottomGridRow,
} from "./gridBodyLayout";

const ROW_WEIGHTS = GRID_BODY_ROW_WEIGHTS;

function sum(xs: readonly number[]): number {
  return xs.reduce((acc, x) => acc + x, 0);
}

function prefixSum(xs: readonly number[], endExclusive: number): number {
  let out = 0;
  for (let i = 0; i < endExclusive; i++) out += xs[i] ?? 0;
  return out;
}

export function placementPercentStyleForPreview(
  placement: ImageAreaPlacement,
  columnCount: number
): { left: string; top: string; width: string; height: string } {
  const colSpan = placement.colEnd - placement.colStart + 1;
  const totalRows = ROW_WEIGHTS.length;
  const rowStart = Math.max(0, Math.min(totalRows, placement.rowStart));
  const rowEnd = Math.max(rowStart, Math.min(totalRows - 1, placement.rowEnd));
  const totalWeight = sum(ROW_WEIGHTS);
  const topWeight = prefixSum(ROW_WEIGHTS, rowStart);
  const heightWeight = prefixSum(ROW_WEIGHTS, rowEnd + 1) - topWeight;

  return {
    left: `${(placement.colStart / columnCount) * 100}%`,
    width: `${(colSpan / columnCount) * 100}%`,
    top: `${(topWeight / totalWeight) * 100}%`,
    height: `${(heightWeight / totalWeight) * 100}%`,
  };
}

