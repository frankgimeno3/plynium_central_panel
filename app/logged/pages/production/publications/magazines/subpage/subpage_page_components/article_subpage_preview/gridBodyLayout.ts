import type { ImageAreaPlacement } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";

/** Matches grid / overlay wrapper padding ({@link GRID_BODY_CONTAINER_CLASS}). */
export const GRID_BODY_CONTAINER_PAD_CLASS = "box-border p-4";

/** Horizontal padding inside each grid text chunk. */
export const GRID_CHUNK_HORIZONTAL_PAD_CLASS = "px-8";

/** Overlay image cell padding — same inset on all sides as chunk horizontal padding. */
export const GRID_OVERLAY_IMAGE_PAD_CLASS = "px-8 py-8";

export const GRID_BODY_ROW_COUNT = 4;

export const GRID_BODY_LAST_ROW_WEIGHT = 0.58;

export const GRID_BODY_ROW_WEIGHTS = [1, 1, 1, GRID_BODY_LAST_ROW_WEIGHT] as const;

/** Extra bottom inset inside the last grid row so descenders are not clipped. */
export const GRID_BOTTOM_ROW_CONTENT_PAD_CLASS = "pb-4";

/** Subtract from overflow `maxHeightPx` for last-row editors (matches visual inset). */
export const GRID_BOTTOM_ROW_OVERFLOW_HEIGHT_FUDGE_PX = 20;

export function isBottomGridRow(placement: ImageAreaPlacement): boolean {
  return placement.rowEnd >= GRID_BODY_ROW_COUNT - 1;
}
