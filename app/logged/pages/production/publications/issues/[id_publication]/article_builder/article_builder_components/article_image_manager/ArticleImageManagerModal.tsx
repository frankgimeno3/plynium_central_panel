"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import {
  articleSlotMaterialsMediatecaPath,
  magazinePublicationMediaLibraryPath,
} from "@/app/contents/mediatecaPaths";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import type { PublicationArticleChunk } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import {
  DEFAULT_MAGAZINE_PAGE_LAYOUT,
  normalizeMagazinePageLayout,
  type MagazinePageLayout,
} from "../magazinePageLayout";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import {
  buildArticleFlowPagesFromPublicationSlots,
  normalizeChunkFormat,
} from "../magazineArticleColumnFlow";
import { htmlToPlainText } from "@/app/logged/logged_components/RichTextEditor";
import { ArticleImageAreaGrid } from "./ArticleImageAreaGrid";
import {
  buildOverlayImageHtml,
  canAddCellToSelection,
  findAreaContainingCell,
  findFirstMergeableAreaPair,
  formatImageAreaLabel,
  isOverlayImageChunk,
  MAX_IMAGE_AREAS_PER_PAGE,
  mergeCells,
  mergePairKey,
  placementFromCells,
  type GridCell,
  type ImageAreaSelection,
} from "./articleImagePlacement";

export type ArticleImagePageData = {
  slotId: number;
  slotContentId: number;
  pageIndex: number;
  publicationPage: number | null;
  pageFormat: MagazinePageLayout;
  isLeftPage: boolean;
  chunks: PublicationArticleChunk[];
};

type AreaWithImage = ImageAreaSelection & {
  imageUrl: string | null;
  imageName: string | null;
};

type ArticleImageManagerModalProps = {
  open: boolean;
  onClose: () => void;
  publicationId: string;
  publicationArticleId: string;
  publicationEditionName: string;
  articleId: string;
  initialSlotId: number | null;
  initialSlotContentId: number | null;
  onCompleted: () => void;
};

type Phase = 1 | 2 | 3;

