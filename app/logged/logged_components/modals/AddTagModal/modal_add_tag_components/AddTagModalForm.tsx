"use client";

import React from "react";

interface Props {
  currentValue: string;
  initialValueTrimmedBasis: string;
  onChangeValue: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function AddTagModalForm({
  currentValue,
  initialValueTrimmedBasis,
  onChangeValue,
  onCancel,
  onSave,
}: Props) {
  const trimmedValue = currentValue.trim();
  const hasChanged = trimmedValue !== initialValueTrimmedBasis && trimmedValue !== "";

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">Add tag</h2>

        <label className="mb-2 block text-sm font-medium text-gray-700">Tag name</label>
        <input
          type="text"
          className="mb-4 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={currentValue}
          onChange={(event) => onChangeValue(event.target.value)}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!hasChanged}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white
              ${hasChanged ? "cursor-pointer bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-blue-300"}`}
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
