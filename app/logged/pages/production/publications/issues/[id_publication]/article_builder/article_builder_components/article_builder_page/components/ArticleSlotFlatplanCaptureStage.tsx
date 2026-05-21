"use client";

import React, { FC, useMemo } from "react";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk as PreviewPublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import { dedupeChunksForDisplay } from "../chunkUtils";
import { PAGE_THUMB_ASPECT } from "../constants";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { PublicationArticleChunk } from "../types";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import {
  ARTICLE_FLATPLAN_CAPTURE_HEIGHT_PX,
  ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX,
} from "../../articleSlotFlatplanCapture";

export type FlatplanCaptureSlotSpec = {
  slotId: number;
  articlePageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
};

type ArticleSlotFlatplanCaptureStageProps = {
  slotSpecs: FlatplanCaptureSlotSpec[];
  chunks: PublicationArticleChunk[];
  slotIdsOrdered: number[];
  magazinePageLayout: MagazinePageLayout;
  articleTitleHtml: string | null;
  articleSubtitleHtml: string | null;
};

/**
 * Off-screen magazine pages used when the visible editor thumbnail is not ready.
 * Dimensions match the editor's `w-[263%]` layout width, not the old 456px print stub.
 */
export const ArticleSlotFlatplanCaptureStage: FC<ArticleSlotFlatplanCaptureStageProps> = ({
  slotSpecs,
  chunks,
  slotIdsOrdered,
  magazinePageLayout,
  articleTitleHtml,
  articleSubtitleHtml,
}) => {
  const articleFlowPages = useMemo(
    () =>
      buildArticleFlowPagesFromPublicationSlots(
        slotIdsOrdered.map((publication_slot_id) => ({ publication_slot_id })),
        chunks
      ),
    [slotIdsOrdered, chunks]
  );

  if (slotSpecs.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[-1] flex flex-col gap-4 opacity-0"
      aria-hidden
    >
      {slotSpecs.map((spec) => {
        const pageChunks = dedupeChunksForDisplay(
          chunks.filter((ch) => chunkPublicationSlotId(ch) === spec.slotId)
        );
        const firstSlotId = slotIdsOrdered[0];
        const titleHtml =
          spec.slotId === firstSlotId && articleTitleHtml ? articleTitleHtml : null;
        const subtitleHtml =
          spec.slotId === firstSlotId && articleSubtitleHtml ? articleSubtitleHtml : null;

        return (
          <div
            key={spec.slotId}
            data-article-flatplan-capture={String(spec.slotId)}
            className="shrink-0 overflow-hidden rounded-sm border border-gray-200 bg-white shadow-sm"
            style={{
              width: ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX,
              height: ARTICLE_FLATPLAN_CAPTURE_HEIGHT_PX,
              minWidth: ARTICLE_FLATPLAN_CAPTURE_WIDTH_PX,
              minHeight: ARTICLE_FLATPLAN_CAPTURE_HEIGHT_PX,
            }}
          >
            <div className="h-full w-full">
              <ArticleSubpagePagePreview
                hideHeading
                fillContainer
                chunks={pageChunks as PreviewPublicationArticleChunk[]}
                pageIndex={spec.articlePageIndex}
                isLeftPage={spec.isLeftPage}
                publicationPage={spec.publicationPage}
                pageFormat={magazinePageLayout}
                articleFlowPages={articleFlowPages}
                currentSlotContentId={spec.slotId}
                articleTitleHtml={titleHtml}
                articleSubtitleHtml={subtitleHtml}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** @internal exported for tests — page index from ordered slot ids. */
export function articlePageIndexForSlot(slotIdsOrdered: number[], slotId: number): number {
  const idx = slotIdsOrdered.findIndex((id) => id === slotId);
  return idx >= 0 ? idx + 1 : 0;
}

export function buildFlatplanCaptureSlotSpecs(
  slotIdsOrdered: number[],
  publicationPageBySlotId: Record<number, number>
): FlatplanCaptureSlotSpec[] {
  return slotIdsOrdered.map((slotId, idx) => {
    const articlePageIndex = idx + 1;
    const pubPage = publicationPageBySlotId[slotId];
    return {
      slotId,
      articlePageIndex,
      isLeftPage: articlePageIndex > 0 && articlePageIndex % 2 === 0,
      publicationPage:
        pubPage != null && Number.isFinite(Number(pubPage)) ? Math.round(Number(pubPage)) : null,
    };
  });
}
