"use client";

import { FC } from "react";

export type CoverMarginArticleSelectModalProps = {
  open: boolean;
  position: number;
  onClose: () => void;
  onSelectPlaceholder: (position: number) => void;
};

export const CoverMarginArticleSelectModal: FC<CoverMarginArticleSelectModalProps> = ({
  open,
  position,
  onClose,
  onSelectPlaceholder,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-margin-article-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2
            id="cover-margin-article-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Select article from publication
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <p className="text-sm text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae neque vitae justo
            congue luctus. This placeholder will be replaced by the publication article selector.
          </p>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Target position</p>
            <p className="mt-1 font-mono text-sm text-gray-800">{position}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSelectPlaceholder(position)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Select placeholder article
          </button>
        </div>
      </div>
    </div>
  );
};
