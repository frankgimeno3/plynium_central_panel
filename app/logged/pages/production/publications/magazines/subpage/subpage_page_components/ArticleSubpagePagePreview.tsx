"use client";

import React, { FC } from "react";
import { PAGE_ASPECT } from "./article_subpage_preview/constants";
import { ArticlePreviewPageHeader } from "./article_subpage_preview/ArticlePreviewPageHeader";
import { ArticlePreviewPageBody } from "./article_subpage_preview/ArticlePreviewPageBody";
import { ArticlePreviewPageFooter } from "./article_subpage_preview/ArticlePreviewPageFooter";
import { useArticlePreviewPageModel } from "./article_subpage_preview/useArticlePreviewPageModel";
import type { ArticleSubpagePagePreviewProps } from "./article_subpage_preview/types";

export type { ArticleSubpagePagePreviewProps } from "./article_subpage_preview/types";

export const ArticleSubpagePagePreview: FC<ArticleSubpagePagePreviewProps> = (props) => {
  const {
    hideHeading = false,
    fillContainer = false,
    isLeftPage,
    articleBox = null,
    onRemoveArticleBox,
    chunkSelectionMode = false,
    selectedChunkIds,
    onToggleChunkSelection,
    imageAreaSelectionMode = false,
    imageAreas,
    onImageAreaCellClick,
    onImageAreaRemove,
    onOverlayImageDelete,
    onChunkTextChange,
    onChunkHtmlCommit,
    onGridTextOverflowCheck,
    onChunkImageUpdate,
    onChunkCaptionUpdate,
    savingChunkIds,
  } = props;

  const model = useArticlePreviewPageModel(props);

  const pageCard = (
    <div
      data-article-preview-page-card=""
      className={`flex w-full flex-col overflow-hidden rounded-sm border border-gray-300 bg-white shadow-md ${
        fillContainer ? "" : "max-w-[min(100%,28rem)]"
      }`}
      style={{ aspectRatio: PAGE_ASPECT }}
    >
      <ArticlePreviewPageHeader
        showHeadline={model.showHeadline}
        showSubtitle={model.showSubtitle}
        headlineHtml={model.headlineHtml}
        subtitleHtml={model.subtitleHtml}
        styles={model.textStyles}
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-10 pb-12 pt-8">
        <ArticlePreviewPageBody
          sorted={model.sorted}
          editable={model.editable}
          columnCount={model.columnCount}
          useGridBodyLayout={model.useGridBodyLayout}
          bodyColumnStyle={model.bodyColumnStyle}
          bodyFlowChunks={model.bodyFlowChunks}
          gridBodyCells={model.gridBodyCells}
          textStyles={model.textStyles}
          isLeftPage={isLeftPage}
          overlayChunks={model.overlayChunks}
          overlayBlockedCellKeys={model.overlayBlockedCellKeys}
          articleBox={articleBox}
          onRemoveArticleBox={onRemoveArticleBox}
          imageAreaSelectionMode={imageAreaSelectionMode}
          imageAreas={imageAreas}
          chunkSelectionMode={chunkSelectionMode}
          selectedChunkIds={selectedChunkIds}
          savingChunkIds={savingChunkIds}
          onImageAreaCellClick={onImageAreaCellClick}
          onImageAreaRemove={onImageAreaRemove}
          onOverlayImageDelete={onOverlayImageDelete}
          onChunkTextChange={onChunkTextChange}
          onChunkHtmlCommit={onChunkHtmlCommit}
          onGridTextOverflowCheck={onGridTextOverflowCheck}
          onChunkImageUpdate={onChunkImageUpdate}
          onChunkCaptionUpdate={onChunkCaptionUpdate}
          onToggleChunkSelection={onToggleChunkSelection}
        />
      </div>

      <ArticlePreviewPageFooter isLeftPage={isLeftPage} footerNumber={model.footerNumber} />
    </div>
  );

  if (hideHeading) {
    if (fillContainer) return pageCard;
    return <div className="flex w-full flex-col items-center">{pageCard}</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h2 className="text-sm font-semibold text-gray-800">Page preview</h2>
      {pageCard}
    </div>
  );
};
