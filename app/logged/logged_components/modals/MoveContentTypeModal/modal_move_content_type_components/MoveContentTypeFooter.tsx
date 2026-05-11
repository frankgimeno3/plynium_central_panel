"use client";

import React, { FC } from "react";

type MoveContentTypeFooterProps = {
  submitting: boolean;
  canConfirm: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const MoveContentTypeFooter: FC<MoveContentTypeFooterProps> = ({
  submitting,
  canConfirm,
  onClose,
  onConfirm,
}) => (
  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
    <button
      type="button"
      onClick={onClose}
      className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      disabled={submitting}
    >
      Cancel
    </button>
    <button
      type="button"
      onClick={onConfirm}
      className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={!canConfirm}
    >
      {submitting ? "Saving…" : "Confirm"}
    </button>
  </div>
);

export default MoveContentTypeFooter;
