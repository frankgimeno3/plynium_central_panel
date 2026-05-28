"use client";

import React, { FC } from "react";

export const ChunkSelectionCheckbox: FC<{
  checked: boolean;
  onToggle: () => void;
  ariaLabel?: string;
}> = ({ checked, onToggle, ariaLabel = "Select this chunk for deletion" }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    title={ariaLabel}
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    onMouseDown={(e) => {
      e.preventDefault();
    }}
    className={`pointer-events-auto absolute right-2 top-2 z-30 inline-flex h-7 w-7 items-center justify-center rounded-md border-2 shadow-md transition ${
      checked
        ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
        : "border-gray-400 bg-white text-transparent hover:border-red-400 hover:text-red-300"
    }`}
  >
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M16.704 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.79-6.793a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  </button>
);
