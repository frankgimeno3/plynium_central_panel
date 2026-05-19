"use client";

import { FC, useMemo } from "react";

import {
  PublicationDbRow,
  SlotRow,
  flatplanArticleSlotPublishBlockers,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type PublishMagazineModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  publication: PublicationDbRow;
  slots: SlotRow[];
};

export const PublishMagazineModal: FC<PublishMagazineModalProps> = ({
  open,
  onClose,
  title,
  publication,
  slots,
}) => {
  const publishBlockers = useMemo(() => flatplanArticleSlotPublishBlockers(slots), [slots]);
  const canPublish = publishBlockers.length === 0;

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
        className="w-full max-w-xl mx-4 max-h-[90vh] overflow-hidden rounded-xl bg-white shadow-xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
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
        <div className="space-y-3 px-6 py-5 overflow-y-auto">
          <p className="text-sm text-gray-700">
            Review this publication before publishing the magazine issue. Every{" "}
            <strong>article</strong> page in the flatplan must be linked to a publication article
            whose workflow state is <strong>finished approved</strong> (set in Article Builder).
          </p>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs uppercase tracking-wide text-blue-700">Magazine issue</p>
            <p className="mt-1 font-medium text-blue-950">{title}</p>
            <p className="mt-1 text-xs text-blue-800">
              Current status:{" "}
              <span className="font-semibold">{publication.publication_status || "—"}</span>
            </p>
          </div>
          {canPublish ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              All article slots in the flatplan are <strong>finished approved</strong>. You may
              proceed when the backend publish action is wired.
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <p className="font-semibold text-amber-900">Cannot publish yet</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950/95">
                {publishBlockers.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-gray-500">
            The publish button stays disabled until the workflow gate above is satisfied.
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
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
            disabled={!canPublish}
            title={
              !canPublish
                ? "Resolve every blocker above (article workflow states and slot assignments)."
                : undefined
            }
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publish magazine
          </button>
        </div>
      </div>
    </div>
  );
};
