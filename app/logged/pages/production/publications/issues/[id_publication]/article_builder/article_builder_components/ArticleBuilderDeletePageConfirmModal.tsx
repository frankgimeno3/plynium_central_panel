"use client";

import React, { FC, useEffect } from "react";

type ArticleBuilderDeletePageConfirmModalProps = {
  open: boolean;
  articlePageNumber: number;
  totalPages: number;
  chunkCount: number;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const ArticleBuilderDeletePageConfirmModal: FC<
  ArticleBuilderDeletePageConfirmModalProps
> = ({
  open,
  articlePageNumber,
  totalPages,
  chunkCount,
  saving = false,
  error = null,
  onClose,
  onConfirm,
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-builder-delete-page-confirm-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3
            id="article-builder-delete-page-confirm-title"
            className="text-base font-semibold text-gray-900"
          >
            Delete page {articlePageNumber} of {totalPages}?
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="shrink-0 rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="mt-2 space-y-2 text-sm text-gray-600">
          <p>
            The publication slot will be removed from this article and destroyed
            from the database.
          </p>
          {chunkCount > 0 ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-medium text-amber-800">
              This will also permanently delete{" "}
              <strong>
                {chunkCount} content chunk{chunkCount === 1 ? "" : "s"}
              </strong>{" "}
              attached to this page. This cannot be undone.
            </p>
          ) : (
            <p>This page has no content chunks attached.</p>
          )}
        </div>
        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
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
            onClick={onConfirm}
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Deleting…" : "Delete page"}
          </button>
        </div>
      </div>
    </div>
  );
};
