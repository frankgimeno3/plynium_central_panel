"use client";

import { FC } from "react";

import { PublicationDbRow } from "../../_shared";

export type PublishMagazineModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  publication: PublicationDbRow;
};

export const PublishMagazineModal: FC<PublishMagazineModalProps> = ({
  open,
  onClose,
  title,
  publication,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-magazine-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2
            id="publish-magazine-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Publish magazine
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
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm text-gray-700">
            Review this publication before publishing the magazine issue.
          </p>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700">Magazine issue</p>
            <p className="mt-1 font-medium text-blue-950">{title}</p>
            <p className="mt-1 text-xs text-blue-800">
              Current status:{" "}
              <span className="font-semibold">{publication.publication_status || "—"}</span>
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Publishing logic can be connected here once the final publication workflow is confirmed.
          </p>
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
            onClick={onClose}
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900"
          >
            Publish magazine
          </button>
        </div>
      </div>
    </div>
  );
};
