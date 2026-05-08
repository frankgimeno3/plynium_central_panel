"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { getFolders, updateMedia } from "@/app/service/mediatecaService";

type MediatecaFolder = { id: string; name: string; path: string };

function formatFolderLabel(segment: string): string {
  if (!segment) return "Mediateca";
  return segment.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCurrentFolderName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Mediateca";
  return pathSegments[pathSegments.length - 1];
}

interface ChangeFolderMediaModalProps {
  open: boolean;
  onClose: () => void;
  mediaId: string;
  /** Folder path where the file currently lives (from mediateca API). */
  fileFolderPath: string;
  onSuccess: () => void;
}

const ChangeFolderMediaModal: FC<ChangeFolderMediaModalProps> = ({
  open,
  onClose,
  mediaId,
  fileFolderPath,
  onSuccess,
}) => {
  const [browseSegments, setBrowseSegments] = useState<string[]>([]);
  const [subfolders, setSubfolders] = useState<MediatecaFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDestinationPath, setSelectedDestinationPath] = useState<string | null>(null);
  const [confirmNewFolder, setConfirmNewFolder] = useState(false);
  const [saving, setSaving] = useState(false);

  const browsePath = browseSegments.join("/");
  const folderName = useMemo(() => getCurrentFolderName(browseSegments), [browseSegments]);

  useEffect(() => {
    if (!open) return;
    const seg = fileFolderPath ? fileFolderPath.split("/").filter(Boolean) : [];
    setBrowseSegments(seg);
    setSelectedDestinationPath(null);
    setConfirmNewFolder(false);
    setError(null);
  }, [open, fileFolderPath]);

  const loadSubfolders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getFolders(browsePath);
      setSubfolders(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to load folders.";
      setError(message);
      setSubfolders([]);
    } finally {
      setLoading(false);
    }
  }, [browsePath]);

  useEffect(() => {
    if (!open) return;
    void loadSubfolders();
  }, [open, loadSubfolders]);

  const handleConfirmMove = async () => {
    if (!mediaId || !selectedDestinationPath || !confirmNewFolder) return;
    setSaving(true);
    setError(null);
    try {
      await updateMedia(mediaId, { folderPath: selectedDestinationPath });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Failed to move file.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] isolate flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        className="relative z-[91] flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-folder-modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 id="change-folder-modal-title" className="text-lg font-semibold text-gray-900">
            Change folder
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {/* Navigation (breadcrumb to current browse folder) */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Navigation</span>
              <button
                type="button"
                onClick={() => setBrowseSegments((s) => s.slice(0, -1))}
                disabled={browseSegments.length === 0}
                className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back one level
              </button>
            </div>
            <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-700">
              <button
                type="button"
                onClick={() => setBrowseSegments([])}
                className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-100"
              >
                Mediateca
              </button>
              {browseSegments.map((seg, i) => {
                const isCurrent = i === browseSegments.length - 1;
                return (
                  <span key={`${seg}-${i}`} className="flex items-center gap-1">
                    <span className="text-gray-400">/</span>
                    <button
                      type="button"
                      onClick={() => setBrowseSegments(browseSegments.slice(0, i + 1))}
                      disabled={isCurrent}
                      className={`rounded-md px-2 py-1 ${
                        isCurrent
                          ? "cursor-default bg-white font-semibold text-gray-900"
                          : "text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {formatFolderLabel(seg)}
                    </button>
                  </span>
                );
              })}
            </nav>
          </div>

          {/* New selected folder — only after picking a destination in the table */}
          {selectedDestinationPath != null && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-4">
              <h3 className="text-sm font-semibold text-blue-950">New selected folder</h3>
              <p className="mt-2 break-all font-mono text-xs text-blue-900/90">{selectedDestinationPath}</p>
              <label className="mt-3 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={confirmNewFolder}
                  onChange={(e) => setConfirmNewFolder(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300"
                />
                <span className="text-sm text-gray-800">
                  Select this to confirm the new folder, then use Move file below.
                </span>
              </label>
            </div>
          )}

          {/* Subfolders of current browse path */}
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            {formatFolderLabel(folderName)} — Subfolders
          </h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : (
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-14 px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Pick
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                      Path
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {subfolders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-sm text-gray-500">
                        No subfolders in this folder.
                      </td>
                    </tr>
                  ) : (
                    subfolders.map((f) => {
                      const checked = selectedDestinationPath === f.path;
                      return (
                        <tr key={f.id} className={checked ? "bg-blue-50/80" : "hover:bg-gray-50"}>
                          <td className="px-3 py-3 align-middle">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setSelectedDestinationPath(checked ? null : f.path);
                                setConfirmNewFolder(false);
                              }}
                              className="rounded border-gray-300"
                              aria-label={`Select folder ${f.name}`}
                            />
                          </td>
                          <td className="px-6 py-3">
                            <button
                              type="button"
                              className="text-left text-sm font-medium text-white hover:underline"
                              onClick={() => setBrowseSegments(f.path ? f.path.split("/").filter(Boolean) : [])}
                            >
                              {f.name}
                            </button>
                          </td>
                          <td className="px-6 py-3 font-mono text-sm text-gray-500">{f.path}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmMove()}
            disabled={!selectedDestinationPath || !confirmNewFolder || saving}
            className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Moving…" : "Move file"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeFolderMediaModal;
