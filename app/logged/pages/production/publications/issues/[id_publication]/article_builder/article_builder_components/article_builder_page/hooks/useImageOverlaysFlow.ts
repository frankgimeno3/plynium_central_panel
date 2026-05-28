"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import type { GridCell, ImageAreaSelection } from "../../article_image_manager/articleImagePlacement";
import {
  findAreaContainingCell,
  findMergeableAreaForCell,
  mergeCells,
  placementFromCells,
  type MergeableAreaPair as MergePair,
} from "../../article_image_manager/articleImagePlacement";
import {
  areaCodesOverlap,
  areaCodesToPlacement,
  areaPairDeclineKey,
  buildSimpleImageChunkHtml,
  cellsToAreaCodes,
  expandImageAreaCodes,
  normalizeAreaCodes,
} from "../../article_image_manager/articleAreaCodes";
import {
  chunkSupportsTextEditing,
  plainTextToChunkHtml,
  writeChunkEditableHtml,
} from "../../articleChunkPlainTextEditing";
import { normalizeChunkFormat } from "../../magazineArticleColumnFlow";
import { isOverlayImageChunk } from "../../article_image_manager/articleImagePlacement";
import type { AreaImageDraft } from "../../ArticleBuilderImageAreaModals";
import type { MagazinePageLayout } from "../../magazinePageLayout";
import type { PublicationArticleChunk } from "../types";

function newAreaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through */
    }
  }
  return `area_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

function createAreaFromCell(cell: GridCell): ImageAreaSelection {
  const placement = {
    colStart: cell.col,
    colEnd: cell.col,
    rowStart: cell.row,
    rowEnd: cell.row,
  };
  return {
    id: newAreaId(),
    cells: [cell],
    placement,
    areaCodes: cellsToAreaCodes([cell]),
  };
}

export function useImageOverlaysFlow({
  magazinePageLayout,
  chunks,
  publicationArticleId,
  onSaveMessage,
  onSaveError,
  reloadArticleChunks,
}: {
  magazinePageLayout: MagazinePageLayout;
  chunks: PublicationArticleChunk[];
  publicationArticleId: string;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
  reloadArticleChunks: () => Promise<void>;
}) {
  const chunksRef = useRef(chunks);
  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);
  const [addImagesSlotId, setAddImagesSlotId] = useState<number | null>(null);
  const [imageAreas, setImageAreas] = useState<ImageAreaSelection[]>([]);
  const [declinedMergePairKeys, setDeclinedMergePairKeys] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [pendingMergePair, setPendingMergePair] = useState<MergePair | null>(null);
  const [pickerDrafts, setPickerDrafts] = useState<AreaImageDraft[] | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [savingOverlays, setSavingOverlays] = useState(false);
  const [pendingDeleteOverlayChunkId, setPendingDeleteOverlayChunkId] = useState<string | null>(
    null
  );
  const [deletingOverlayImage, setDeletingOverlayImage] = useState(false);

  const columnCountForCurrentPage = useMemo(
    () => (magazinePageLayout === "3_col_article" ? 3 : 2),
    [magazinePageLayout]
  );

  const resetImageAreasState = useCallback(() => {
    setImageAreas([]);
    setDeclinedMergePairKeys(new Set());
    setPendingMergePair(null);
    setPickerDrafts(null);
    setPickerError(null);
  }, []);

  const handleAddImagesClick = useCallback(
    (slotId: number) => {
      if (addImagesSlotId === slotId) {
        if (imageAreas.length === 0) {
          setAddImagesSlotId(null);
          resetImageAreasState();
        } else {
          const drafts: AreaImageDraft[] = imageAreas.map((a) => {
            const areaCodes = a.areaCodes?.length ? a.areaCodes : cellsToAreaCodes(a.cells);
            return {
              id: a.id,
              areaCodes,
              placement: a.placement ?? areaCodesToPlacement(areaCodes, columnCountForCurrentPage)!,
              imageUrl: null,
              imageAlt: null,
              mediaName: null,
            };
          });
          setPickerDrafts(drafts);
          setPickerError(null);
        }
      } else {
        setAddImagesSlotId(slotId);
        resetImageAreasState();
      }
    },
    [addImagesSlotId, imageAreas, resetImageAreasState, columnCountForCurrentPage]
  );

  const handleCancelImageAreaSelection = useCallback(() => {
    setAddImagesSlotId(null);
    resetImageAreasState();
  }, [resetImageAreasState]);

  const handleImageAreaCellClick = useCallback(
    (slotId: number, cell: GridCell) => {
      if (addImagesSlotId !== slotId) return;
      if (pendingMergePair) return;

      setImageAreas((prev) => {
        if (findAreaContainingCell(prev, cell)) return prev;

        const mergeTarget = findMergeableAreaForCell(prev, cell);
        const newArea = createAreaFromCell(cell);

        if (mergeTarget) {
          const pairKey = areaPairDeclineKey(
            mergeTarget.areaCodes ?? cellsToAreaCodes(mergeTarget.cells),
            newArea.areaCodes ?? cellsToAreaCodes(newArea.cells)
          );
          if (!declinedMergePairKeys.has(pairKey)) {
            const mergedCells = mergeCells(mergeTarget.cells, newArea.cells);
            const mergedPlacement = placementFromCells(mergedCells);
            if (mergedPlacement) {
              setPendingMergePair({
                areaIds: [mergeTarget.id, newArea.id],
                areas: [mergeTarget, newArea],
                mergedPlacement,
              });
              return prev;
            }
          }
        }

        return [...prev, newArea];
      });
    },
    [addImagesSlotId, pendingMergePair, declinedMergePairKeys]
  );

  const handleImageAreaRemove = useCallback((areaId: string) => {
    setImageAreas((prev) => prev.filter((a) => a.id !== areaId));
    setDeclinedMergePairKeys((prev) => {
      const next = new Set<string>();
      for (const key of prev) {
        if (!key.includes(areaId)) next.add(key);
      }
      return next;
    });
  }, []);

  const handleConfirmMerge = useCallback(() => {
    const current = pendingMergePair;
    if (!current) return;
    const [a, b] = current.areas;
    const mergedCells = mergeCells(a.cells, b.cells);
    const mergedPlacement = placementFromCells(mergedCells);
    if (!mergedPlacement) {
      setPendingMergePair(null);
      return;
    }
    setImageAreas((prev) => {
      const remaining = prev.filter((x) => x.id !== a.id);
      const merged: ImageAreaSelection = {
        id: newAreaId(),
        cells: mergedCells,
        placement: mergedPlacement,
        areaCodes: cellsToAreaCodes(mergedCells),
      };
      return [...remaining, merged];
    });
    setPendingMergePair(null);
  }, [pendingMergePair]);

  const handleDeclineMerge = useCallback(() => {
    const current = pendingMergePair;
    if (!current) return;
    const [a, b] = current.areas;
    const key = areaPairDeclineKey(a.areaCodes ?? cellsToAreaCodes(a.cells), b.areaCodes ?? cellsToAreaCodes(b.cells));
    setDeclinedMergePairKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setImageAreas((prev) => {
      if (findAreaContainingCell(prev, b.cells[0]!)) return prev;
      return [...prev, b];
    });
    setPendingMergePair(null);
  }, [pendingMergePair]);

  const handleOverlayImageDeleteRequest = useCallback(
    (chunkId: string) => {
      const chunk = chunks.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk) return;
      if (
        !isOverlayImageChunk(
          chunk.chunk_html,
          chunk.publication_article_chunk_format,
          chunk.chunk_area_array
        )
      ) {
        return;
      }
      setPendingDeleteOverlayChunkId(chunkId);
    },
    [chunks]
  );

  const handleCancelDeleteOverlayImage = useCallback(() => {
    if (deletingOverlayImage) return;
    setPendingDeleteOverlayChunkId(null);
  }, [deletingOverlayImage]);

  const handleConfirmDeleteOverlayImage = useCallback(
    async (alsoDeleteFromMediateca: boolean) => {
      const chunkId = pendingDeleteOverlayChunkId;
      if (!chunkId || deletingOverlayImage) return;
      setDeletingOverlayImage(true);
      try {
        const query = alsoDeleteFromMediateca ? "?delete_mediateca=true" : "";
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}${query}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to delete image.");
        }
        await reloadArticleChunks();
        onSaveMessage?.(
          alsoDeleteFromMediateca
            ? "Image removed from the page and Mediateca."
            : "Image removed."
        );
        setPendingDeleteOverlayChunkId(null);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to delete image";
        onSaveError?.(msg);
      } finally {
        setDeletingOverlayImage(false);
      }
    },
    [
      pendingDeleteOverlayChunkId,
      deletingOverlayImage,
      reloadArticleChunks,
      onSaveMessage,
      onSaveError,
    ]
  );

  const handlePickerClearAreaImage = useCallback((areaId: string) => {
    setPickerDrafts((prev) =>
      prev
        ? prev.map((d) =>
            d.id === areaId ? { ...d, imageUrl: null, imageAlt: null, mediaName: null } : d
          )
        : prev
    );
  }, []);

  const handlePickerClose = useCallback(() => {
    if (savingOverlays) return;
    setPickerDrafts(null);
    setPickerError(null);
  }, [savingOverlays]);

  const handleApplyImageOverlays = useCallback(async () => {
    if (savingOverlays) return;
    if (!pickerDrafts || pickerDrafts.length === 0) return;
    if (addImagesSlotId == null) return;

    const drafts = pickerDrafts.filter((d) => !!d.imageUrl);
    if (drafts.length === 0) {
      setPickerError("Pick at least one image before applying.");
      return;
    }

    setSavingOverlays(true);
    setPickerError(null);
    try {
      const pageChunks = chunks.filter((c) => chunkPublicationSlotId(c) === addImagesSlotId);
      const columnCount = columnCountForCurrentPage;
      const claimedCells = new Set<string>();
      for (const draft of drafts) {
        for (const code of expandImageAreaCodes(
          normalizeAreaCodes(draft.areaCodes),
          columnCount
        )) {
          claimedCells.add(code);
        }
      }

      for (const chunk of pageChunks) {
        const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
        if (fmt !== "only_text" || !chunkSupportsTextEditing(fmt)) continue;
        const areas = normalizeAreaCodes(
          (chunk as { chunk_area_array?: unknown }).chunk_area_array
        );
        if (!areas.length || !areaCodesOverlap(areas, [...claimedCells])) continue;
        const clearedHtml = writeChunkEditableHtml(
          chunk.chunk_html,
          chunk.publication_article_chunk_format,
          plainTextToChunkHtml("")
        );
        if (clearedHtml === chunk.chunk_html) continue;
        const clearRes = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(
            chunk.publication_article_chunk_id
          )}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ chunk_html: clearedHtml }),
          }
        );
        if (!clearRes.ok) {
          const txt = await clearRes.text().catch(() => "");
          throw new Error(txt || "Failed to clear text under the image area.");
        }
      }

      let nextPosition =
        pageChunks.reduce((acc, c) => Math.max(acc, c.chunk_position), -1) + 1;

      for (const draft of drafts) {
        const areaCodes = normalizeAreaCodes(draft.areaCodes);
        const html = buildSimpleImageChunkHtml(
          String(draft.imageUrl),
          draft.imageAlt ?? draft.mediaName ?? ""
        );
        if (!html || areaCodes.length === 0) continue;
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_image",
              chunk_html: html,
              chunk_position: nextPosition,
              publication_slot_id: addImagesSlotId,
              chunk_area_array: areaCodes,
            }),
          }
        );
        if (!res.ok) {
          // We've observed intermittent backend 500s even though the chunk is
          // actually created and visible after refresh. Treat as success when
          // the expected overlay exists after a reload.
          const txt = await res.text().catch(() => "");
          await reloadArticleChunks();
          const expectedSrc = String(draft.imageUrl ?? "").trim();
          const hasExpected =
            expectedSrc !== "" &&
            chunksRef.current.some((c) => {
              if (chunkPublicationSlotId(c) !== addImagesSlotId) return false;
              if (String(c.publication_article_chunk_format).toLowerCase() !== "only_image")
                return false;
              const area = normalizeAreaCodes((c as { chunk_area_array?: unknown }).chunk_area_array);
              if (area.join(",") !== areaCodes.join(",")) return false;
              return String(c.chunk_html ?? "").includes(expectedSrc);
            });
          if (!hasExpected) {
            throw new Error(txt || `Failed to create overlay chunk (HTTP ${res.status}).`);
          }
        }
        nextPosition += 1;
      }

      await reloadArticleChunks();
      onSaveMessage?.(
        drafts.length === 1 ? "Image overlay added." : `${drafts.length} image overlays added.`
      );
      setAddImagesSlotId(null);
      resetImageAreasState();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add image overlays";
      setPickerError(msg);
      onSaveError?.(msg);
    } finally {
      setSavingOverlays(false);
    }
  }, [
    savingOverlays,
    pickerDrafts,
    addImagesSlotId,
    chunks,
    publicationArticleId,
    columnCountForCurrentPage,
    reloadArticleChunks,
    onSaveMessage,
    onSaveError,
    resetImageAreasState,
  ]);

  return {
    // state
    addImagesSlotId,
    imageAreas,
    pendingMergePair,
    pickerDrafts,
    pickerError,
    savingOverlays,
    pendingDeleteOverlayChunkId,
    deletingOverlayImage,
    columnCountForCurrentPage,

    // setters (needed by mediateca hook)
    setPickerDrafts,

    // handlers
    handleAddImagesClick,
    handleCancelImageAreaSelection,
    handleImageAreaCellClick,
    handleImageAreaRemove,
    handleConfirmMerge,
    handleDeclineMerge,
    handleOverlayImageDeleteRequest,
    handleCancelDeleteOverlayImage,
    handleConfirmDeleteOverlayImage,
    handlePickerClearAreaImage,
    handlePickerClose,
    handleApplyImageOverlays,
    resetImageAreasState,
  };
}

