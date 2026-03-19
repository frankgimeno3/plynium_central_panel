"use client";

import React, { FC, useState, useEffect } from "react";
import { getFolderByPath, updateFolder } from "@/app/service/mediatecaService";

export type EditSubfolderResult = { newPath: string };

interface EditSubfolderModalProps {
  open: boolean;
  onClose: () => void;
  folderPath: string;
  folderName: string;
  onSuccess: (result: EditSubfolderResult) => void;
}

const EditSubfolderModal: FC<EditSubfolderModalProps> = ({
  open,
  onClose,
  folderPath,
  folderName,
  onSuccess,
}) => {
  const [folderId, setFolderId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [loadingFolder, setLoadingFolder] = useState(false);
  const [renameLoading, setRenameLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentPath = folderPath ? folderPath.split("/").slice(0, -1).join("/") : "";
  const newPath = name.trim() ? (parentPath ? `${parentPath}/${name.trim()}` : name.trim()) : "";

  useEffect(() => {
    if (open && folderPath) {
      setFolderId(null);
      setName(folderName);
      setError(null);
      setLoadingFolder(true);
      getFolderByPath(folderPath)
        .then((folder) => {
          if (folder) {
            setFolderId(folder.id);
            setName(folder.name);
          } else {
            setError("Folder not found");
          }
        })
        .catch(() => setError("Failed to load folder"))
        .finally(() => setLoadingFolder(false));
    }
  }, [open, folderPath, folderName]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderId || !name.trim()) return;
    setError(null);
    setRenameLoading(true);
    try {
      const updated = await updateFolder(folderId, { name: name.trim() });
      onClose();
      onSuccess({ newPath: updated.path });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to rename folder.";
      setError(message);
    } finally {
      setRenameLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit subfolder</h3>

        {loadingFolder ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : !folderId ? (
          <p className="text-sm text-red-600">{error || "Folder not found"}</p>
        ) : (
          <form onSubmit={handleRename} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Folder name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New path</label>
              <input
                type="text"
                readOnly
                value={newPath}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={renameLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || renameLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {renameLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditSubfolderModal;
