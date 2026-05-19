"use client";

import Link from "next/link";
import React, { FC } from "react";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import {
  chunkPageOverflowIds,
  dedupeChunksForDisplay,
  isTitleOrSubtitleChunkFormat,
  totalChunkPageWeight,
} from "../chunkUtils";
import type {
  ArticleBuilderPageSummary,
  ChunkPageOption,
  PublicationArticleChunk,
} from "../types";
import { ArticleBuilderActionAlerts } from "./ArticleBuilderActionAlerts";
import { ArticleBuilderPagePreviewThumbnail } from "./ArticleBuilderPagePreviewThumbnail";
import { ChunkEditorTableRow } from "./ChunkEditorTableRow";

export type ArticleBuilderPagesManagerTabProps = {
  pages: ArticleBuilderPageSummary[];
  chunks: PublicationArticleChunk[];
  pageOptions: ChunkPageOption[];
  articleFlowPages: ReturnType<typeof buildArticleFlowPagesFromPublicationSlots>;
  magazinePageLayout: MagazinePageLayout;
  pageCountInput: number;
  syncing: boolean;
  actionMessage: string | null;
  actionError: string | null;
  busyChunkId: string | null;
  bulkChunkMoveBusy: boolean;
  chunksUnassigned: PublicationArticleChunk[];
  unassignedWeightOverflowIds: Set<string>;
  portalArticleIdForOriginalTab: string | null;
  editorPageHref: (slotId: number) => string;
  onPageCountInputChange: (value: number) => void;
  onSyncPages: () => void;
  onInitializeChunks: () => void;
  onAddBlankChunk: () => void;
  onAssignChunk: (chunkId: string, slotId: number | null) => void;
  onRequestDelete: (chunk: PublicationArticleChunk) => void;
  onWeightCommit: (chunkId: string, weight: number) => void;
  onMoveRestForward: (
    currentSlotId: number | null,
    nextSlotId: number,
    fromChunk: PublicationArticleChunk
  ) => void;
};

