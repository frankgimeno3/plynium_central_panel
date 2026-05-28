"use client";

import React, { CSSProperties, FC } from "react";
import { MagazineChunkEditorPreview } from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/MagazineArticleEditorChunkBody";
import {
  extractFirstImgAlt,
  extractFirstImgSrc,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/magazineChunkMediaHtml";
import { normalizedBodyChunkHtml } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleContentModel";
import {
  chunkFormatIncludesImage,
  chunkHasImage,
  chunkSupportsTextEditing,
  readChunkImageCaption,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleChunkPlainTextEditing";
import type { ArticlePreviewBodyTextStyles } from "./bodyTextStyles";
import { GRID_BOTTOM_ROW_CONTENT_PAD_CLASS } from "./gridBodyLayout";
import { ChunkSelectionCheckbox } from "./ChunkSelectionCheckbox";
import { EditableChunkRichBody } from "./EditableChunkRichBody";
import {
  EditableImageChunkFrame,
  ImageCaptionOverlay,
  ImageChunkActionButtons,
} from "./imageChunkUi";
import { previewFormatForChunk } from "./previewFormatForChunk";
import type { PublicationArticleChunk } from "../types";

export type ArticlePreviewBodyChunkProps = {
  chunk: PublicationArticleChunk;
  chunkIdx: number;
  laneInCell: boolean;
  isBottomGridRow?: boolean;
  editable: boolean;
  useGridBodyLayout: boolean;
  columnCount: number;
  isLeftPage: boolean;
  styles: ArticlePreviewBodyTextStyles;
  chunkSelectionMode: boolean;
  selectedChunkIds?: ReadonlySet<string>;
  onToggleChunkSelection?: (chunkId: string) => void;
  savingChunkIds?: ReadonlySet<string>;
  onChunkTextChange?: (chunkId: string, nextChunkHtml: string) => void;
  onChunkHtmlCommit?: (chunkId: string, nextChunkHtml: string) => void;
  onGridTextOverflowCheck?: (chunkId: string, editorEl: HTMLDivElement) => void;
  onChunkImageUpdate?: (chunkId: string) => void;
  onChunkCaptionUpdate?: (chunkId: string) => void;
};

export const ArticlePreviewBodyChunk: FC<ArticlePreviewBodyChunkProps> = ({
  chunk,
  chunkIdx,
  laneInCell,
  isBottomGridRow = false,
  editable,
  useGridBodyLayout,
  columnCount,
  isLeftPage,
  styles,
  chunkSelectionMode,
  selectedChunkIds,
  onToggleChunkSelection,
  savingChunkIds,
  onChunkTextChange,
  onChunkHtmlCommit,
  onGridTextOverflowCheck,
  onChunkImageUpdate,
  onChunkCaptionUpdate,
}) => {
  const chunkHtml = normalizedBodyChunkHtml(chunk);
  if (!chunkHtml.trim() && !editable) return null;

  const fmt = previewFormatForChunk({ ...chunk, chunk_html: chunkHtml });
  const isMediaBlock =
    fmt === "only_image" || fmt === "text_image" || fmt === "image_text";
  const chunkId = chunk.publication_article_chunk_id;
  const isSaving = savingChunkIds?.has(chunkId) ?? false;
  const rawFormat = chunk.publication_article_chunk_format;
  const canEditText = chunkSupportsTextEditing(rawFormat);
  const hasImg = chunkHasImage(chunk.chunk_html, rawFormat);
  const inGrid = useGridBodyLayout && laneInCell;
  const bottomRowPadClass =
    inGrid && isBottomGridRow ? GRID_BOTTOM_ROW_CONTENT_PAD_CLASS : "";

  const isChunkSelected =
    chunkSelectionMode && !!selectedChunkIds && selectedChunkIds.has(chunkId);
  const selectionOverlay =
    chunkSelectionMode && onToggleChunkSelection ? (
      <ChunkSelectionCheckbox
        checked={isChunkSelected}
        onToggle={() => onToggleChunkSelection(chunkId)}
      />
    ) : null;
  const selectionRingClass = isChunkSelected
    ? "outline outline-2 outline-red-400"
    : "";

  let chunkNode: React.ReactNode;
  if (editable && canEditText && !isMediaBlock && onChunkTextChange) {
    chunkNode = (
      <div
        className={
          inGrid
            ? `${styles.gridTextShellClass} ${bottomRowPadClass} ${selectionRingClass}`
            : `${styles.flowTextShellClass} ${selectionRingClass}`
        }
        data-pmc-editable-text-chunk={chunkId}
      >
        <EditableChunkRichBody
          chunkId={chunkId}
          chunkHtml={chunk.chunk_html}
          format={rawFormat}
          isLeftPage={isLeftPage}
          saving={isSaving}
          fillContainer={inGrid}
          onChunkHtmlChange={onChunkTextChange}
          onChunkHtmlCommit={onChunkHtmlCommit}
          onGridTextOverflowCheck={inGrid ? onGridTextOverflowCheck : undefined}
          placeholder="Body text…"
          ariaLabel={`Chunk ${chunkId} text`}
          className={inGrid ? styles.gridTextareaClass : styles.flowTextareaClass}
        />
        {selectionOverlay}
      </div>
    );
  } else if (isMediaBlock && editable) {
    const imgSrc = extractFirstImgSrc(chunk.chunk_html);
    const imgAlt = extractFirstImgAlt(chunk.chunk_html);
    const caption = readChunkImageCaption(chunk);
    const showImageActions =
      !chunkSelectionMode &&
      chunkFormatIncludesImage(rawFormat) &&
      !!onChunkImageUpdate &&
      !!onChunkCaptionUpdate;
    const showTextarea =
      canEditText &&
      !!onChunkTextChange &&
      (fmt === "text_image" || fmt === "image_text");
    chunkNode = (
      <div className={`${styles.flowMediaShellClass} ${selectionRingClass}`}>
        <EditableImageChunkFrame
          imgSrc={imgSrc}
          imgAlt={imgAlt || ""}
          caption={caption}
          showImageActions={showImageActions}
          onUpdateImage={() => onChunkImageUpdate!(chunkId)}
          onUpdateCaption={() => onChunkCaptionUpdate!(chunkId)}
          imageButtonLabel={imgSrc ? "Update image" : "Add image"}
        />
        {showTextarea ? (
          <EditableChunkRichBody
            chunkId={chunkId}
            chunkHtml={chunk.chunk_html}
            format={rawFormat}
            isLeftPage={isLeftPage}
            saving={isSaving}
            onChunkHtmlChange={onChunkTextChange}
            onChunkHtmlCommit={onChunkHtmlCommit}
            placeholder="Body text…"
            ariaLabel={`Chunk ${chunkId} text`}
            className={styles.flowTextareaClass}
          />
        ) : null}
        {selectionOverlay}
      </div>
    );
  } else if (isMediaBlock) {
    const mediaCaption = readChunkImageCaption(chunk);
    chunkNode = (
      <div className={`${styles.flowMediaShellClass} ${selectionRingClass} relative`}>
        <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
        <ImageCaptionOverlay caption={mediaCaption} />
        {editable &&
        hasImg &&
        chunkFormatIncludesImage(rawFormat) &&
        onChunkImageUpdate &&
        onChunkCaptionUpdate &&
        !chunkSelectionMode ? (
          <ImageChunkActionButtons
            onUpdateImage={() => onChunkImageUpdate(chunkId)}
            onUpdateCaption={() => onChunkCaptionUpdate(chunkId)}
          />
        ) : null}
        {selectionOverlay}
      </div>
    );
  } else {
    chunkNode = (
      <div
        className={
          inGrid
            ? `${styles.gridTextShellClass} ${bottomRowPadClass} ${selectionRingClass}`
            : `${styles.flowTextShellClass} ${selectionRingClass}`
        }
      >
        {inGrid ? (
          <div className={styles.gridTextPreviewClass}>
            <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
          </div>
        ) : (
          <div className={styles.flowTextPreviewPadClass}>
            <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
          </div>
        )}
        {selectionOverlay}
      </div>
    );
  }

  if (laneInCell) return chunkNode;

  const breakBeforeColumn = chunkIdx >= 1 && chunkIdx < columnCount;
  if (breakBeforeColumn) {
    return (
      <div
        className="break-inside-avoid"
        style={{ breakBefore: "column" } as CSSProperties}
      >
        {chunkNode}
      </div>
    );
  }
  return chunkNode;
};
