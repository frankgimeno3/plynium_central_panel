"use client";

import React, { FC } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk as PreviewPublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import { PAGE_THUMB_ASPECT } from "../constants";
import type { PublicationArticleChunk } from "../types";

type ArticleBuilderPagePreviewThumbnailProps = {
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  pageFormat: MagazinePageLayout;
  articleFlowPages: ReturnType<typeof buildArticleFlowPagesFromPublicationSlots>;
  currentSlotContentId: number | null;
};

export const ArticleBuilderPagePreviewThumbnail: FC<ArticleBuilderPagePreviewThumbnailProps> = ({
  chunks,
  pageIndex,
  isLeftPage,
  publicationPage,
  pageFormat,
  articleFlowPages,
  currentSlotContentId,
}) => (
  <div
    className="relative w-full overflow-hidden border border-gray-200 bg-gray-50 shadow-inner"
    style={{ aspectRatio: PAGE_THUMB_ASPECT }}
  >
    <div className="pointer-events-none absolute left-0 top-0 origin-top-left scale-[0.38] w-[263%]">
      <ArticleSubpagePagePreview
        hideHeading
        chunks={chunks as PreviewPublicationArticleChunk[]}
        pageIndex={pageIndex}
        isLeftPage={isLeftPage}
        publicationPage={publicationPage}
        pageFormat={pageFormat}
        articleFlowPages={articleFlowPages}
        currentSlotContentId={currentSlotContentId}
      />
    </div>
  </div>
);
