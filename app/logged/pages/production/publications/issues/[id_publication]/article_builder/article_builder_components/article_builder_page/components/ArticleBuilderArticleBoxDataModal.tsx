"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { ArticleBoxPlacementStrategy } from "../articleBoxPlacement";
import type { PublicationArticleRow } from "../types";

type BoxDraft = {
  box_company_name: string;
  box_company_direction: string;
  box_company_city: string;
  box_company_email: string;
  box_company_phone: string;
  box_company_web: string;
};

export type ArticleBoxSavePayload = {
  has_article_box: true;
  placement: ArticleBoxPlacementStrategy;
  box_company_name: string;
  box_company_direction?: string;
  box_company_city?: string;
  box_company_email?: string;
  box_company_phone?: string;
  box_company_web?: string;
};

function toStr(v: unknown) {
  return v == null ? "" : String(v);
}

function initialDraftFromArticle(article: PublicationArticleRow): BoxDraft {
  return {
    box_company_name: toStr(article.box_company_name),
    box_company_direction: toStr(article.box_company_direction),
    box_company_city: toStr(article.box_company_city),
    box_company_email: toStr(article.box_company_email),
    box_company_phone: toStr(article.box_company_phone),
    box_company_web: toStr(article.box_company_web),
  };
}

function isValidEmail(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function draftsEqual(a: BoxDraft, b: BoxDraft): boolean {
  return (
    a.box_company_name === b.box_company_name &&
    a.box_company_direction === b.box_company_direction &&
    a.box_company_city === b.box_company_city &&
    a.box_company_email === b.box_company_email &&
    a.box_company_phone === b.box_company_phone &&
    a.box_company_web === b.box_company_web
  );
}

export function ArticleBuilderArticleBoxDataModal({
  open,
  isEdit,
  targetAreaLabel,
  lastPageNumber,
  previousPageNumber,
  canMoveToPreviousPage,
  collisionOccupied,
  placement,
  onPlacementChange,
  publicationArticle,
  saving,
  error,
  onClose,
  onSave,
}: {
  open: boolean;
  isEdit: boolean;
  targetAreaLabel: string;
  lastPageNumber: number;
  previousPageNumber: number | null;
  canMoveToPreviousPage: boolean;
  collisionOccupied: boolean;
  placement: ArticleBoxPlacementStrategy;
  onPlacementChange: (next: ArticleBoxPlacementStrategy) => void;
  publicationArticle: PublicationArticleRow;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: ArticleBoxSavePayload) => void;
}) {
  const initial = useMemo(
    () => initialDraftFromArticle(publicationArticle),
    [publicationArticle]
  );
  const [draft, setDraft] = useState<BoxDraft>(initial);
  const [touched, setTouched] = useState(false);
  const [initialPlacement, setInitialPlacement] = useState<ArticleBoxPlacementStrategy>(
    isEdit ? "keep_current" : "use_last_page"
  );

  useEffect(() => {
    if (!open) return;
    setDraft(initialDraftFromArticle(publicationArticle));
    setTouched(false);
    const nextInitialPlacement: ArticleBoxPlacementStrategy = isEdit
      ? "keep_current"
      : collisionOccupied
        ? "new_page"
        : "use_last_page";
    setInitialPlacement(nextInitialPlacement);
    onPlacementChange(nextInitialPlacement);
  }, [
    collisionOccupied,
    isEdit,
    onPlacementChange,
    open,
    publicationArticle.publication_article_id,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const nameMissing = !draft.box_company_name.trim();
  const emailValid = isValidEmail(draft.box_company_email);
  const fieldsChanged = !draftsEqual(draft, initial);
  const placementChanged = placement !== initialPlacement;
  const hasChanges = fieldsChanged || placementChanged;

  const placementResolved: ArticleBoxPlacementStrategy = isEdit
    ? placement === "move_to_previous_page"
      ? "move_to_previous_page"
      : "keep_current"
    : collisionOccupied
      ? placement === "use_last_page"
        ? "new_page"
        : placement
      : "use_last_page";

  return open ? (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-box-data-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 id="article-box-data-title" className="text-lg font-semibold text-gray-900">
            {isEdit ? "Edit Box Data" : "Add Box Data"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
              {isEdit ? (
                <>
                  <p className="font-medium text-gray-900">Update box location</p>
                  <div className="mt-2 space-y-3">
                    <p>
                      The box is on page{" "}
                      <span className="font-semibold">{lastPageNumber}</span> (
                      <span className="font-semibold">{targetAreaLabel}</span>).
                    </p>
                    <label className="flex cursor-pointer items-start gap-2">
                      <input
                        type="radio"
                        name="article-box-placement"
                        className="mt-1"
                        checked={placementResolved === "keep_current"}
                        onChange={() => onPlacementChange("keep_current")}
                      />
                      <span>Keep current page</span>
                    </label>
                    <label
                      className={`flex items-start gap-2 ${
                        canMoveToPreviousPage ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                      }`}
                    >
                      <input
                        type="radio"
                        name="article-box-placement"
                        className="mt-1"
                        disabled={!canMoveToPreviousPage}
                        checked={placementResolved === "move_to_previous_page"}
                        onChange={() => onPlacementChange("move_to_previous_page")}
                      />
                      <span>
                        Update to previous page
                        {previousPageNumber != null ? (
                          <>
                            {" "}
                            (page <span className="font-semibold">{previousPageNumber}</span>)
                          </>
                        ) : null}
                        {canMoveToPreviousPage ? (
                          <>
                            . Content in cell{" "}
                            <span className="font-semibold">{targetAreaLabel}</span> on that page
                            will be removed.
                          </>
                        ) : (
                          ". Not available — the article has only one page."
                        )}
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-medium text-gray-900">Placement check</p>
                  {!collisionOccupied ? (
                    <p className="mt-1">
                      Cell <span className="font-semibold">{targetAreaLabel}</span> on page{" "}
                      <span className="font-semibold">{lastPageNumber}</span> is empty. The box will
                      be added to <span className="font-semibold">{targetAreaLabel}</span> on the
                      current last page.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-3">
                      <p>
                        Cell <span className="font-semibold">{targetAreaLabel}</span> on page{" "}
                        <span className="font-semibold">{lastPageNumber}</span> already has content.
                        Choose how to place the box:
                      </p>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          name="article-box-placement"
                          className="mt-1"
                          checked={placementResolved === "new_page"}
                          onChange={() => onPlacementChange("new_page")}
                        />
                        <span>
                          Create a new page and add the box to{" "}
                          <span className="font-semibold">{targetAreaLabel}</span> on that page.
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          name="article-box-placement"
                          className="mt-1"
                          checked={placementResolved === "replace_on_last_page"}
                          onChange={() => onPlacementChange("replace_on_last_page")}
                        />
                        <span>
                          Place the box in <span className="font-semibold">{targetAreaLabel}</span>{" "}
                          on page <span className="font-semibold">{lastPageNumber}</span>, removing
                          the current content in that cell.
                        </span>
                      </label>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-sm text-gray-700">
              Optional fields for the company box rendered at the end of the article.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Company name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={draft.box_company_name}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_name: e.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Company name"
                />
                {touched && nameMissing ? (
                  <p className="mt-1 text-xs text-red-600">Company name is required.</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Direction
                </label>
                <input
                  type="text"
                  value={draft.box_company_direction}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_direction: e.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Direction"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">City</label>
                <input
                  type="text"
                  value={draft.box_company_city}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_city: e.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
                <input
                  type="email"
                  value={draft.box_company_email}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_email: e.target.value }));
                  }}
                  className={[
                    "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2",
                    touched && !emailValid
                      ? "border-red-400 focus:ring-red-500/40"
                      : "border-gray-300 focus:ring-indigo-500/40",
                  ].join(" ")}
                  placeholder="Email"
                />
                {touched && !emailValid ? (
                  <p className="mt-1 text-xs text-red-600">Invalid email address.</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
                <input
                  type="text"
                  value={draft.box_company_phone}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_phone: e.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Phone"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Web</label>
                <input
                  type="text"
                  value={draft.box_company_web}
                  onChange={(e) => {
                    setTouched(true);
                    setDraft((d) => ({ ...d, box_company_web: e.target.value }));
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  placeholder="Web"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t bg-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-[36px] items-center rounded-md bg-white px-3 py-2 text-sm font-medium uppercase text-gray-800 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              saving || nameMissing || !emailValid || (isEdit ? !hasChanges : false)
            }
            onClick={() => {
              setTouched(true);
              if (nameMissing || !emailValid) return;
              if (isEdit && !hasChanges) return;
              onSave({
                has_article_box: true,
                placement: placementResolved,
                box_company_name: draft.box_company_name.trim(),
                box_company_direction: draft.box_company_direction.trim() || undefined,
                box_company_city: draft.box_company_city.trim() || undefined,
                box_company_email: draft.box_company_email.trim() || undefined,
                box_company_phone: draft.box_company_phone.trim() || undefined,
                box_company_web: draft.box_company_web.trim() || undefined,
              });
            }}
            className="flex min-h-[36px] items-center rounded-md bg-blue-950/90 px-3 py-2 text-sm font-medium uppercase text-white transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Edit" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
