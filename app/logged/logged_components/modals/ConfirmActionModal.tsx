"use client";

import React, { FC, useEffect } from "react";

export default function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl disabled:opacity-50"
          onClick={() => (confirming ? null : onClose())}
          aria-label="Close"
          disabled={confirming}
        >
          ×
        </button>

        <h2 className="mb-2 text-xl font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            onClick={onClose}
            disabled={confirming}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

