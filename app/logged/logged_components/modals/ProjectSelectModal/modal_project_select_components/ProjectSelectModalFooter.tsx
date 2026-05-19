"use client";

import React, { FC } from "react";

type ProjectSelectModalFooterProps = {
  confirmLabel: string;
  canConfirm: boolean;
  onClose: () => void;
  onConfirm: () => void;
  backLabel?: string;
  onBack?: () => void;
};

const ProjectSelectModalFooter: FC<ProjectSelectModalFooterProps> = ({
  confirmLabel,
  canConfirm,
  onClose,
  onConfirm,
  backLabel = "Back",
  onBack,
}) => (
  <div
    className={`flex items-center gap-2 pt-2 border-t border-gray-200 ${
      onBack ? "justify-between" : "justify-end"
    }`}
  >
    {onBack ? (
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
      >
        {backLabel}
      </button>
    ) : null}
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!canConfirm}
        className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-900"
      >
        {confirmLabel}
      </button>
    </div>
  </div>
);

export default ProjectSelectModalFooter;
