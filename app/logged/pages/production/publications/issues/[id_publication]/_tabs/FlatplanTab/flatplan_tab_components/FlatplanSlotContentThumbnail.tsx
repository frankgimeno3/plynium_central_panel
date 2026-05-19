"use client";

import React, { FC } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk as PreviewPublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import {
  buildArticleFlowPagesFromPublicationSlots,
  type FlowPublicationArticleChunk,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { normalizeMagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";

type FlatplanPreviewChunkPayload = {
  publication_article_chunk_id: string;
  publication_article_chunk_format: string;
  chunk_html: string;
  chunk_position: number;
  chunk_page_weight?: number;
};

export type FlatplanSlotContentThumbnailProps = {
  publicationSlotId: number;
  publicationPage: number;
  articlePageIndex: number;
  magazinePageLayout?: string | null;
  chunks: FlatplanPreviewChunkPayload[];
  previewExpanded: boolean;
  className?: string;
};

/** Low-resolution magazine page preview (background layer inside a flatplan tile). */
export const FlatplanSlotContentThumbnail: FC<FlatplanSlotContentThumbnailProps> = ({
  publicationSlotId,
  publicationPage,
  articlePageIndex,
  magazinePageLayout,
  chunks,
  previewExpanded,
  className = "absolute inset-1 overflow-hidden rounded-md",
}) => {
  if (chunks.length === 0) return null;

  const pageFormat = normalizeMagazinePageLayout(magazinePageLayout);
  const isLeftPage = articlePageIndex > 0 && articlePageIndex % 2 === 0;
  const pubPage =
    publicationPage != null && Number.isFinite(Number(publicationPage))
      ? Math.round(Number(publicationPage))
      : null;

  const flowChunks = chunks as FlowPublicationArticleChunk[];
  const articleFlowPages = buildArticleFlowPagesFromPublicationSlots(
    [{ publication_slot_id: publicationSlotId }],
    flowChunks
  );

  const scaleClass = previewExpanded ? "scale-[0.22]" : "scale-[0.17]";
  const widthClass = previewExpanded ? "w-[455%]" : "w-[588%]";

  return (
    <div className={className} aria-hidden>
      <div
        className={`pointer-events-none absolute left-0 top-0 origin-top-left ${scaleClass} ${widthClass}`}
      >
        <ArticleSubpagePagePreview
          hideHeading
          chunks={flowChunks as PreviewPublicationArticleChunk[]}
          pageIndex={articlePageIndex}
          isLeftPage={isLeftPage}
          publicationPage={pubPage}
          pageFormat={pageFormat}
          articleFlowPages={articleFlowPages}
          currentSlotContentId={publicationSlotId}
        />
      </div>
    </div>
  );
};
