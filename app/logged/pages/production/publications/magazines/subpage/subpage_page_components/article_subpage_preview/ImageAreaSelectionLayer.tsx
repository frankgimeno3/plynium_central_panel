"use client";

import React, { FC } from "react";
import {
  IMAGE_AREA_ROWS,
  type GridCell,
  type ImageAreaSelection,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import { GRID_BODY_CONTAINER_PAD_CLASS } from "./gridBodyLayout";
import { placementPercentStyleForPreview } from "./placementPercentStyle";

export const ImageAreaSelectionLayer: FC<{
  columnCount: number;
  imageAreas: ImageAreaSelection[];
  overlayBlockedCellKeys?: ReadonlySet<string>;
  onCellClick?: (cell: GridCell) => void;
  onRemoveArea?: (areaId: string) => void;
}> = ({
  columnCount,
  imageAreas,
  overlayBlockedCellKeys,
  onCellClick,
  onRemoveArea,
}) => {
  const occupied = new Set<string>();
  for (const area of imageAreas) {
    for (const cell of area.cells) {
      occupied.add(`${cell.col}-${cell.row}`);
    }
  }
  if (overlayBlockedCellKeys) {
    for (const key of overlayBlockedCellKeys) {
      occupied.add(key);
    }
  }
  const cells: GridCell[] = [];
  for (let col = 0; col < columnCount; col++) {
    for (let row = 0; row < IMAGE_AREA_ROWS; row++) {
      cells.push({ col, row });
    }
  }
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-30 ${GRID_BODY_CONTAINER_PAD_CLASS}`}
    >
      {cells.map((cell) => {
        const key = `${cell.col}-${cell.row}`;
        const isOccupied = occupied.has(key);
        const style = placementPercentStyleForPreview(
          {
            colStart: cell.col,
            colEnd: cell.col,
            rowStart: cell.row,
            rowEnd: cell.row,
          },
          columnCount
        );
        return (
          <button
            key={`cell-${key}`}
            type="button"
            disabled={isOccupied || !onCellClick}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isOccupied) onCellClick?.(cell);
            }}
            className={`pointer-events-auto absolute block border-4 border-dashed transition ${
              isOccupied
                ? "pointer-events-none border-transparent"
                : "border-red-400/80 bg-red-400/10 hover:bg-red-400/25"
            }`}
            style={style}
            aria-label={`Image area column ${cell.col + 1}, row ${cell.row + 1}`}
          />
        );
      })}
      {imageAreas.map((area) => {
        const style = placementPercentStyleForPreview(area.placement, columnCount);
        return (
          <div
            key={`area-${area.id}`}
            className="pointer-events-auto absolute border-4 border-solid border-red-500 bg-red-500/20"
            style={style}
            aria-label="Selected image area"
          >
            {onRemoveArea ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveArea(area.id);
                }}
                aria-label="Deselect this image area"
                title="Deselect this image area"
                className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
