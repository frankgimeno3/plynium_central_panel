"use client";

import React, { CSSProperties, FC, useMemo } from "react";
import {
  MagazineChunkEditorPreview,
  type MagazineChunkFormat,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/slots/[slot_id]/article_editor/MagazineArticleEditorChunkBody";
import {
  isOverlayImageChunk,
  overlayImageSrc,
  parseOverlayPlacement,
  placementPercentStyle,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_image_manager/articleImagePlacement";
import type { MagazinePageLayout } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import {
  type MagazineArticleFlowPageInput,
  normalizeChunkFormat,
  previewBodyChunksForPage,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { htmlToPlainText } from "@/app/logged/logged_components/RichTextEditor";
import { normalizedBodyChunkHtml } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleContentModel";
import type { PublicationArticleChunk } from "./types";

/** 228 × 297 mm portrait (magazine page proportion). */
const PAGE_ASPECT = "228 / 297";

function previewFormatForChunk(chunk: {
  publication_article_chunk_format: string;
  chunk_html: string;
}): MagazineChunkFormat {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  if (fmt === "title" || fmt === "subtitle" || fmt === "only_text") return fmt;
  if (fmt === "only_image") return "only_image";
  if (fmt === "text_image" || fmt === "image_text") return fmt;
  return "only_text";
}

type ArticleSubpagePagePreviewProps = {
  chunks: PublicationArticleChunk[];
  pageIndex: number;
  isLeftPage: boolean;
  publicationPage: number | null;
  pageFormat: MagazinePageLayout;
  /** Hide the "Page preview" heading (e.g. modal thumbnails). */
  hideHeading?: boolean;
  /** All article pages in spread order — enables column overflow into the next page. */
  articleFlowPages?: MagazineArticleFlowPageInput[];
  /** Which page's body slice to show when `articleFlowPages` is set. */
  currentSlotContentId?: number | null;
};

export const ArticleSubpagePagePreview: FC<ArticleSubpagePagePreviewProps> = ({
  chunks,
  pageIndex,
  isLeftPage,
  publicationPage,
  pageFormat,
  hideHeading = false,
  articleFlowPages,
  currentSlotContentId,
}) => {
  const sorted = useMemo(
    () =>
      [...chunks].sort(
        (a, b) =>
          a.chunk_position - b.chunk_position ||
          a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
      ),
    [chunks]
  );

  const columnCount = pageFormat === "3_col_article" ? 3 : 2;

  const bodyColumnStyle = useMemo(
    (): CSSProperties => ({
      height: "100%",
      columnCount,
      columnFill: "auto",
      columnGap: "1rem",
      columnRule: "1px solid rgb(229 231 235)",
      overflowWrap: "anywhere",
      wordBreak: "break-word",
    }),
    [columnCount]
  );

  const overlayChunks = useMemo(
    () =>
      sorted.filter((c) =>
        isOverlayImageChunk(c.chunk_html, c.publication_article_chunk_format)
      ),
    [sorted]
  );

  const { headline, subtitle, bodyFlowChunks } = useMemo(() => {
    const titleChunk = sorted.find((c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title");
    const subtitleChunk = sorted.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "subtitle"
    );
    const headlineText = titleChunk ? htmlToPlainText(titleChunk.chunk_html) : "";
    const subtitleText = subtitleChunk ? htmlToPlainText(subtitleChunk.chunk_html) : "";

    const bodyChunks = previewBodyChunksForPage(
      articleFlowPages,
      columnCount,
      currentSlotContentId,
      sorted
    );

    return {
      headline: headlineText || "Feature headline",
      subtitle: subtitleText || "Subtitle",
      bodyFlowChunks: bodyChunks,
    };
  }, [sorted, columnCount, articleFlowPages, currentSlotContentId]);

  const footerNumber =
    publicationPage != null && Number.isFinite(publicationPage)
      ? String(Math.round(Number(publicationPage)))
      : pageIndex > 0
        ? String(pageIndex)
        : "—";

  const links = (
    <div className="flex flex-col text-right text-[11px] leading-snug text-amber-300">
      <span>Go to contents</span>
      <span>Go to advertiser index</span>
    </div>
  );

  const numberEl = (
    <span className="text-sm font-semibold tabular-nums text-white">{footerNumber}</span>
  );

  const pageCard = (
    <div
      className="flex w-full max-w-[min(100%,28rem)] flex-col overflow-hidden rounded-sm border border-gray-300 bg-white shadow-md"
      style={{ aspectRatio: PAGE_ASPECT }}
    >
      <header className="shrink-0 bg-black px-4 py-3 text-white">
        <h3 className="text-lg font-bold leading-tight tracking-tight">{headline}</h3>
        <p className="mt-1 text-sm font-semibold leading-snug text-white/95">{subtitle}</p>
      </header>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {sorted.length === 0 ? (
          <div className="flex h-full min-h-[6rem] items-center justify-center px-4 text-center text-sm text-gray-400">
            No chunks on this page yet.
            
          </div>
        ) : (
          <>
            <div
              className="min-h-0 flex-1 overflow-hidden border-t border-gray-200 px-3 py-2 text-[9px] leading-snug text-gray-800 [overflow-wrap:anywhere] [&_.prose]:max-w-none [&_.prose]:break-words [&_.prose]:text-[9px] [&_.prose]:leading-snug [&_.prose_*]:max-w-full [&_.prose_*]:break-words [&_.prose_*]:[overflow-wrap:anywhere] [&_.prose_p]:my-0 [&_.prose_p+p]:mt-1.5"
              style={bodyColumnStyle}
              data-magazine-preview-body=""
              data-magazine-preview-columns={columnCount}
            >
              {bodyFlowChunks.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">—</p>
              ) : (
                bodyFlowChunks.map((chunk) => {
                  const chunkHtml = normalizedBodyChunkHtml(chunk);
                  if (!chunkHtml.trim()) return null;
                  const fmt = previewFormatForChunk({ ...chunk, chunk_html: chunkHtml });
                  const isMediaBlock =
                    fmt === "only_image" || fmt === "text_image" || fmt === "image_text";
                  if (isMediaBlock) {
                    return (
                      <div
                        key={chunk.publication_article_chunk_id}
                        className="mb-3 max-w-full break-inside-avoid [overflow-wrap:anywhere]"
                      >
                        <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={chunk.publication_article_chunk_id}
                      className="contents max-w-full [overflow-wrap:anywhere]"
                    >
                      <MagazineChunkEditorPreview format={fmt} chunkHtml={chunkHtml} />
                    </div>
                  );
                })
              )}
              
            </div>

            {overlayChunks.length > 0 ? (
              <div className="pointer-events-none absolute inset-0 z-20">
                {overlayChunks.map((chunk) => {
                  const placement = parseOverlayPlacement(chunk.chunk_html);
                  const src = overlayImageSrc(chunk.chunk_html);
                  if (!placement || !src) return null;
                  const box = placementPercentStyle(placement, columnCount);
                  return (
                    <div
                      key={chunk.publication_article_chunk_id}
                      className="absolute overflow-hidden"
                      style={box}
                    >
                      
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between bg-black px-4 py-2.5 text-white">
        {isLeftPage ? (
          <>
            {numberEl}
            {links}
          </>
        ) : (
          <>
            {links}
            {numberEl}
            
          </>
        )}
      </footer>
    </div>
  );

  if (hideHeading) {
    return <div className="flex w-full flex-col items-center">{pageCard}</div>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <h2 className="text-sm font-semibold text-gray-800">Page preview</h2>
      {pageCard}
    </div>
  );
};
