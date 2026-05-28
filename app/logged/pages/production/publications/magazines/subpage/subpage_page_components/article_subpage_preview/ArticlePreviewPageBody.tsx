"use client";

import React, { FC } from "react";
import type { CSSProperties } from "react";
import { isBottomGridRow } from "./gridBodyLayout";
import { placementPercentStyleForPreview } from "./placementPercentStyle";
import type { GridBodyAreaCell } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleAreaCodes";
import type { GridCell, ImageAreaSelection } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import {
  FLOW_BODY_COLUMN_CLASS,
  GRID_BODY_CONTAINER_CLASS,
  type ArticlePreviewBodyTextStyles,
} from "./bodyTextStyles";
import { MAGAZINE_BODY_INSET_CLASS } from "./constants";
import { ArticlePreviewBodyChunk, type ArticlePreviewBodyChunkProps } from "./ArticlePreviewBodyChunk";
import { ArticlePreviewCompanyBox } from "./ArticlePreviewCompanyBox";
import { ArticlePreviewOverlayImages } from "./ArticlePreviewOverlayImages";
import { ImageAreaSelectionLayer } from "./ImageAreaSelectionLayer";
import type { PublicationArticleChunk } from "../types";

type ChunkCallbacks = Pick<
  ArticlePreviewBodyChunkProps,
  | "onChunkTextChange"
  | "onChunkHtmlCommit"
  | "onGridTextOverflowCheck"
  | "onChunkImageUpdate"
  | "onChunkCaptionUpdate"
  | "onToggleChunkSelection"
>;

