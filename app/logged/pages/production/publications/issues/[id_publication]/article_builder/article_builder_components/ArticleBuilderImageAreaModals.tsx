"use client";

import React, { FC, useEffect, useState } from "react";
import {
  cellsToAreaCodes,
  formatAreaCodesLabel,
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
                  <div className="flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                    {hasImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={d.imageUrl!}
                        alt={d.imageAlt ?? d.mediaName ?? ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="px-2 text-center text-xs text-gray-400">
                        No image selected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenMediateca(d.id)}
                      disabled={saving}
                      className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {hasImage ? "Change image" : "Select image"}
                    </button>
                    {hasImage ? (
                      <button
                        type="button"
                        onClick={() => onClearAreaImage(d.id)}
                        disabled={saving}
                        className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline disabled:opacity-50"
                      >
                        Clear
                      </button>
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