function newAreaId(): string {
  return `area-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createAreaFromCells(cells: GridCell[]): AreaWithImage | null {
  const placement = placementFromCells(cells);
  if (!placement) return null;
  return {
    id: newAreaId(),
    cells: [...cells],
    placement,
    imageUrl: null,
    imageName: null,
  };
}

function buildManagerSubtitle(opts: {
  articleLabel: string;
  page: ArticleImagePageData | null;
  totalPages: number;
  phase: Phase;
}): string {
  const { articleLabel, page, totalPages, phase } = opts;
  if (!page || totalPages < 1) {
    return phase === 1 ? `Article: ${articleLabel}` : `Article: ${articleLabel}`;
  }
  const pageLabel = `page ${page.pageIndex} of ${totalPages}`;
  const magazine =
    page.publicationPage != null ? ` (magazine page ${page.publicationPage})` : "";
  if (phase === 1) {
    return `${articleLabel} — choose article ${pageLabel}${magazine}`;
  }
  if (phase === 2) {
    return `${articleLabel} — image areas on ${pageLabel}${magazine}`;
  }
  return `${articleLabel} — assign images for ${pageLabel}${magazine}`;
}

export const ArticleImageManagerModal: FC<ArticleImageManagerModalProps> = ({
  open,
  onClose,
  publicationId,
  publicationArticleId,
  publicationEditionName,
  articleId,
  initialSlotId,
  initialSlotContentId,
  onCompleted,
}) => {
  const [phase, setPhase] = useState<Phase>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<ArticleImagePageData[]>([]);
  const [selectedPageKey, setSelectedPageKey] = useState<string | null>(null);
  const [areas, setAreas] = useState<AreaWithImage[]>([]);
  const [draftCells, setDraftCells] = useState<GridCell[]>([]);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [mediatecaAreaId, setMediatecaAreaId] = useState<string | null>(null);
  const [dismissedMergePairKeys, setDismissedMergePairKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [articleDisplayTitle, setArticleDisplayTitle] = useState("");

  const selectedPage = useMemo(() => {
    if (!selectedPageKey) return null;
    return pages.find((p) => `${p.slotId}-${p.slotContentId}` === selectedPageKey) ?? null;
  }, [pages, selectedPageKey]);

  const columnCount = selectedPage?.pageFormat === "3_col_article" ? 3 : 2;

  const articleFlowPages = useMemo(() => {
    const seen = new Set<string>();
    const allChunks: PublicationArticleChunk[] = [];
    for (const p of pages) {
      for (const c of p.chunks) {
        if (seen.has(c.publication_article_chunk_id)) continue;
        seen.add(c.publication_article_chunk_id);
        allChunks.push(c);
      }
    }
    return buildArticleFlowPagesFromPublicationSlots(
      pages.map((p) => ({ publication_slot_id: p.slotId })),
      allChunks
    );
  }, [pages]);

  const mediatecaPath = useMemo(() => {
    const edition = publicationEditionName.trim();
    const sid = selectedPage?.slotId;
    if (edition && articleId && sid) {
      return articleSlotMaterialsMediatecaPath(edition, articleId, sid);
    }
    return magazinePublicationMediaLibraryPath(publicationEditionName);
  }, [publicationEditionName, articleId, selectedPage?.slotId]);

  const loadPages = useCallback(async () => {
    if (!publicationArticleId || !publicationId) return;
    setLoading(true);
    setError(null);
    try {
      const paRes = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!paRes.ok) throw new Error("Failed to load publication article");
      const paJson = (await paRes.json()) as {
        publication_article: { publication_slots_id_array: number[] };
        chunks: PublicationArticleChunk[];
      };
      const slotIds = Array.isArray(paJson.publication_article?.publication_slots_id_array)
        ? paJson.publication_article.publication_slots_id_array.map(Number)
        : [];
      const allChunks = Array.isArray(paJson.chunks) ? paJson.chunks : [];

      const pageRows: ArticleImagePageData[] = [];
      for (let i = 0; i < slotIds.length; i++) {
        const slotId = slotIds[i];
        if (!Number.isFinite(slotId) || slotId <= 0) continue;

        const slotRes = await fetch(`/api/v1/publication-slots/${slotId}`, {
          cache: "no-store",
          credentials: "include",
        });
        if (!slotRes.ok) continue;

        const slotJson = (await slotRes.json()) as {
          publication_page?: number;
          magazine_page_layout?: string;
          slot_content_type?: string;
        };
        const ctype = String(slotJson.slot_content_type ?? "").toLowerCase();
        if (ctype && ctype !== "article") continue;

        const pp = slotJson.publication_page;
        const publicationPage =
          pp != null && Number.isFinite(Number(pp)) ? Math.round(Number(pp)) : null;
        const pageFormat = normalizeMagazinePageLayout(slotJson.magazine_page_layout);
        const pageChunks = allChunks.filter((c) => chunkPublicationSlotId(c) === slotId);
        const pageIndex = i + 1;
        const isLeftPage = pageIndex > 0 && pageIndex % 2 === 0;

        pageRows.push({
          slotId,
          slotContentId: slotId,
          pageIndex,
          publicationPage,
          pageFormat,
          isLeftPage,
          chunks: pageChunks,
        });
      }

      setPages(pageRows);

      const titleChunk = allChunks.find(
        (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title"
      );
      const titleFromChunk = titleChunk
        ? htmlToPlainText(titleChunk.chunk_html).trim()
        : "";
      setArticleDisplayTitle(titleFromChunk || articleId);

      if (initialSlotId && initialSlotContentId) {
        setSelectedPageKey(`${initialSlotId}-${initialSlotContentId}`);
      } else if (pageRows[0]) {
        setSelectedPageKey(`${pageRows[0].slotId}-${pageRows[0].slotContentId}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load pages");
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId, publicationId, initialSlotId, initialSlotContentId, articleId]);

  useEffect(() => {
    if (!open) {
      setPhase(1);
      setAreas([]);
      setDraftCells([]);
      setHoveredCell(null);
      setDismissedMergePairKeys(new Set());
      setError(null);
      return;
    }
    void loadPages();
  }, [open, loadPages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mediatecaAreaId != null) {
        setMediatecaAreaId(null);
        return;
      }
      if (submitting) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, mediatecaAreaId, submitting]);

  const commitDraft = useCallback(() => {
    if (!draftCells.length) return;
    const area = createAreaFromCells(draftCells);
    if (!area) return;
    setAreas((prev) => {
      if (prev.length >= MAX_IMAGE_AREAS_PER_PAGE) return prev;
      return [...prev, area];
    });
    setDraftCells([]);
  }, [draftCells]);

  const mergeablePair = useMemo(() => findFirstMergeableAreaPair(areas), [areas]);

  const mergeablePairKey = useMemo(
    () =>
      mergeablePair
        ? mergePairKey(mergeablePair.areaIds[0], mergeablePair.areaIds[1])
        : null,
    [mergeablePair]
  );

  const showSidebarMergeSuggestion = Boolean(
    mergeablePair &&
      mergeablePairKey &&
      !dismissedMergePairKeys.has(mergeablePairKey) &&
      draftCells.length === 0
  );

  const mergeablePairAreaIds = useMemo(
    () => new Set(showSidebarMergeSuggestion ? mergeablePair?.areaIds ?? [] : []),
    [showSidebarMergeSuggestion, mergeablePair]
  );

  const mergeTwoAreas = useCallback((idA: string, idB: string) => {
    setAreas((prev) => {
      const a = prev.find((x) => x.id === idA);
      const b = prev.find((x) => x.id === idB);
      if (!a || !b) return prev;
      const mergedCells = mergeCells(a.cells, b.cells);
      const placement = placementFromCells(mergedCells);
      if (!placement) return prev;
      const merged: AreaWithImage = {
        id: a.id,
        cells: mergedCells,
        placement,
        imageUrl: a.imageUrl ?? b.imageUrl,
        imageName: a.imageName ?? b.imageName,
      };
      return [...prev.filter((x) => x.id !== idA && x.id !== idB), merged];
    });
    if (mergeablePairKey) {
      setDismissedMergePairKeys((prev) => {
        const next = new Set(prev);
        next.delete(mergeablePairKey);
        return next;
      });
    }
  }, [mergeablePairKey]);

  const dismissMergeSuggestion = useCallback(() => {
    if (!mergeablePairKey) return;
    setDismissedMergePairKeys((prev) => new Set(prev).add(mergeablePairKey));
  }, [mergeablePairKey]);

  const handleCellClick = useCallback(
    (cell: GridCell) => {
      if (findAreaContainingCell(areas, cell)) return;

      if (draftCells.length === 0) {
        setDraftCells([cell]);
        return;
      }

      if (canAddCellToSelection(draftCells, cell)) {
        setDraftCells((prev) => mergeCells(prev, [cell]));
        return;
      }

      const draftArea = createAreaFromCells(draftCells);
      if (draftArea && areas.length < MAX_IMAGE_AREAS_PER_PAGE) {
        setAreas((prev) => [...prev, draftArea]);
      }
      setDraftCells([cell]);
    },
    [areas, draftCells]
  );

  const handleRemoveArea = useCallback((areaId: string) => {
    setAreas((prev) => prev.filter((a) => a.id !== areaId));
  }, []);

  const goToPhase2 = useCallback(() => {
    if (!selectedPage) return;
    setAreas([]);
    setDraftCells([]);
    setDismissedMergePairKeys(new Set());
    setPhase(2);
  }, [selectedPage]);

  const goToPhase3 = useCallback(() => {
    if (draftCells.length) commitDraft();
    if (areas.length === 0 && draftCells.length === 0) {
      setError("Select at least one image area on the page.");
      return;
    }
    const finalAreas = draftCells.length
      ? (() => {
          const placement = placementFromCells(draftCells);
          if (!placement || areas.length >= MAX_IMAGE_AREAS_PER_PAGE) return areas;
          return [
            ...areas,
            {
              id: newAreaId(),
              cells: [...draftCells],
              placement,
              imageUrl: null,
              imageName: null,
            },
          ];
        })()
      : areas;
    setDraftCells([]);
    setAreas(finalAreas);
    setPhase(3);
    setError(null);
  }, [areas, draftCells, commitDraft]);

  const allImagesAssigned = areas.length > 0 && areas.every((a) => Boolean(a.imageUrl?.trim()));

  const handleComplete = useCallback(async () => {
    if (!selectedPage || !allImagesAssigned) return;
    setSubmitting(true);
    setError(null);
    try {
      const pageChunks = selectedPage.chunks;
      const overlayExisting = pageChunks.filter(
        (c) =>
          String(c.publication_article_chunk_format).toLowerCase() === "only_image" &&
          isOverlayImageChunk(c.chunk_html, c.publication_article_chunk_format)
      );

      for (const ch of overlayExisting) {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(ch.publication_article_chunk_id)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to remove previous image chunk");
        }
      }

      const maxPos = pageChunks.reduce(
        (m, c) => Math.max(m, Number(c.chunk_position) || 0),
        0
      );

      for (let i = 0; i < areas.length; i++) {
        const area = areas[i];
        const html = buildOverlayImageHtml(area.imageUrl ?? "", area.placement, area.imageName ?? "");
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_image",
              chunk_html: html,
              chunk_position: maxPos + 1 + i,
              publication_slot_id: selectedPage.slotId,
              chunk_page_weight: 80,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to create image chunk");
        }
      }

      onCompleted();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save images");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPage, areas, allImagesAssigned, publicationArticleId, onCompleted, onClose]);

  const articleLabel = articleDisplayTitle.trim() || articleId;
  const managerSubtitle = buildManagerSubtitle({
    articleLabel,
    page: selectedPage,
    totalPages: pages.length,
    phase,
  });

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
        <div
          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="article-image-manager-title"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 id="article-image-manager-title" className="text-lg font-semibold text-gray-900">
                Article Image manager
              </h2>
              <p className="text-xs text-gray-500">{managerSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-hidden px-5 py-4">
            {loading ? (
              <p className="text-center text-sm text-gray-500 py-12">Loading article pages…</p>
            ) : null}
            {error ? (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {!loading && phase === 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Select a page to place images on.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pages.map((page) => {
                    const key = `${page.slotId}-${page.slotContentId}`;
                    const active = selectedPageKey === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedPageKey(key)}
                        className={`rounded-lg border p-2 text-left transition ${
                          active
                            ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50/50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <p className="text-xs font-semibold text-gray-800 mb-2">
                          Page {page.pageIndex}
                          {page.publicationPage != null ? ` · mag. ${page.publicationPage}` : ""}
                        </p>
                        <div className="pointer-events-none scale-[0.45] origin-top-left w-[220%] h-[220%]">
                          <ArticleSubpagePagePreview
                            hideHeading
                            chunks={page.chunks}
                            pageIndex={page.pageIndex}
                            isLeftPage={page.isLeftPage}
                            publicationPage={page.publicationPage}
                            pageFormat={page.pageFormat}
                            articleFlowPages={articleFlowPages}
                            currentSlotContentId={page.slotContentId}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {!loading && phase === 2 && selectedPage ? (
              <div className="flex flex-col gap-4">
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                  Image areas use space on this page layout. Text will{" "}
                  <strong>not flow into columns covered by an image</strong> — that region is
                  reserved for the picture only.
                </p>
                <p className="text-sm text-gray-600">
                  On the page thumbnail below, click a body section to start an area; click adjacent
                  sections to extend it. Up to {MAX_IMAGE_AREAS_PER_PAGE} areas per page.
                </p>
                <ArticleImageAreaGrid
                  columnCount={columnCount}
                  areas={areas}
                  draftCells={draftCells}
                  hoveredCell={hoveredCell}
                  onHoverCell={setHoveredCell}
                  onCellClick={handleCellClick}
                  onRemoveArea={handleRemoveArea}
                  onClearDraft={() => setDraftCells([])}
                  chunks={selectedPage.chunks}
                  pageIndex={selectedPage.pageIndex}
                  isLeftPage={selectedPage.isLeftPage}
                  publicationPage={selectedPage.publicationPage}
                  pageFormat={selectedPage.pageFormat}
                  articleFlowPages={articleFlowPages}
                  slotContentId={selectedPage.slotContentId}
                />
                {draftCells.length > 0 ? (
                  <div className="flex flex-col items-center gap-2 border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-700">
                      {draftCells.length === 1
                        ? "1 section selected"
                        : `${draftCells.length} sections selected`}
                      {placementFromCells(draftCells)
                        ? ` (${formatImageAreaLabel(placementFromCells(draftCells)!, columnCount)})`
                        : ""}
                    </p>
                    <button
                      type="button"
                      onClick={commitDraft}
                      className="rounded-lg bg-blue-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-900"
                    >
                      Confirm this image area
                    </button>
                  </div>
                ) : null}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-800">
                    Confirmed image areas ({areas.length}/{MAX_IMAGE_AREAS_PER_PAGE})
                  </p>
                  {areas.length === 0 ? (
                    <p className="text-xs text-gray-500">None yet — select on the thumbnail above.</p>
                  ) : (
                    <ul className="space-y-2">
                      {showSidebarMergeSuggestion && mergeablePair ? (
                        <li className="rounded-lg border-2 border-amber-400 bg-amber-50/60 p-3 space-y-2">
                          <p className="text-xs font-semibold text-amber-900">
                            Two neighbouring areas can be merged into one image block.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={dismissMergeSuggestion}
                              className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Keep separate
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                mergeTwoAreas(
                                  mergeablePair.areaIds[0],
                                  mergeablePair.areaIds[1]
                                )
                              }
                              className="rounded-md bg-blue-950 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-900"
                            >
                              Merge into one area
                            </button>
                          </div>
                        </li>
                      ) : null}
                      {areas.map((a, idx) => {
                        if (mergeablePairAreaIds.has(a.id)) return null;
                        return (
                          <li
                            key={a.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
                          >
                            <span>
                              <span className="font-medium">Area {idx + 1}</span>
                              <span className="text-gray-600">
                                {" "}
                                — {formatImageAreaLabel(a.placement, columnCount)}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveArea(a.id)}
                              className="shrink-0 text-xs font-medium text-red-700 hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}

            {!loading && phase === 3 ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Assign an image from the media library to each selected area. All cards must be
                  green to continue.
                </p>
                <ul className="space-y-3">
                  {areas.map((area, idx) => {
                    const done = Boolean(area.imageUrl?.trim());
                    return (
                      <li
                        key={area.id}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                          done
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Image area {idx + 1}
                          </p>
                          <p className="text-xs text-gray-500">{formatImageAreaLabel(area.placement, columnCount)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMediatecaAreaId(area.id)}
                          className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                        >
                          {done ? "Change image" : "Select image"}
                        </button>
                        {done && area.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={area.imageUrl}
                            alt=""
                            className="h-14 w-14 shrink-0 rounded object-cover border border-emerald-300"
                          />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-gray-200 px-5 py-4">
            {phase > 1 ? (
              <button
                type="button"
                onClick={() => setPhase((p) => (p === 3 ? 2 : 1) as Phase)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
            ) : null}
            {phase === 1 ? (
              <button
                type="button"
                disabled={!selectedPage}
                onClick={goToPhase2}
                className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:opacity-50"
              >
                Continue to area selection
              </button>
            ) : null}
            {phase === 2 ? (
              <button
                type="button"
                onClick={goToPhase3}
                className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900"
              >
                Continue to images ({areas.length + (draftCells.length ? 1 : 0)}/
                {MAX_IMAGE_AREAS_PER_PAGE})
              </button>
            ) : null}
            {phase === 3 ? (
              <button
                type="button"
                disabled={!allImagesAssigned || submitting}
                onClick={() => void handleComplete()}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? "Saving…" : "Complete and reload editor"}
              </button>
            ) : null}
          </footer>
        </div>
      </div>

      <MediatecaModal
        open={mediatecaAreaId != null}
        onClose={() => setMediatecaAreaId(null)}
        onSelectImage={(url, meta) => {
          if (!mediatecaAreaId) return;
          setAreas((prev) =>
            prev.map((a) =>
              a.id === mediatecaAreaId
                ? { ...a, imageUrl: url, imageName: meta?.name ?? null }
                : a
            )
          );
          setMediatecaAreaId(null);
        }}
        initialPath={mediatecaPath}
        ensureSlotMediatecaFolder={
          selectedPage?.slotId
            ? { publicationId, slotId: selectedPage.slotId }
            : undefined
        }
      />
    </>
  );
};
