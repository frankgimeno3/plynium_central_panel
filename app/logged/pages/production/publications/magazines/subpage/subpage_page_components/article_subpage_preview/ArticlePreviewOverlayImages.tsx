"use client";

import React, { FC } from "react";
import {
  areaCodesToPlacement,
  normalizeAreaCodes,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleAreaCodes";
import {
  overlayImageSrc,
  parseOverlayPlacement,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import { readChunkImageCaption } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleChunkPlainTextEditing";
import {
  ImageCaptionOverlay,
  ImageChunkActionButtons,
} from "./imageChunkUi";
import {
  GRID_BODY_CONTAINER_PAD_CLASS,
  GRID_OVERLAY_IMAGE_PAD_CLASS,
} from "./gridBodyLayout";
import { placementPercentStyleForPreview } from "./placementPercentStyle";
import type { PublicationArticleChunk } from "../types";

export const ArticlePreviewOverlayImages: FC<{
  overlayChunks: PublicationArticleChunk[];
  columnCount: number;
  imageAreaSelectionMode: boolean;
  editable: boolean;
  chunkSelectionMode: boolean;
  onChunkImageUpdate?: (chunkId: string) => void;
  onChunkCaptionUpdate?: (chunkId: string) => void;
  onOverlayImageDelete?: (chunkId: string) => void;
}> = ({
  overlayChunks,
  columnCount,
  imageAreaSelectionMode,
  editable,
  chunkSelectionMode,
  onChunkImageUpdate,
  onChunkCaptionUpdate,
  onOverlayImageDelete,
}) => {
  if (overlayChunks.length === 0) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 ${GRID_BODY_CONTAINER_PAD_CLASS} ${
        imageAreaSelectionMode ? "z-40" : "z-20"
      }`}
    >
      {overlayChunks.map((chunk) => {
        const areaCodes = normalizeAreaCodes(
          (chunk as { chunk_area_array?: unknown }).chunk_area_array
        );
        const placement =
          areaCodes.length > 0
            ? areaCodesToPlacement(areaCodes, columnCount)
            : parseOverlayPlacement(chunk.chunk_html);
        const src = overlayImageSrc(chunk.chunk_html);
        if (!placement || !src) return null;
        const box = placementPercentStyleForPreview(placement, columnCount);
        const chunkId = chunk.publication_article_chunk_id;
        const overlayCaption = readChunkImageCaption(chunk);
        const showOverlayImageActions =
          editable &&
          onChunkImageUpdate &&
          onChunkCaptionUpdate &&
          !chunkSelectionMode;

        return (
          <div
            key={chunkId}
            className={`absolute box-border flex min-h-0 flex-col overflow-hidden ${GRID_OVERLAY_IMAGE_PAD_CLASS} ${
              imageAreaSelectionMode ? "pointer-events-auto" : ""
            }`}
            style={box}
          >
            <div className="relative min-h-0 w-full flex-1 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <ImageCaptionOverlay caption={overlayCaption} />
              {imageAreaSelectionMode && onOverlayImageDelete ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOverlayImageDelete(chunkId);
                  }}
                  aria-label="Delete this image"
                  title="Delete this image"
                  className="pointer-events-auto absolute right-2 top-2 z-50 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-700"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-5 w-5">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ) : showOverlayImageActions ? (
                <ImageChunkActionButtons
                  onUpdateImage={() => onChunkImageUpdate!(chunkId)}
                  onUpdateCaption={() => onChunkCaptionUpdate!(chunkId)}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
