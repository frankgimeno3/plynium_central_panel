"use client";

import React, { FC, useEffect, useState } from "react";
import {
  areaCodesToPlacement,
  cellToAreaCode,
  cellsToAreaCodes,
  formatAreaCodesLabel,
  normalizeAreaCodes,
} from "./article_image_manager/articleAreaCodes";
import type { ImageAreaPlacement, ImageAreaSelection } from "./article_image_manager/articleImagePlacement";

/* -------------------------------------------------------------------------- */
/* Merge-prompt modal                                                         */
/* -------------------------------------------------------------------------- */

export type AreaImageDraft = {
  id: string;
  /** Canonical footprint, e.g. ["b1", "c1"] or ["a2", "a3"]. */
  areaCodes: string[];
  placement: ImageAreaPlacement;
  imageUrl: string | null;
  imageAlt: string | null;
  mediaName: string | null;
};

type ArticleBuilderImageAreaMergeModalProps = {
  open: boolean;
  /** The two areas about to share a footprint. The merge target is `areas[0]`. */
  areas: [ImageAreaSelection, ImageAreaSelection] | null;
  columnCount: number;
  onMerge: () => void;
  onKeepSeparate: () => void;
};

/**
 * Confirmation prompt shown whenever the user's last action produced two
 * adjacent image areas that together form a valid rectangle. Saying "yes"
 * collapses them into a single area; "no" keeps them separate (and the pair is
 * remembered so we don't keep asking about it after every cell click).
 */
export const ArticleBuilderImageAreaMergeModal: FC<
  ArticleBuilderImageAreaMergeModalProps
> = ({ open, areas, columnCount, onMerge, onKeepSeparate }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onKeepSeparate();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onKeepSeparate]);

  if (!open || !areas) return null;
  const [a, b] = areas;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-builder-image-area-merge-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onKeepSeparate}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3
          id="article-builder-image-area-merge-title"
          className="text-base font-semibold text-gray-900"
        >
          Merge image areas?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          The two selected areas are contiguous and could be combined into a
          single image area. Do you want to merge them?
        </p>
        <ul className="mt-3 space-y-1 text-sm text-gray-700">
          <li>
            • <span className="font-medium">Area A:</span>{" "}
            {formatAreaCodesLabel(
              a.areaCodes?.length ? a.areaCodes : cellsToAreaCodes(a.cells),
              columnCount
            )}
          </li>
          <li>
            • <span className="font-medium">Area B:</span>{" "}
            {formatAreaCodesLabel(
              b.areaCodes?.length ? b.areaCodes : cellsToAreaCodes(b.cells),
              columnCount
            )}
          </li>
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onKeepSeparate}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            No, keep separate
          </button>
          <button
            type="button"
            onClick={onMerge}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Yes, merge
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Delete overlay image confirmation                                          */
/* -------------------------------------------------------------------------- */

type ArticleBuilderDeleteOverlayImageModalProps = {
  open: boolean;
  saving?: boolean;
  onCancel: () => void;
  /** Called with whether the user opted to delete the file from Mediateca too. */
  onConfirm: (alsoDeleteFromMediateca: boolean) => void;
};

export const ArticleBuilderDeleteOverlayImageModal: FC<
  ArticleBuilderDeleteOverlayImageModalProps
