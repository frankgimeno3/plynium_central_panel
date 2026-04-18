"use client";

import React, { FC, useEffect, useState } from "react";
import apiClient from "@/app/apiClient";

type DeleteNewsletterUserListConfirmModalProps = {
  open: boolean;
  onClose: () => void;
  /** newsletter_user_list_id (UUID) */
  listId: string;
  listName: string;
  /** Called after successful DELETE (e.g. redirect). */
  onDeleted: () => void;
};

const CONFIRM_WORD = "confirm";

const DeleteNewsletterUserListConfirmModal: FC<DeleteNewsletterUserListConfirmModalProps> = ({
  open,
  onClose,
  listId,
  listName,
  onDeleted,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmInput("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const canDelete = confirmInput === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.delete(`/api/v1/user-lists/${encodeURIComponent(listId)}`);
      onClose();
      onDeleted();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Could not delete this list.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-list-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 id="delete-list-title" className="text-lg font-semibold text-red-700">
            Delete list
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-4 py-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to permanently delete this sending list? This cannot be undone.
          </p>
          <p className="text-sm font-medium text-gray-900">
            List: <span className="font-normal text-gray-600">{listName || listId}</span>
          </p>
          <div>
            <label htmlFor="delete-list-confirm-input" className="mb-1 block text-xs font-medium text-gray-600">
              Type <span className="font-mono font-semibold text-gray-900">{CONFIRM_WORD}</span> to enable Delete
            </label>
            <input
              id="delete-list-confirm-input"
              type="text"
              autoComplete="off"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
              placeholder={CONFIRM_WORD}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canDelete || busy}
              onClick={() => void handleDelete()}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteNewsletterUserListConfirmModal;
