"use client";

import React from "react";
import type { DeletePublicationModalProps } from "./types";

type Props = Pick<DeletePublicationModalProps, "publicationName" | "onConfirm" | "onCancel">;

export function DeletePublicationModalBody({
  publicationName,
  onConfirm,
  onCancel,
}: Props) {
  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      onClick={handleModalClick}
    >
      <button
        type="button"
        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
        onClick={onCancel}
        aria-label="Close modal"
      >
        ×
      </button>

      <h2 className="mb-4 text-xl font-semibold text-gray-800">
        Are you sure you want to delete this publication?
      </h2>

      <p className="mb-6 text-sm text-gray-600">
        The publication <strong>&quot;{publicationName}&quot;</strong> will be permanently deleted. This action cannot be undone.
      </p>

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
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
