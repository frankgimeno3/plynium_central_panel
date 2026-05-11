"use client";

import React, { FC } from "react";

type PublicationSlotPickerFooterProps = {
  selectedCount: number;
  confirmLabel: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const PublicationSlotPickerFooter: FC<PublicationSlotPickerFooterProps> = ({
  selectedCount,
  confirmLabel,
  submitting,
  onClose,
  onConfirm,
}) => (
  <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
    <span className="mr-auto text-xs text-gray-500">
      {selectedCount === 0
        ? "No slots selected."
        : `${selectedCount} slot${selectedCount === 1 ? "" : "s"} selected.`}
    </span>
    <button
      type="button"
      onClick={onClose}
      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      disabled={submitting}
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onConfirm}
      disabled={selectedCount === 0 || submitting}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {submitting ? "Saving…" : confirmLabel}
    </button>
  </div>
);

export default PublicationSlotPickerFooter;
