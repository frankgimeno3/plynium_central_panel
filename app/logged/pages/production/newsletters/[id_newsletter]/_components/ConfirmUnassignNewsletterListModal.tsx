"use client";

import React, { useEffect } from "react";

type ConfirmUnassignNewsletterListModalProps = {
  open: boolean;
  listName: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmUnassignNewsletterListModal({
  open,
  listName,
  onClose,
  onConfirm,
}: ConfirmUnassignNewsletterListModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900">Are you sure?</h3>
        <p className="mt-3 text-sm text-gray-600">
          Unassign <span className="font-medium text-gray-900">{listName}</span> from this newsletter? The list itself
          will not be deleted.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            Unassign
          </button>
        </div>
      </div>
    </div>
  );
}