export const ArticlePreviewPageBody: FC<{
  sorted: PublicationArticleChunk[];
  editable: boolean;
  columnCount: number;
  useGridBodyLayout: boolean;
  bodyColumnStyle: CSSProperties;
  bodyFlowChunks: PublicationArticleChunk[];
  gridBodyCells: GridBodyAreaCell<PublicationArticleChunk>[] | null;
  textStyles: ArticlePreviewBodyTextStyles;
  isLeftPage: boolean;
  overlayChunks: PublicationArticleChunk[];
  overlayBlockedCellKeys: ReadonlySet<string>;
  articleBox?: {
    company_name: string;
    company_direction?: string | null;
    company_city?: string | null;
    company_email?: string | null;
    company_phone?: string | null;
    company_web?: string | null;
  } | null;
  onRemoveArticleBox?: () => void;
  imageAreaSelectionMode: boolean;
  imageAreas?: ImageAreaSelection[];
  chunkSelectionMode: boolean;
  selectedChunkIds?: ReadonlySet<string>;
  savingChunkIds?: ReadonlySet<string>;
  onImageAreaCellClick?: (cell: GridCell) => void;
  onImageAreaRemove?: (areaId: string) => void;
  onOverlayImageDelete?: (chunkId: string) => void;
} & ChunkCallbacks> = ({
  sorted,
  editable,
  columnCount,
  useGridBodyLayout,
  bodyColumnStyle,
  bodyFlowChunks,
  gridBodyCells,
  textStyles,
  isLeftPage,
  overlayChunks,
  overlayBlockedCellKeys,
  articleBox = null,
  onRemoveArticleBox,
  imageAreaSelectionMode,
  imageAreas,
  chunkSelectionMode,
  selectedChunkIds,
  savingChunkIds,
  onImageAreaCellClick,
  onImageAreaRemove,
  onOverlayImageDelete,
  ...chunkCallbacks
}) => {
  const chunkProps = {
    editable,
    useGridBodyLayout,
    columnCount,
    isLeftPage,
    styles: textStyles,
    chunkSelectionMode,
    selectedChunkIds,
    savingChunkIds,
    ...chunkCallbacks,
  };

  if (sorted.length === 0 && !editable) {
    return (
      <div className="flex h-full min-h-[6rem] items-center justify-center px-4 text-center text-3xl text-gray-400">
        No chunks on this page yet.
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-0 flex-1 overflow-hidden border-t border-gray-200 ${MAGAZINE_BODY_INSET_CLASS}`}
    >
      {/* Inner positioning box: overlays + grid are constrained by the padding above. */}
      <div className="relative h-full w-full min-h-0">
        {columnCount >= 2 ? (
          <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
            {Array.from({ length: columnCount - 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-y-0 w-px bg-gray-200"
                style={{ left: `${((i + 1) * 100) / columnCount}%` }}
              />
            ))}
          </div>
        ) : null}

        <div
          className={useGridBodyLayout ? GRID_BODY_CONTAINER_CLASS : FLOW_BODY_COLUMN_CLASS}
          style={useGridBodyLayout ? undefined : bodyColumnStyle}
          data-magazine-preview-body=""
          data-magazine-preview-columns={columnCount}
        >
          {!((gridBodyCells?.length ?? 0) > 0 || bodyFlowChunks.length > 0) ? (
            editable ? null : <p className="text-3xl text-gray-400 italic">—</p>
          ) : gridBodyCells ? (
            gridBodyCells.map((cell) => {
              const box = placementPercentStyleForPreview(cell.placement, columnCount);
              const laneCount = cell.chunks.length;
              const bottomGridRow = isBottomGridRow(cell.placement);
              if (laneCount === 0) return null;
              return (
                <div
                  key={cell.areaKey}
                  className="pointer-events-auto absolute flex min-h-0 flex-row overflow-hidden text-3xl leading-snug"
                  style={box}
                  data-pmc-grid-row-end={cell.placement.rowEnd}
                >
                  {cell.chunks.map((chunk, laneIdx) => {
                    const chunkId = chunk.publication_article_chunk_id;
                    const laneNode = (
                      <ArticlePreviewBodyChunk
                        chunk={chunk}
                        chunkIdx={laneIdx}
                        laneInCell
                        isBottomGridRow={bottomGridRow}
                        {...chunkProps}
                      />
                    );
                    if (!laneNode) return null;
                    return (
                      <div
                        key={chunkId}
                        className="flex min-h-0 min-w-0 flex-1 flex-col border-r border-dashed border-gray-200 last:border-r-0"
                        style={
                          laneCount > 1
                            ? { width: `${100 / laneCount}%`, flex: "none" }
                            : undefined
                        }
                      >
                        {laneNode}
                      </div>
                    );
                  })}
                </div>
              );
            })
          ) : (
            bodyFlowChunks.map((chunk, chunkIdx) => {
              const chunkId = chunk.publication_article_chunk_id;
              const node = (
                <ArticlePreviewBodyChunk
                  chunk={chunk}
                  chunkIdx={chunkIdx}
                  laneInCell={false}
                  {...chunkProps}
                />
              );
              if (!node) return null;
              return <React.Fragment key={chunkId}>{node}</React.Fragment>;
            })
          )}
        </div>

        <ArticlePreviewOverlayImages
          overlayChunks={overlayChunks}
          columnCount={columnCount}
          imageAreaSelectionMode={imageAreaSelectionMode}
          editable={editable}
          chunkSelectionMode={chunkSelectionMode}
          onChunkImageUpdate={chunkCallbacks.onChunkImageUpdate}
          onChunkCaptionUpdate={chunkCallbacks.onChunkCaptionUpdate}
          onOverlayImageDelete={onOverlayImageDelete}
        />

        {articleBox?.company_name ? (
          <div
            className="absolute z-30 p-3"
            style={placementPercentStyleForPreview(
              {
                colStart: Math.max(0, columnCount - 1),
                colEnd: Math.max(0, columnCount - 1),
                rowStart: 3,
                rowEnd: 3,
              },
              columnCount
            )}
          >
            <ArticlePreviewCompanyBox
              articleBox={articleBox}
              onRemoveArticleBox={onRemoveArticleBox}
            />
          </div>
        ) : null}

        {imageAreaSelectionMode ? (
          <ImageAreaSelectionLayer
            columnCount={columnCount}
            imageAreas={imageAreas ?? []}
            overlayBlockedCellKeys={overlayBlockedCellKeys}
            onCellClick={onImageAreaCellClick}
            onRemoveArea={onImageAreaRemove}
          />
        ) : null}
      </div>
    </div>
  );
};
