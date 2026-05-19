"use client";

import React, { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { htmlToPlainText } from "@/app/logged/logged_components/RichTextEditor";
import type { ColumnOverflowPlan } from "./magazineChunkColumnOverflow";

export type PendingColumnOverflow = {
  chunkId: string;
  pendingHtml: string;
  plan: ColumnOverflowPlan;
};

type ArticleChunkColumnOverflowModalProps = {
  pending: PendingColumnOverflow | null;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

function previewPlain(html: string): string {
  const text = htmlToPlainText(html).trim();
  return text || "(empty)";
}

function SplitHalfPreview({ title, html }: { title: string; html: string }) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</p>
      <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm text-gray-900">
        {previewPlain(html)}
      </p>
    </div>
  );
}

export const ArticleChunkColumnOverflowModal: FC<ArticleChunkColumnOverflowModalProps> = ({
  pending,
  saving = false,
  error = null,
  onClose,
  onConfirm,
}) => {
  const open = pending != null;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || saving) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open || !pending || pending.plan.scope !== "inter_page") return null;

  const { plan } = pending;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chunk-column-overflow-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={saving ? undefined : onClose}
        disabled={saving}
      />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-amber-200 bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h3 id="chunk-column-overflow-title" className="text-base font-semibold text-gray-900">
            Last column overflow
          </h3>
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

        <p className="mt-2 text-sm text-gray-700">
          Article page {plan.sourceArticlePage} of {plan.totalArticlePages} has no room left in
          column {plan.lastColumnOnPage} (the last column on this page), because of chunk number{" "}
          {plan.sourceChunkNumber}. Review the split below, then confirm to move the overflow to
          the next article page.
        </p>

        <ol className="mt-4 space-y-4 text-sm text-gray-800">
          <li>
            <p className="font-medium text-gray-900">
              1. Split chunk {plan.sourceChunkNumber} on article page {plan.sourceArticlePage}
            </p>
            <p className="mt-1 text-gray-600">
              {plan.entireChunkOverflow ? (
                <>
                  Nothing from this chunk fits on the current page. The full chunk will move to
                  article page {plan.targetArticlePage}; the current chunk will be cleared on
                  confirm.
                </>
              ) : (
                <>
                  Everything up to (but not including) the overflowing paragraph stays on this page
                  and will replace chunk {plan.sourceChunkNumber}. The rest becomes a new chunk.
                </>
              )}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <SplitHalfPreview
                title={`Stays on this page (chunk ${plan.sourceChunkNumber})`}
                html={plan.splitKeptHtml}
              />
              <SplitHalfPreview title="Overflow portion (new chunk)" html={plan.splitOverflowHtml} />
            </div>
          </li>

          <li>
            <p className="font-medium text-gray-900">
              2. Place the overflow on article page {plan.targetArticlePage}
            </p>
            <p className="mt-1 text-gray-600">
              {plan.willAddArticlePage ? (
                <>
                  This article currently has {plan.totalArticlePages} page(s). Confirming will add
                  article page {plan.targetArticlePage}, then insert the overflow portion as chunk
                  1 on that page.
                </>
              ) : (
                <>
                  The overflow portion will be inserted as chunk 1 on article page{" "}
                  {plan.targetArticlePage}, before any content already there.
                </>
              )}
            </p>
          </li>

          <li>
            <p className="font-medium text-gray-900">
              3. Room on article page {plan.targetArticlePage}
            </p>
            {plan.targetPageChunkShifts.length > 0 ? (
              <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-medium text-gray-700">Existing chunks on that page</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-gray-800">
                  {plan.targetPageChunkShifts.map((shift) => (
                    <li key={`${shift.from}-${shift.to}-${shift.format}`}>
                      Chunk {shift.from} ({shift.format}) → chunk {shift.to}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {plan.willAddArticlePage ? (
              <p className="mt-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-950">
                A new empty page will be added; the overflow chunk will be its first content.
              </p>
            ) : plan.targetPageFitsOverflow ? (
              <p className="mt-2 rounded-md border border-green-100 bg-green-50 px-3 py-2 text-green-900">
                There appears to be enough column space for the overflow chunk without overflowing
                the last column again.
              </p>
            ) : (
              <p className="mt-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-amber-950">
                Article page {plan.targetArticlePage} may still overflow in its last column after
                the overflow chunk is added. You can split again afterward if needed.
              </p>
            )}
          </li>
        </ol>

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
            disabled={saving || plan.segments.length === 0}
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Applying…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