> = ({ open, saving = false, onCancel, onConfirm }) => {
  const [alsoDeleteFromMediateca, setAlsoDeleteFromMediateca] = useState(false);

  useEffect(() => {
    if (open) setAlsoDeleteFromMediateca(false);
  }, [open]);

  useEffect(() => {
    if (!open || saving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-builder-delete-overlay-image-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={saving ? undefined : onCancel}
        disabled={saving}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3
          id="article-builder-delete-overlay-image-title"
          className="text-base font-semibold text-gray-900"
        >
          Delete image?
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          This removes the floating image from the page. Body text will move up
          to fill the empty areas when possible.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={alsoDeleteFromMediateca}
            disabled={saving}
            onChange={(e) => setAlsoDeleteFromMediateca(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
          <span>¿Borrar también la imagen en la mediateca?</span>
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            No
          </button>
          <button
            type="button"
            onClick={() => onConfirm(alsoDeleteFromMediateca)}
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Deleting…" : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Per-area image picker modal                                                */
/* -------------------------------------------------------------------------- */

type ArticleBuilderImageAreaPickerModalProps = {
  open: boolean;
  drafts: AreaImageDraft[];
  columnCount: number;
  saving?: boolean;
  error?: string | null;
  /**
   * Optional drafts updater, used to support merging areas inside the modal
   * before picking images.
   */
  onUpdateDrafts?: (nextDrafts: AreaImageDraft[]) => void;
  /** Open the Mediateca for the given area id. */
  onOpenMediateca: (areaId: string) => void;
  /** Remove the currently selected image of an area (so it shows the picker again). */
  onClearAreaImage: (areaId: string) => void;
  onClose: () => void;
  onApply: () => void;
};

/**
 * Final step of the "Add images" flow: shows one card per selected area, each
 * with a Mediateca picker button. Once all (or any) areas have an image, the
 * Apply button persists them as `only_image` overlay chunks on the page.
 */
export const ArticleBuilderImageAreaPickerModal: FC<
  ArticleBuilderImageAreaPickerModalProps
> = ({
  open,
  drafts,
  columnCount,
  saving = false,
  error = null,
  onUpdateDrafts,
  onOpenMediateca,
  onClearAreaImage,
  onClose,
  onApply,
}) => {
  useEffect(() => {
    if (!open || saving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  if (!open) return null;

  const filledCount = drafts.filter((d) => !!d.imageUrl).length;

  const mergeSuggestions = (() => {
    const out: Array<{ aId: string; bId: string; mergedCodes: string[] }> = [];
    for (let i = 0; i < drafts.length; i++) {
      for (let j = i + 1; j < drafts.length; j++) {
        const a = drafts[i]!;
        const b = drafts[j]!;
        const aPlacement = areaCodesToPlacement(a.areaCodes, columnCount);
        const bPlacement = areaCodesToPlacement(b.areaCodes, columnCount);
        if (!aPlacement || !bPlacement) continue;

        const mergedPlacement: ImageAreaPlacement = {
          colStart: Math.min(aPlacement.colStart, bPlacement.colStart),
          colEnd: Math.max(aPlacement.colEnd, bPlacement.colEnd),
          rowStart: Math.min(aPlacement.rowStart, bPlacement.rowStart),
          rowEnd: Math.max(aPlacement.rowEnd, bPlacement.rowEnd),
        };

        // Only suggest merges that match the explicit user patterns:
        // - vertical stacking (same columns, consecutive rows)
        // - horizontal adjacency (same rows, consecutive columns)
        const sameCols =
          aPlacement.colStart === bPlacement.colStart && aPlacement.colEnd === bPlacement.colEnd;
        const sameRows =
          aPlacement.rowStart === bPlacement.rowStart && aPlacement.rowEnd === bPlacement.rowEnd;
        const verticallyConsecutive =
          sameCols &&
          (aPlacement.rowEnd + 1 === bPlacement.rowStart ||
            bPlacement.rowEnd + 1 === aPlacement.rowStart);
        const horizontallyConsecutive =
          sameRows &&
          (aPlacement.colEnd + 1 === bPlacement.colStart ||
            bPlacement.colEnd + 1 === aPlacement.colStart);
        if (!verticallyConsecutive && !horizontallyConsecutive) continue;

        // Build full rectangle codes for merged placement (ensures backend-valid footprint).
        const mergedCodes = normalizeAreaCodes(
          Array.from({ length: (mergedPlacement.colEnd - mergedPlacement.colStart + 1) *
            (mergedPlacement.rowEnd - mergedPlacement.rowStart + 1) })
            .map((_, k) => {
              const w = mergedPlacement.colEnd - mergedPlacement.colStart + 1;
              const dc = k % w;
              const dr = Math.floor(k / w);
              return cellToAreaCode(mergedPlacement.colStart + dc, mergedPlacement.rowStart + dr);
            })
            .filter((x): x is string => x != null)
        );

        // Ensure it's a valid rectangle in the current columnCount.
        if (!areaCodesToPlacement(mergedCodes, columnCount)) continue;

        // Avoid suggesting "merge" when one draft already fully contains the other.
        const aCoversMerged =
          aPlacement.colStart === mergedPlacement.colStart &&
          aPlacement.colEnd === mergedPlacement.colEnd &&
          aPlacement.rowStart === mergedPlacement.rowStart &&
          aPlacement.rowEnd === mergedPlacement.rowEnd;
        const bCoversMerged =
          bPlacement.colStart === mergedPlacement.colStart &&
          bPlacement.colEnd === mergedPlacement.colEnd &&
          bPlacement.rowStart === mergedPlacement.rowStart &&
          bPlacement.rowEnd === mergedPlacement.rowEnd;
        if (aCoversMerged || bCoversMerged) continue;
        out.push({ aId: a.id, bId: b.id, mergedCodes });
      }
    }
    // Stable ordering for UI
    return out.sort((x, y) => (x.aId + x.bId).localeCompare(y.aId + y.bId));
  })();

  const handleMergeDraftPair = (aId: string, bId: string) => {
    if (!onUpdateDrafts) return;
    const a = drafts.find((d) => d.id === aId);
    const b = drafts.find((d) => d.id === bId);
    if (!a || !b) return;
    const aPlacement = areaCodesToPlacement(a.areaCodes, columnCount);
    const bPlacement = areaCodesToPlacement(b.areaCodes, columnCount);
    if (!aPlacement || !bPlacement) return;

    const mergedPlacement: ImageAreaPlacement = {
      colStart: Math.min(aPlacement.colStart, bPlacement.colStart),
      colEnd: Math.max(aPlacement.colEnd, bPlacement.colEnd),
      rowStart: Math.min(aPlacement.rowStart, bPlacement.rowStart),
      rowEnd: Math.max(aPlacement.rowEnd, bPlacement.rowEnd),
    };
    const mergedCodes = normalizeAreaCodes(
      Array.from({ length: (mergedPlacement.colEnd - mergedPlacement.colStart + 1) *
        (mergedPlacement.rowEnd - mergedPlacement.rowStart + 1) })
        .map((_, k) => {
          const w = mergedPlacement.colEnd - mergedPlacement.colStart + 1;
          const dc = k % w;
          const dr = Math.floor(k / w);
          return cellToAreaCode(mergedPlacement.colStart + dc, mergedPlacement.rowStart + dr);
        })
        .filter((x): x is string => x != null)
    );
    if (!areaCodesToPlacement(mergedCodes, columnCount)) return;

    const mergedId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? (() => {
            try {
              return crypto.randomUUID();
            } catch {
              return `merged_${Date.now()}`;
            }
          })()
        : `merged_${Date.now()}`;

    const keepImage =
      a.imageUrl && b.imageUrl
        ? a.imageUrl === b.imageUrl
          ? { url: a.imageUrl, alt: a.imageAlt ?? b.imageAlt, name: a.mediaName ?? b.mediaName }
          : null
        : a.imageUrl
          ? { url: a.imageUrl, alt: a.imageAlt, name: a.mediaName }
          : b.imageUrl
            ? { url: b.imageUrl, alt: b.imageAlt, name: b.mediaName }
            : null;

    const merged: AreaImageDraft = {
      id: mergedId,
      areaCodes: mergedCodes,
      placement: mergedPlacement,
      imageUrl: keepImage?.url ?? null,
      imageAlt: keepImage?.alt ?? null,
      mediaName: keepImage?.name ?? null,
    };

    const next = drafts.filter((d) => d.id !== aId && d.id !== bId);
    onUpdateDrafts([...next, merged]);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-builder-image-area-picker-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h3
              id="article-builder-image-area-picker-title"
              className="text-base font-semibold text-gray-900"
            >
              Add images
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Pick an image for each selected area. The image will float on top
              of the article text inside that area.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {onUpdateDrafts && mergeSuggestions.length > 0 ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Suggested merge
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Some selected areas can be merged into a single bigger block (e.g. columns a–b across consecutive rows).
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {mergeSuggestions.slice(0, 5).map((s) => (
                  <div
                    key={`${s.aId}|${s.bId}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-white px-3 py-2"
                  >
                    <span className="text-xs text-amber-900">
                      Merge{" "}
                      <span className="font-semibold">
                        {formatAreaCodesLabel(
                          drafts.find((d) => d.id === s.aId)?.areaCodes ?? [],
                          columnCount
                        )}
                      </span>{" "}
                      +{" "}
                      <span className="font-semibold">
                        {formatAreaCodesLabel(
                          drafts.find((d) => d.id === s.bId)?.areaCodes ?? [],
                          columnCount
                        )}
                      </span>{" "}
                      →{" "}
                      <span className="font-semibold">
                        {formatAreaCodesLabel(s.mergedCodes, columnCount)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMergeDraftPair(s.aId, s.bId)}
                      disabled={saving}
                      className="rounded-md border border-amber-300 bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-50"
                    >
                      Merge blocks
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {drafts.map((d, idx) => {
              const hasImage = !!d.imageUrl;
              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-800">
                      Block {idx + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatAreaCodesLabel(d.areaCodes, columnCount)}
                    </span>
                  </div>
                  <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                    {hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.imageUrl!}
                        alt={d.imageAlt ?? d.mediaName ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenMediateca(d.id)}
                          disabled={saving}
                          className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Select image
                        </button>
                        <span className="text-xs text-gray-400">No image selected</span>
                      </div>
                    )}
                    {hasImage ? (
                      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-end p-2">
                        <button
                          type="button"
                          onClick={() => onOpenMediateca(d.id)}
                          disabled={saving}
                          className="pointer-events-auto rounded-md border border-blue-300 bg-white/95 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Change image
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {hasImage ? (
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xs text-gray-500">
                          {d.mediaName?.trim() ? d.mediaName : "Image selected"}
                        </span>
                        <button
                          type="button"
                          onClick={() => onClearAreaImage(d.id)}
                          disabled={saving}
                          className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:opacity-50"
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          {error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-200 px-5 py-3">
          <span className="text-xs text-gray-500">
            {filledCount}/{drafts.length} image{drafts.length === 1 ? "" : "s"}{" "}
            ready
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={saving || filledCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving
                ? "Applying…"
                : filledCount === drafts.length
                  ? "Apply images"
                  : `Apply ${filledCount} image${filledCount === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Image caption editor modal                                                 */
/* -------------------------------------------------------------------------- */

type ArticleBuilderUpdateImageCaptionModalProps = {
  open: boolean;
  currentCaption: string;
  saving?: boolean;
  onCancel: () => void;
  onApply: (nextCaption: string) => void;
};

export const ArticleBuilderUpdateImageCaptionModal: FC<
  ArticleBuilderUpdateImageCaptionModalProps
> = ({ open, currentCaption, saving = false, onCancel, onApply }) => {
  const [draftCaption, setDraftCaption] = useState(currentCaption);
  const isDirty = draftCaption !== currentCaption;

  useEffect(() => {
    if (open) setDraftCaption(currentCaption);
  }, [open, currentCaption]);

  useEffect(() => {
    if (!open || saving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, saving]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[85] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-builder-update-image-caption-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={saving ? undefined : onCancel}
        disabled={saving}
      />
      <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <h3
          id="article-builder-update-image-caption-title"
          className="text-base font-semibold text-gray-900"
        >
          Update caption
        </h3>
        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Current caption</span>
            <textarea
              readOnly
              value={currentCaption}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">New caption</span>
            <textarea
              value={draftCaption}
              disabled={saving}
              onChange={(e) => setDraftCaption(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply(draftCaption)}
            disabled={saving || !isDirty}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Applying…" : "Apply changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