export const ArticleBuilderPagesManagerTab: FC<ArticleBuilderPagesManagerTabProps> = ({
  pages,
  chunks,
  pageOptions,
  articleFlowPages,
  magazinePageLayout,
  pageCountInput,
  syncing,
  actionMessage,
  actionError,
  busyChunkId,
  bulkChunkMoveBusy,
  chunksUnassigned,
  unassignedWeightOverflowIds,
  portalArticleIdForOriginalTab,
  editorPageHref,
  onPageCountInputChange,
  onSyncPages,
  onInitializeChunks,
  onAddBlankChunk,
  onAssignChunk,
  onRequestDelete,
  onWeightCommit,
  onMoveRestForward,
}) => (
  <>
    <ArticleBuilderActionAlerts actionError={actionError} actionMessage={actionMessage} />

    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wide text-gray-500">
            Number of magazine pages
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={pageCountInput}
            onChange={(e) => onPageCountInputChange(Number(e.target.value) || 1)}
            className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={onSyncPages}
          disabled={syncing}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Apply page count"}
        </button>
        <button
          type="button"
          onClick={onInitializeChunks}
          disabled={!portalArticleIdForOriginalTab}
          title={
            !portalArticleIdForOriginalTab
              ? "Only available when this publication article is linked to a portal article."
              : undefined
          }
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Import chunks from source article
        </button>
        <span className="text-xs text-gray-500">
          {pages.length} page{pages.length === 1 ? "" : "s"} provisioned · {chunks.length} chunk
          {chunks.length === 1 ? "" : "s"}
        </span>
      </div>
    </section>

    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-800">Pages</h2>
      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Set a page count above to provision magazine pages for this article.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pages.map((p) => {
            const sid = p.publication_slot_id;
            const pageChunksForThumb = dedupeChunksForDisplay(
              chunks.filter((ch) => chunkPublicationSlotId(ch) === sid)
            );
            const isLeftPage = p.index > 0 && p.index % 2 === 0;
            return (
              <Link
                key={String(p.publication_slot_id)}
                href={editorPageHref(p.publication_slot_id)}
                className="group flex flex-col gap-1.5 rounded-lg border border-gray-200 bg-white p-2 shadow-sm transition hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex gap-3">
                  <span className="flex w-9 shrink-0 select-none flex-col items-end justify-start pt-1 text-right text-2xl font-semibold tabular-nums text-gray-400 transition-colors group-hover:text-blue-600">
                    {p.index}
                  </span>
                  <div className="min-w-0 flex-1 opacity-75 transition-opacity group-hover:opacity-100">
                    <ArticleBuilderPagePreviewThumbnail
                      chunks={pageChunksForThumb}
                      pageIndex={p.index}
                      isLeftPage={isLeftPage}
                      publicationPage={p.publication_page}
                      pageFormat={magazinePageLayout}
                      articleFlowPages={articleFlowPages}
                      currentSlotContentId={sid}
                    />
                  </div>
                </div>
                <p className="pl-12 text-[10px] text-gray-500">
                  {p.publication_page != null ? (
                    <span>Publication page {p.publication_page}</span>
                  ) : (
                    <span className="font-mono">slot #{p.publication_slot_id}</span>
                  )}
                  <span className="text-gray-400"> · </span>
                  {p.chunkIds.length} chunk{p.chunkIds.length === 1 ? "" : "s"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>

    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Chunks</h2>
          <p className="mt-0.5 max-w-xl text-xs text-slate-400">
            One table per magazine page. Title and subtitle are fixed on page 1 and cannot be
            deleted. Each chunk has a layout weight (1–100); the target per page is at most 100
            total.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddBlankChunk}
          className="shrink-0 rounded-lg border border-slate-500 bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
        >
          + Add blank chunk
        </button>
      </header>

      {chunks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-500 bg-slate-900/50 p-6 text-center text-sm text-slate-200">
          No chunks yet. Use &quot;Import chunks from source article&quot; to bring in the portal
          article paragraphs, or add a blank chunk to start writing from scratch.
        </div>
      ) : (
        <div className="space-y-10">
          {pages.map((page) => {
            const sid = page.publication_slot_id;
            const pageChunks = dedupeChunksForDisplay(
              chunks.filter((ch) => chunkPublicationSlotId(ch) === sid)
            );
            const pageWeightTotal = totalChunkPageWeight(pageChunks);
            const pageOverflowIds = chunkPageOverflowIds(pageChunks);
            const pageOverBudget = pageWeightTotal > 100;
            const nextPage = pages.find((p) => p.index === page.index + 1);
            const nextSid = nextPage?.publication_slot_id ?? null;

            return (
              <div key={`chunk-page-${page.publication_slot_id}`} className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-sm font-semibold text-slate-100">
                    Page {page.index}
                    <span className="ml-2 font-normal text-slate-500">
                      {page.publication_page != null ? (
                        <>· publication page {page.publication_page}</>
                      ) : (
                        <>· slot #{page.publication_slot_id}</>
                      )}
                    </span>
                  </h3>
                  {pageChunks.length > 0 ? (
                    <span
                      className={`text-xs font-medium ${
                        pageOverBudget ? "text-red-300" : "text-slate-400"
                      }`}
                    >
                      Layout weight {pageWeightTotal} / 100
                    </span>
                  ) : null}
                </div>

                {pageOverBudget ? (
                  <div className="rounded-lg border border-red-500/50 bg-red-950/35 px-3 py-2 text-xs text-red-100">
                    This page exceeds the recommended total weight of 100. Add another magazine
                    page (increase page count) and move some chunks there, or lower individual
                    chunk weights.
                  </div>
                ) : null}

                {pageChunks.length === 0 ? (
                  <p className="text-xs text-slate-500">No chunks assigned to this page.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-600 bg-slate-950">
                    <table className="min-w-full text-sm text-white">
                      <thead className="border-b border-slate-600 bg-slate-900 text-white">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">Format</th>
                          <th className="px-3 py-2 text-left font-medium">Weight</th>
                          <th className="px-3 py-2 text-left font-medium">Preview</th>
                          <th className="px-3 py-2 text-left font-medium">Page</th>
                          <th className="px-3 py-2 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {pageChunks.map((chunk) => (
                          <ChunkEditorTableRow
                            key={chunk.publication_article_chunk_id}
                            chunk={chunk}
                            rowBusy={
                              bulkChunkMoveBusy ||
                              busyChunkId === chunk.publication_article_chunk_id
                            }
                            pageOptions={pageOptions}
                            onAssign={onAssignChunk}
                            onRequestDelete={onRequestDelete}
                            onWeightCommit={onWeightCommit}
                            previewOverflow={pageOverflowIds.has(
                              chunk.publication_article_chunk_id
                            )}
                            canMoveRestForward={
                              !isTitleOrSubtitleChunkFormat(
                                chunk.publication_article_chunk_format
                              ) && nextSid != null
                            }
                            onMoveRestForward={
                              nextSid != null
                                ? () => void onMoveRestForward(sid, nextSid, chunk)
                                : undefined
                            }
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {chunksUnassigned.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-100">Unassigned</h3>
              <p className="text-xs text-slate-500">Chunks not linked to a magazine page yet.</p>
              <div className="overflow-x-auto rounded-xl border border-slate-600 bg-slate-950">
                <table className="min-w-full text-sm text-white">
                  <thead className="border-b border-slate-600 bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">#</th>
                      <th className="px-3 py-2 text-left font-medium">Format</th>
                      <th className="px-3 py-2 text-left font-medium">Weight</th>
                      <th className="px-3 py-2 text-left font-medium">Preview</th>
                      <th className="px-3 py-2 text-left font-medium">Page</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {chunksUnassigned.map((chunk) => {
                      const firstPageSid = pageOptions[0]?.publication_slot_id ?? null;
                      return (
                        <ChunkEditorTableRow
                          key={chunk.publication_article_chunk_id}
                          chunk={chunk}
                          rowBusy={
                            bulkChunkMoveBusy ||
                            busyChunkId === chunk.publication_article_chunk_id
                          }
                          pageOptions={pageOptions}
                          onAssign={onAssignChunk}
                          onRequestDelete={onRequestDelete}
                          onWeightCommit={onWeightCommit}
                          previewOverflow={unassignedWeightOverflowIds.has(
                            chunk.publication_article_chunk_id
                          )}
                          canMoveRestForward={
                            !isTitleOrSubtitleChunkFormat(
                              chunk.publication_article_chunk_format
                            ) && firstPageSid != null
                          }
                          onMoveRestForward={
                            firstPageSid != null
                              ? () => void onMoveRestForward(null, firstPageSid, chunk)
                              : undefined
                          }
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  </>
);
