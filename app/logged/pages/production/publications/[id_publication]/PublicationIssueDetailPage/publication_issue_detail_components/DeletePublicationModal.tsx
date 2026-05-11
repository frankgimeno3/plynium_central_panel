"use client";

import { FC } from "react";

export const DELETE_CONFIRM_WORD = "confirm";

export type DeletePublicationModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  publicationId: string;
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  canDelete: boolean;
};

export const DeletePublicationModal: FC<DeletePublicationModalProps> = ({
  open,
  onClose,
  title,
  publicationId,
  confirmInput,
  onConfirmInputChange,
  canDelete,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-publication-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2
            id="delete-publication-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            Delete publication
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
          <p className="text-sm text-gray-700">You are about to delete this publication.</p>
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-xs uppercase tracking-wide text-red-700">Publication</p>
            <p className="mt-1 font-medium text-red-950">{title}</p>
            <p className="mt-1 font-mono text-xs text-red-800 break-all">{publicationId}</p>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Type <span className="font-mono text-gray-900">{DELETE_CONFIRM_WORD}</span> to enable
            deletion
            <input
              type="text"
              autoComplete="off"
              value={confirmInput}
              onChange={(event) => onConfirmInputChange(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={DELETE_CONFIRM_WORD}
            />
          </label>
          <p className="text-xs text-gray-500">
            Deletion logic can be connected here once the final deletion rules are confirmed.
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
            disabled={!canDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete publication
          </button>
        </div>
      </div>
    </div>
  );
};
