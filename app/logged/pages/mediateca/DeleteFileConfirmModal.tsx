"use client";

import React, { FC, useState } from "react";
import { deleteMedia } from "@/app/service/mediatecaService";

interface DeleteFileConfirmModalProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  onSuccess: () => void;
}

const DeleteFileConfirmModal: FC<DeleteFileConfirmModalProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await deleteMedia(fileId);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to delete file.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete file</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to delete <strong>{fileName}</strong>? This cannot be undone.
        </p>
        {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFileConfirmModal;
