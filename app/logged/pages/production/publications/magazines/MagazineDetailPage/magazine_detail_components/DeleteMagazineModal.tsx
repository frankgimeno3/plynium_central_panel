"use client";

import React, { FC } from "react";
import { DELETE_CONFIRM_WORD } from "./constants";

type Props = {
  open: boolean;
  magazineName: string | undefined;
  deleteConfirmInput: string;
  deleteSubmitting: boolean;
  deleteError: string | null;
  canSubmitDelete: boolean;
  onConfirmInputChange: (value: string) => void;
  onClose: () => void;
  onConfirmDelete: () => void | Promise<void>;
};

export const DeleteMagazineModal: FC<Props> = ({
  open,
  magazineName,
  deleteConfirmInput,
  deleteSubmitting,
  deleteError,
  canSubmitDelete,
  onConfirmInputChange,
  onClose,
  onConfirmDelete,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-magazine-title">
      <div className="max-w-lg w-full rounded-xl bg-white p-6 shadow-xl">
        <h3 id="delete-magazine-title" className="text-base font-semibold text-gray-900">
          Delete this magazine?
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          This will permanently delete <span className="font-medium text-gray-800">{magazineName}</span> and all related data,
          including:
        </p>
        <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>All publications for this magazine</li>
          <li>
            Publication slots and slot content (<code className="text-xs">publication_slot_content</code>)
          </li>
          <li>
            Portal links in <code className="text-xs">magazine_portals</code>
          </li>
        </ul>
        <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Related sales offers on preferential pages may also be removed if they point at these publications or slots.
        </p>
        <label htmlFor="delete-magazine-confirm-input" className="mt-4 block text-sm font-medium text-gray-700">
          Type <span className="font-mono text-gray-900">{DELETE_CONFIRM_WORD}</span> to enable deletion
          <input
            id="delete-magazine-confirm-input"
            type="text"
            autoComplete="off"
            value={deleteConfirmInput}
            onChange={(e) => onConfirmInputChange(e.target.value)}
            disabled={deleteSubmitting}
            className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={DELETE_CONFIRM_WORD}
          />
        </label>
        {deleteError && <p className="mt-2 text-sm text-red-600">{deleteError}</p>}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button type="button" onClick={onClose} disabled={deleteSubmitting} className="rounded-md px-4 py-2 text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void onConfirmDelete()}
            disabled={!canSubmitDelete}
            className="rounded-md px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteSubmitting ? "Deleting…" : "Delete magazine permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};
