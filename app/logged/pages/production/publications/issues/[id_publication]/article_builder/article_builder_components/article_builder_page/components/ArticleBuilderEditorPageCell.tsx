"use client";

import React from "react";

import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { GridCell, ImageAreaSelection } from "../../article_image_manager/articleImagePlacement";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { PublicationArticleChunk } from "../types";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import { ArticleBuilderPagePreviewThumbnail } from "./ArticleBuilderPagePreviewThumbnail";
import { dedupeChunksForDisplay, dedupeGridTextChunksBySlotAndArea } from "../chunkUtils";
import type { PageCell } from "./articleBuilderSpreadRows";

export function ArticleBuilderEditorPageCell({
  cell,
  total,
  chunks,
  articleHeadingHtml,
  magazinePageLayout,
  articleFlowPages,
  articleBox,
  onRemoveArticleBox,
  savingChunkIds,
  deletingPage,
  deletingChunks,
  chunkSelectionActive,
  selectedChunkIds,
  addImagesSlotId,
  imageAreas,
  savingOverlays,
  onDeletePage,
  onEnterChunkSelectionMode,
  onExitChunkSelectionMode,
  onConfirmDeleteSelectedChunks,
  onToggleChunkSelection,
  onAddImagesClick,
  onCancelImageAreaSelection,
  onGridTextOverflowCheck,
  onChunkTextChange,
  onChunkHtmlCommit,
  onChunkImageUpdate,
  onChunkCaptionUpdate,
  onImageAreaCellClick,
  onImageAreaRemove,
  onOverlayImageDeleteRequest,
}: {
  cell: Extract<PageCell, { kind: "page" }>;
  total: number;
  chunks: PublicationArticleChunk[];
  articleHeadingHtml: { title: string | null; subtitle: string | null };
  magazinePageLayout: MagazinePageLayout;
  articleFlowPages: ReturnType<typeof buildArticleFlowPagesFromPublicationSlots>;
  articleBox?: {
    company_name: string;
    company_direction?: string | null;
    company_city?: string | null;
    company_email?: string | null;
    company_phone?: string | null;
    company_web?: string | null;
  } | null;
  onRemoveArticleBox?: () => void;
  savingChunkIds: ReadonlySet<string>;
  deletingPage: boolean;
  deletingChunks: boolean;
  chunkSelectionActive: boolean;
  selectedChunkIds: ReadonlySet<string>;
  addImagesSlotId: number | null;
  imageAreas: ImageAreaSelection[];
  savingOverlays: boolean;
  onDeletePage: (slotId: number) => void;
  onEnterChunkSelectionMode: () => void;
  onExitChunkSelectionMode: () => void;
  onConfirmDeleteSelectedChunks: () => void;
  onToggleChunkSelection: (chunkId: string) => void;
  onAddImagesClick: (slotId: number) => void;
  onCancelImageAreaSelection: () => void;
  onGridTextOverflowCheck: (chunkId: string, editorEl: HTMLDivElement) => void;
  onChunkTextChange: (chunkId: string, html: string) => void;
  onChunkHtmlCommit: (chunkId: string, html: string) => void;
  onChunkImageUpdate: (chunkId: string) => void;
  onChunkCaptionUpdate: (chunkId: string) => void;
  onImageAreaCellClick: (gridCell: GridCell) => void;
  onImageAreaRemove: (chunkId: string) => void;
  onOverlayImageDeleteRequest: (chunkId: string) => void;
}) {
  const pageChunks = React.useMemo(
    () =>
      dedupeChunksForDisplay(
        dedupeGridTextChunksBySlotAndArea(
          chunks.filter((ch) => chunkPublicationSlotId(ch) === cell.slotId)
        )
      ),
    [cell.slotId, chunks]
  );

  const canDeletePage = total > 1;
  const selectedCount = chunkSelectionActive ? selectedChunkIds.size : 0;
  const deleteChunksLabel = chunkSelectionActive
    ? selectedCount === 0
      ? "Select chunks to delete"
      : selectedCount === 1
        ? "Delete chunk"
        : `Delete ${selectedCount} chunks`
    : "Delete chunks";

  const isAddImagesActiveForThisPage = addImagesSlotId === cell.slotId;
  const addImagesAreaCount = isAddImagesActiveForThisPage ? imageAreas.length : 0;
  const addImagesLabel = !isAddImagesActiveForThisPage
    ? "Add/delete images"
    : addImagesAreaCount === 0
      ? "Select area to add image"
      : `Add (${addImagesAreaCount}) image${addImagesAreaCount === 1 ? "" : "s"}`;

  const handleDeleteChunksClick = () => {
    if (deletingChunks) return;
    if (!chunkSelectionActive) {
      onEnterChunkSelectionMode();
      return;
    }
    if (selectedCount === 0) {
      onExitChunkSelectionMode();
      return;
    }
    onConfirmDeleteSelectedChunks();
  };

  const handleAddImagesClickForThisPage = () => {
    if (savingOverlays) return;
    if (chunkSelectionActive) onExitChunkSelectionMode();
    onAddImagesClick(cell.slotId);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-600">
          page {cell.articleIdx}/{total}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeletePage(cell.slotId);
          }}
          disabled={
            deletingPage || !canDeletePage || chunkSelectionActive || deletingChunks
          }
          title={
            canDeletePage
              ? "Delete this page (and all its chunks)"
              : "Cannot delete the last remaining page of an article"
          }
          className="inline-flex items-center rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete full page
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteChunksClick();
          }}
          disabled={deletingChunks || isAddImagesActiveForThisPage}
          title={
            chunkSelectionActive
              ? selectedCount === 0
                ? "Click any chunk's checkbox (on this page or others) to select it. Click here again to cancel."
                : "Delete the selected chunks (and any mediateca images they reference)."
              : "Pick chunks across one or more pages to delete them."
          }
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            chunkSelectionActive && selectedCount > 0
              ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
              : "border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
          }`}
        >
          {deletingChunks ? "Deleting…" : deleteChunksLabel}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddImagesClickForThisPage();
          }}
          disabled={savingOverlays || chunkSelectionActive}
          title={
            isAddImagesActiveForThisPage
              ? addImagesAreaCount === 0
                ? "Click any red-bordered cell on this page to select an image area. Click here again to leave this mode."
                : "Open the image picker for the selected areas."
              : "Add floating images, or click the × on an existing image to delete it."
          }
          className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
            isAddImagesActiveForThisPage && addImagesAreaCount > 0
              ? "border-blue-500 bg-blue-500 text-white hover:bg-blue-600"
              : "border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          {savingOverlays && isAddImagesActiveForThisPage ? "Applying…" : addImagesLabel}
        </button>
        {chunkSelectionActive && selectedCount > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onExitChunkSelectionMode();
            }}
            disabled={deletingChunks}
            className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
        {isAddImagesActiveForThisPage ? (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCancelImageAreaSelection();
            }}
            disabled={savingOverlays}
            className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <ArticleBuilderPagePreviewThumbnail
        chunks={pageChunks}
        pageIndex={cell.articleIdx}
        isLeftPage={cell.isLeftPage}
        publicationPage={cell.magazinePage}
        pageFormat={magazinePageLayout}
        articleFlowPages={articleFlowPages}
        currentSlotContentId={cell.slotId}
        articleTitleHtml={articleHeadingHtml.title}
        articleSubtitleHtml={articleHeadingHtml.subtitle}
        articleBox={cell.articleIdx === total ? articleBox ?? null : null}
        onRemoveArticleBox={
          cell.articleIdx === total && articleBox ? onRemoveArticleBox : undefined
        }
        editable
        onChunkTextChange={onChunkTextChange}
        onChunkHtmlCommit={onChunkHtmlCommit}
        onGridTextOverflowCheck={onGridTextOverflowCheck}
        onChunkImageUpdate={onChunkImageUpdate}
        onChunkCaptionUpdate={onChunkCaptionUpdate}
        savingChunkIds={savingChunkIds}
        chunkSelectionMode={chunkSelectionActive}
        selectedChunkIds={chunkSelectionActive ? selectedChunkIds : undefined}
        onToggleChunkSelection={chunkSelectionActive ? onToggleChunkSelection : undefined}
        imageAreaSelectionMode={isAddImagesActiveForThisPage}
        imageAreas={isAddImagesActiveForThisPage ? imageAreas : undefined}
        onImageAreaCellClick={
          isAddImagesActiveForThisPage ? (gridCell) => onImageAreaCellClick(gridCell) : undefined
        }
        onImageAreaRemove={
          isAddImagesActiveForThisPage ? (chunkId) => onImageAreaRemove(chunkId) : undefined
        }
        onOverlayImageDelete={
          isAddImagesActiveForThisPage
            ? (chunkId) => onOverlayImageDeleteRequest(chunkId)
            : undefined
        }
      />
    </div>
  );
}

