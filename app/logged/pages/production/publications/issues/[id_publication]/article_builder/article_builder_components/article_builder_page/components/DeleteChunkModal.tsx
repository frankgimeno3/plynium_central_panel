"use client";

import React, { FC, useEffect } from "react";
import { isTitleOrSubtitleChunkFormat } from "../chunkUtils";
import type { PublicationArticleChunk } from "../types";

type DeleteChunkModalProps = {
  chunk: PublicationArticleChunk | null;
  busyChunkId: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteChunkModal: FC<DeleteChunkModalProps> = ({
  chunk,
  busyChunkId,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!chunk) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chunk, onClose]);

  if (!chunk) return null;

  const deleting = busyChunkId === chunk.publication_article_chunk_id;
  const locked = isTitleOrSubtitleChunkFormat(chunk.publication_article_chunk_format);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/60" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chunk-modal-title"
        className="relative z-[101] w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="delete-chunk-modal-title" className="text-base font-semibold text-white">
            Delete chunk?
          </h2>
          <button
            type="button"
            aria-label="Close"
            className="rounded p-1 text-2xl leading-none text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          This cannot be undone. Position {chunk.chunk_position} (
          <span className="font-mono text-xs">{chunk.publication_article_chunk_format}</span>
          ).
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-500 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onConfirm}
            disabled={locked || deleting}
          >
            {deleting ? "Deleting…" : "Delete chunk"}
          </button>
        </div>
      </div>
    </div>
  );
};
