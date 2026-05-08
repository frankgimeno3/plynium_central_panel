"use client";

import React, { FC, useState, useEffect } from "react";
import { updateMedia } from "@/app/service/mediatecaService";

export type RenameMediaItem = { id: string; name: string };

interface RenameMediaModalProps {
  open: boolean;
  onClose: () => void;
  item: RenameMediaItem | null;
  onSuccess: () => void;
}

const RenameMediaModal: FC<RenameMediaModalProps> = ({ open, onClose, item, onSuccess }) => {
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setNewName("");
    setError(null);
  }, [open, item?.id, item?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item?.id) return;
    const next = newName.trim();
    if (!next) return;
    setError(null);
    setLoading(true);
    try {
      await updateMedia(item.id, { contentName: next });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to rename.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[90] isolate flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-[91] mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Rename media"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Rename media</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">CONTENT NAME</label>
            <input
              type="text"
              readOnly
              value={item.name}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">NEW NAME</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Required — new file name in mediateca"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newName.trim() || loading}
              className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameMediaModal;
