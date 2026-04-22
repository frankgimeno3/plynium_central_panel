"use client";

import React, { FC, useEffect } from "react";

interface DeleteBannerModalProps {
  isOpen: boolean;
  bannerId?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteBannerModal: FC<DeleteBannerModalProps> = ({
  isOpen,
  bannerId,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onCancel();
      } else if (event.key === "Enter" && isOpen) {
        event.preventDefault();
        onConfirm();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onCancel}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">Delete banner</h2>

        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete this banner{bannerId ? ` (${bannerId})` : ""}?
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteBannerModal;

