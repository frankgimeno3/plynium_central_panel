"use client";

import React, { FC, useMemo } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import type { MagazinePageLayout } from "../magazinePageLayout";
import type { MagazineArticleFlowPageInput } from "../magazineArticleColumnFlow";
import {
  canAddCellToSelection,
  cellKey,
  findAreaContainingCell,
  IMAGE_AREA_ROWS,
  placementFromCells,
  placementPercentStyle,
  type GridCell,
  type ImageAreaSelection,
} from "./articleImagePlacement";

const PAGE_ASPECT = "228 / 297";

type ArticleImageAreaGridProps = {
  columnCount: number;
  areas: ImageAreaSelection[];
  draftCells: GridCell[];
  hoveredCell: GridCell | null;
  onHoverCell: (cell: GridCell | null) => void;
  onCellClick: (cell: GridCell) => void;
  onRemoveArea: (areaId: string) => void;
  onClearDraft: () => void;
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  pageFormat: MagazinePageLayout;
  articleFlowPages: MagazineArticleFlowPageInput[];
  slotContentId: number;
};

export const ArticleImageAreaGrid: FC<ArticleImageAreaGridProps> = ({
  columnCount,
  areas,
  draftCells,
  hoveredCell,
  onHoverCell,
  onCellClick,
  onRemoveArea,
  onClearDraft,
  chunks,
  pageIndex,
  isLeftPage,
  publicationPage,
  pageFormat,
  articleFlowPages,
  slotContentId,
}) => {
  const draftPlacement = useMemo(
    () => (draftCells.length ? placementFromCells(draftCells) : null),
    [draftCells]
  );

  const cells = useMemo(() => {
    const out: GridCell[] = [];
    for (let col = 0; col < columnCount; col++) {
      for (let row = 0; row < IMAGE_AREA_ROWS; row++) {
        out.push({ col, row });
      }
    }
    return out;
  }, [columnCount]);

  const gridColsClass = columnCount === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <div
      className="relative mx-auto w-full max-w-md"
      style={{ aspectRatio: PAGE_ASPECT }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden rounded-sm border border-gray-300 bg-white shadow-md [&_*]:pointer-events-none [&>div]:h-full [&>div]:w-full [&_div]:max-w-none">
        <ArticleSubpagePagePreview
          hideHeading
          chunks={chunks}
          pageIndex={pageIndex}
          isLeftPage={isLeftPage}
          publicationPage={publicationPage}
          pageFormat={pageFormat}
          articleFlowPages={articleFlowPages}
          currentSlotContentId={slotContentId}
        />
      </div>

      <div className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-sm">
        <header className="shrink-0 px-4 py-3" aria-hidden>
          <div className="text-lg font-bold leading-tight opacity-0">.</div>
          <p className="mt-1 text-sm font-semibold opacity-0">.</p>
        </header>

        <div className={`relative min-h-0 flex-1 grid ${gridColsClass} border-t border-transparent`}>
          {Array.from({ length: columnCount }, (_, col) => (
            <div
              key={col}
              className={`relative grid h-full grid-rows-3 ${col < columnCount - 1 ? "border-r border-red-400/25" : ""}`}
            >
              {Array.from({ length: IMAGE_AREA_ROWS }, (_, row) => {
                const cell: GridCell = { col, row };
                const key = cellKey(cell);
                const inArea = findAreaContainingCell(areas, cell);
                const inDraft = draftCells.some((c) => c.col === col && c.row === row);
                const isHovered = hoveredCell?.col === col && hoveredCell?.row === row;
                const canExtend =
                  draftCells.length > 0 && canAddCellToSelection(draftCells, cell);

                let cellClass =
                  "relative border border-transparent transition-colors cursor-pointer ";
                if (inArea) {
                  cellClass += "border-transparent ";
                } else if (inDraft) {
                  cellClass += "border-2 border-red-600 bg-red-500/25 ";
                } else if (isHovered) {
                  cellClass +=
                    canExtend || draftCells.length === 0
                      ? "bg-red-500/40 "
                      : "bg-red-500/25 ";
                } else {
                  cellClass += "hover:bg-red-500/35 ";
                }

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={Boolean(inArea)}
                    className={`${cellClass}${inArea ? " pointer-events-none" : ""}`}
                    onMouseEnter={() => !inArea && onHoverCell(cell)}
                    onMouseLeave={() => onHoverCell(null)}
                    onClick={() => onCellClick(cell)}
                    aria-label={`Body section column ${col + 1}, band ${row + 1}`}
                  />
                );
              })}
            </div>
          ))}

          {areas.map((area) => (
            <div
              key={area.id}
              className="pointer-events-none absolute border-2 border-red-600 z-10 bg-red-500/10"
              style={placementPercentStyle(area.placement, columnCount)}
            >
              <button
                type="button"
                className="pointer-events-auto absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow border border-red-300 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveArea(area.id);
                }}
                aria-label="Remove image area"
              >
                ×
              </button>
            </div>
          ))}

          {draftPlacement ? (
            <div
              className="pointer-events-none absolute border-2 border-dashed border-red-500 z-[9] bg-red-500/15"
              style={placementPercentStyle(draftPlacement, columnCount)}
            >
              <button
                type="button"
                className="pointer-events-auto absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-red-600 shadow border border-red-300 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearDraft();
                }}
                aria-label="Clear current selection"
              >
                ×
              </button>
            </div>
          ) : null}
        </div>

        <footer className="shrink-0 px-4 py-2.5" aria-hidden>
          <span className="opacity-0">.</span>
        </footer>
      </div>
    </div>
  );
};
