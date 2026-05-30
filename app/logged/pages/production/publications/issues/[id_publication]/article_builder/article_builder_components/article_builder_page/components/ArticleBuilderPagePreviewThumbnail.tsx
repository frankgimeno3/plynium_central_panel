"use client";

import React, { FC } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk as PreviewPublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type {
  GridCell,
  ImageAreaSelection,
} from "../../article_image_manager/articleImagePlacement";
import { PAGE_THUMB_ASPECT } from "../constants";
import type { PublicationArticleChunk } from "../types";

type ArticleBuilderPagePreviewThumbnailProps = {
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  slotKey?: string | null;
  pageFormat: MagazinePageLayout;
  articleFlowPages: ReturnType<typeof buildArticleFlowPagesFromPublicationSlots>;
  currentSlotContentId: number | null;
  articleTitleHtml?: string | null;
  articleSubtitleHtml?: string | null;
  articleBox?: {
    company_name: string;
    company_direction?: string | null;
    company_city?: string | null;
    company_email?: string | null;
    company_phone?: string | null;
    company_web?: string | null;
  } | null;
  onRemoveArticleBox?: () => void;
  /**
   * When `true`, the underlying preview becomes interactive: body text chunks
   * render as autosizing textareas and image chunks expose an "Update image"
   * button. Pointer-events are enabled on the scaled wrapper accordingly.
   */
  editable?: boolean;
  onChunkTextChange?: (chunkId: string, nextChunkHtml: string) => void;
  onChunkHtmlCommit?: (chunkId: string, nextChunkHtml: string) => void;
  onGridTextOverflowCheck?: (chunkId: string, editorEl: HTMLDivElement) => void;
  onChunkImageUpdate?: (chunkId: string) => void;
  onChunkCaptionUpdate?: (chunkId: string) => void;
  savingChunkIds?: ReadonlySet<string>;
  /** Bulk-delete chunk-selection mode forwarded to the preview. */
  chunkSelectionMode?: boolean;
  selectedChunkIds?: ReadonlySet<string>;
  onToggleChunkSelection?: (chunkId: string) => void;
  /** Floating-image area selection mode forwarded to the preview. */
  imageAreaSelectionMode?: boolean;
  imageAreas?: ImageAreaSelection[];
  onImageAreaCellClick?: (cell: GridCell) => void;
  onImageAreaRemove?: (areaId: string) => void;
  onOverlayImageDelete?: (chunkId: string) => void;
};

export const ArticleBuilderPagePreviewThumbnail: FC<ArticleBuilderPagePreviewThumbnailProps> = ({
  chunks,
  pageIndex,
  isLeftPage,
  publicationPage,
  slotKey,
  pageFormat,
  articleFlowPages,
  currentSlotContentId,
  articleTitleHtml,
  articleSubtitleHtml,
  articleBox = null,
  onRemoveArticleBox,
  editable = false,
  onChunkTextChange,
  onChunkHtmlCommit,
  onGridTextOverflowCheck,
  onChunkImageUpdate,
  onChunkCaptionUpdate,
  savingChunkIds,
  chunkSelectionMode = false,
  selectedChunkIds,
  onToggleChunkSelection,
  imageAreaSelectionMode = false,
  imageAreas,
  onImageAreaCellClick,
  onImageAreaRemove,
  onOverlayImageDelete,
}) => (
  <div
    data-article-editor-preview={String(currentSlotContentId ?? "")}
    className="relative w-full overflow-hidden border border-gray-200 bg-gray-50 shadow-inner"
    style={{ aspectRatio: PAGE_THUMB_ASPECT }}
  >
    <div
      className={`absolute left-0 top-0 origin-top-left scale-[0.38] w-[263%] ${
        editable ? "pointer-events-auto " : "pointer-events-none "
      }`}
    >
      <ArticleSubpagePagePreview
        hideHeading
        fillContainer
        chunks={chunks as PreviewPublicationArticleChunk[]}
        pageIndex={pageIndex}
        isLeftPage={isLeftPage}
        publicationPage={publicationPage}
        slotKey={slotKey}
        pageFormat={pageFormat}
        articleFlowPages={articleFlowPages}
        currentSlotContentId={currentSlotContentId}
        articleTitleHtml={articleTitleHtml}
        articleSubtitleHtml={articleSubtitleHtml}
        articleBox={articleBox}
        onRemoveArticleBox={onRemoveArticleBox}
        editable={editable}
        onChunkTextChange={onChunkTextChange}
        onChunkHtmlCommit={onChunkHtmlCommit}
        onGridTextOverflowCheck={onGridTextOverflowCheck}
        onChunkImageUpdate={onChunkImageUpdate}
        onChunkCaptionUpdate={onChunkCaptionUpdate}
        savingChunkIds={savingChunkIds}
        chunkSelectionMode={chunkSelectionMode}
        selectedChunkIds={selectedChunkIds}
        onToggleChunkSelection={onToggleChunkSelection}
        imageAreaSelectionMode={imageAreaSelectionMode}
        imageAreas={imageAreas}
        onImageAreaCellClick={onImageAreaCellClick}
        onImageAreaRemove={onImageAreaRemove}
        onOverlayImageDelete={onOverlayImageDelete}
      />
    </div>
  </div>
);
