"use client";

import React, { FC, useEffect } from "react";

type ArticleBuilderEmptyPageDeleteConfirmModalProps = {
  open: boolean;
  /** 1-based article page index (e.g. "Article page 2"). */
  pageIndex: number;
  /** `publication_slots_db.publication_slot_id` for the target page. */
  slotId: number;
  /** Total page count *before* deletion (just for context in the message). */
  totalPages: number;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Confirmation modal for deleting an empty article page. Lists every record that
 * the server will touch so the operator knows exactly what will be affected
 * before they confirm.
 *
 * Affected database objects (mirroring `removeEmptyPublicationArticlePage` in
 * `PublicationArticleService.js`):
 *  - `publication_slots_db`: the slot row for this page is destroyed (only when
 *    it is a `regular_page` with no `project_id`; otherwise it is simply
 *    unlinked from this article, which the server enforces defensively).
 *  - `publication_articles.publication_slots_id_array`: the slot id is removed.
 *  - `publication_articles.desired_page_count`: decremented by 1.
 *  - Mediateca: the `articles media/<articleId>/slot_<slotId>` folder is
 *    deleted (DB + S3) when the slot row is destroyed.
 */
export const ArticleBuilderEmptyPageDeleteConfirmModal: FC<
  ArticleBuilderEmptyPageDeleteConfirmModalProps
> = ({
  open,
  pageIndex,
  slotId,
  totalPages,
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
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-empty-page-delete-title"
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
            id="article-empty-page-delete-title"
            className="text-base font-semibold text-gray-900"
          >
            Eliminar página vacía del artículo
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

        <p className="mt-2 text-sm text-gray-700">
          Vas a eliminar la <strong>página {pageIndex} de {totalPages}</strong> de este
          artículo (slot <code className="font-mono text-xs">{slotId}</code>). La
          página está vacía, pero esta acción afecta a varias tablas relacionadas.
        </p>

        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-semibold">Registros afectados</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              <code className="font-mono">publication_slots_db</code>: se borra la
              fila del slot <code className="font-mono">{slotId}</code> (sólo si es
              <code className="font-mono"> slot_key=&apos;regular_page&apos;</code> y
              no tiene <code className="font-mono">project_id</code>; en caso
              contrario, se desvincula del artículo sin borrarse).
            </li>
            <li>
              <code className="font-mono">publication_articles.publication_slots_id_array</code>:
              se elimina el id del slot del array.
            </li>
            <li>
              <code className="font-mono">publication_articles.desired_page_count</code>:
              decrementado en 1 ({totalPages} → {Math.max(1, totalPages - 1)}).
            </li>
            <li>
              Mediateca: se elimina la carpeta{" "}
              <code className="font-mono">articles media/&lt;article_id&gt;/slot_{slotId}</code>
              {" "}(DB <code className="font-mono">folders</code> + S3).
            </li>
            <li>
              Se relanza la regeneración del índice / resumen de la publicación.
            </li>
          </ul>
        </div>

        <p className="mt-3 text-xs text-gray-600">
          La acción no se puede deshacer. Si la página no estuviera realmente vacía,
          el servidor rechazará la operación.
        </p>

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
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "Eliminando…" : "Eliminar página"}
          </button>
        </div>
      </div>
    </div>
  );
};
