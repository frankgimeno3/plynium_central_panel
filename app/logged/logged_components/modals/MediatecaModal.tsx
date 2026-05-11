"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { getFolders, getMedia } from "@/app/service/mediatecaService";
import CreateFolderModal from "@/app/logged/pages/mediateca/CreateFolderModal";
import AddFileModal from "@/app/logged/pages/mediateca/AddFileModal";
import RenameMediaModal from "@/app/logged/pages/mediateca/RenameMediaModal";
import ChangeFolderMediaModal from "@/app/logged/pages/mediateca/ChangeFolderMediaModal";

export type MediatecaFolder = { id: string; name: string; path: string };
export type MediatecaContent = {
  id: string;
  name: string;
  folderPath: string;
  type: "pdf" | "image";
  content_type: "json" | "image";
  publishedAt: string;
  usedIn: string[];
  thumbnailUrl: string | null;
  url?: string | null;
  src: string;
};

type ApiMediaItem = { id: string; name: string; s3Key: string; url?: string; folderPath: string };

function mapMediaToContent(item: ApiMediaItem): MediatecaContent {
  const isPdf = item.name.toLowerCase().endsWith(".pdf");
  const type = isPdf ? "pdf" : "image";
  const content_type = isPdf ? "json" : "image";
  const cloudFront = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  const baseUrl = cloudFront ? `https://${String(cloudFront).replace(/^https?:\/\//, "")}` : "";
  const src = item.url || (baseUrl ? `${baseUrl}/${item.s3Key}` : item.s3Key);
  return {
    id: item.id,
    name: item.name,
    folderPath: item.folderPath,
    type,
    content_type,
    publishedAt: "",
    usedIn: [],
    thumbnailUrl: content_type === "image" ? (item.url || (baseUrl ? `${baseUrl}/${item.s3Key}` : null)) : null,
    url: item.url ?? null,
    src,
  };
}

function getCurrentFolderName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Mediateca";
  return pathSegments[pathSegments.length - 1];
}

function formatFolderLabel(segment: string): string {
  if (!segment) return "Mediateca";
  return segment.replace(/\b\w/g, (char) => char.toUpperCase());
}

interface MediatecaModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, content?: Pick<MediatecaContent, "id" | "name">) => void;
  initialPath?: string;
}

const MediatecaModal: FC<MediatecaModalProps> = ({
  open,
  onClose,
  onSelectImage,
  initialPath = "",
}) => {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [hasInitializedPath, setHasInitializedPath] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [subfolders, setSubfolders] = useState<MediatecaFolder[]>([]);
  const [folderContents, setFolderContents] = useState<MediatecaContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subfolderNameFilter, setSubfolderNameFilter] = useState("");
  const [subfolderPathFilter, setSubfolderPathFilter] = useState("");
  const [contentIdFilter, setContentIdFilter] = useState("");
  const [contentNameFilter, setContentNameFilter] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("");
  const [renameTarget, setRenameTarget] = useState<MediatecaContent | null>(null);
  const [folderTarget, setFolderTarget] = useState<MediatecaContent | null>(null);

  const currentPath = pathSegments.join("/");
  const folderName = useMemo(
    () => getCurrentFolderName(pathSegments),
    [pathSegments]
  );
  const selectedContent =
    selectedContentId != null
      ? folderContents.find((c) => c.id === selectedContentId) ?? null
      : null;

  const filterInputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-950/20";
  const filterLabelClass = "mb-1 block text-xs font-medium uppercase tracking-wide text-gray-500";
  const canUseImage =
    selectedContent != null && selectedContent.content_type === "image";

  const loadData = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const [foldersRes, mediaRes] = await Promise.all([
        getFolders(path),
        getMedia({ folderPath: path }),
      ]);
      setSubfolders(Array.isArray(foldersRes) ? foldersRes : []);
      setFolderContents(
        Array.isArray(mediaRes) ? mediaRes.map(mapMediaToContent) : []
      );
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Failed to load data.";
      setError(message);
      setSubfolders([]);
      setFolderContents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setPathSegments([]);
      setHasInitializedPath(false);
      setSelectedContentId(null);
      return;
    }
    setPathSegments(initialPath ? initialPath.split("/").filter(Boolean) : []);
    setHasInitializedPath(true);
    setSelectedContentId(null);
  }, [open, initialPath]);

  useEffect(() => {
    if (!open || !hasInitializedPath) return;
    loadData(currentPath);
  }, [open, currentPath, hasInitializedPath, loadData]);

  useEffect(() => {
    setSubfolderNameFilter("");
    setSubfolderPathFilter("");
    setContentIdFilter("");
    setContentNameFilter("");
    setContentTypeFilter("");
  }, [currentPath]);

  const filteredSubfolders = useMemo(() => {
    const qName = subfolderNameFilter.trim().toLowerCase();
    const qPath = subfolderPathFilter.trim().toLowerCase();
    return subfolders.filter((f) => {
      if (qName && !(f.name || "").toLowerCase().includes(qName)) return false;
      if (qPath && !(f.path || "").toLowerCase().includes(qPath)) return false;
      return true;
    });
  }, [subfolders, subfolderNameFilter, subfolderPathFilter]);

  const filteredContents = useMemo(() => {
    const qId = contentIdFilter.trim().toLowerCase();
    const qName = contentNameFilter.trim().toLowerCase();
    const qType = contentTypeFilter.trim().toLowerCase();
    return folderContents.filter((c) => {
      if (qId && !(c.id || "").toLowerCase().includes(qId)) return false;
      if (qName && !(c.name || "").toLowerCase().includes(qName)) return false;
      if (qType) {
        // `content_type`: "image" | "json" (pdf). UI displays Image/PDF.
        const isImage = c.content_type === "image";
        if (qType === "image" && !isImage) return false;
        if (qType === "pdf" && isImage) return false;
      }
      return true;
    });
  }, [folderContents, contentIdFilter, contentNameFilter, contentTypeFilter]);

  useEffect(() => {
    if (selectedContentId == null) return;
    if (!filteredContents.some((c) => c.id === selectedContentId)) {
      setSelectedContentId(null);
    }
  }, [filteredContents, selectedContentId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Nested dialogs first (same Escape key): close only the top layer, keep Media Library open.
      if (folderTarget != null) {
        e.preventDefault();
        setFolderTarget(null);
        return;
      }
      if (renameTarget != null) {
        e.preventDefault();
        setRenameTarget(null);
        return;
      }
      if (addFileOpen) {
        e.preventDefault();
        setAddFileOpen(false);
        return;
      }
      if (createFolderOpen) {
        e.preventDefault();
        setCreateFolderOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose, folderTarget, renameTarget, addFileOpen, createFolderOpen]);

  const handleUseImage = () => {
    if (!selectedContent || selectedContent.content_type !== "image") return;
    onSelectImage(selectedContent.src, {
      id: selectedContent.id,
      name: selectedContent.name,
    });
    onClose();
  };

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
    loadData(currentPath);
  };

  const handleAddFileSuccess = () => {
    setAddFileOpen(false);
    loadData(currentPath);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mediateca-modal-title"
      >
        <div
          className="bg-white rounded-xl shadow-xl flex flex-col w-full max-w-4xl max-h-[90vh] mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 shrink-0">
            <h2
              id="mediateca-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              Media Library
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-auto flex-1 min-h-0">
            {error && (
              <p className="mb-4 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {/* Breadcrumb */}
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Navigation
                </span>
                <button
                  type="button"
                  onClick={() => setPathSegments(pathSegments.slice(0, -1))}
                  disabled={pathSegments.length === 0}
                  className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Back one level
                </button>
              </div>
              <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-700">
                <button
                  type="button"
                  onClick={() => setPathSegments([])}
                  className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-100"
                >
                  Mediateca
                </button>
                {pathSegments.map((seg, i) => {
                  const isCurrent = i === pathSegments.length - 1;
                  return (
                    <span key={i} className="flex items-center gap-1">
                      <span className="text-gray-400">/</span>
                      <button
                        type="button"
                        onClick={() => setPathSegments(pathSegments.slice(0, i + 1))}
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

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setCreateFolderOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Create folder
              </button>
              <button
                type="button"
                onClick={() => setAddFileOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Add file
              </button>
            </div>

            {/* Subfolders */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {formatFolderLabel(folderName)} — Subfolders
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500 mb-6">Loading…</p>
            ) : (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="mediateca-subfolder-name" className={filterLabelClass}>
                    Name
                  </label>
                  <input
                    id="mediateca-subfolder-name"
                    type="search"
                    value={subfolderNameFilter}
                    onChange={(e) => setSubfolderNameFilter(e.target.value)}
                    placeholder="Filter by name…"
                    className={filterInputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="mediateca-subfolder-path" className={filterLabelClass}>
                    Path
                  </label>
                  <input
                    id="mediateca-subfolder-path"
                    type="search"
                    value={subfolderPathFilter}
                    onChange={(e) => setSubfolderPathFilter(e.target.value)}
                    placeholder="Filter by path…"
                    className={filterInputClass}
                    autoComplete="off"
                  />
                </div>
              </div>
            <div className="w-full min-w-0 overflow-x-auto mb-6">
              <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Path
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubfolders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-sm text-gray-500"
                      >
                        {subfolders.length === 0
                          ? "No subfolders in this folder."
                          : "No subfolders match these filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredSubfolders.map((f) => (
                      <tr
                        key={f.id}
                        onClick={() =>
                          setPathSegments(f.path ? f.path.split("/") : [])
                        }
                        className="cursor-pointer hover:bg-blue-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">
                          {f.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                          {f.path}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}

            {/* Contents */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Contents
            </h3>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
            <>
              <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label htmlFor="mediateca-content-id" className={filterLabelClass}>
                    ID
                  </label>
                  <input
                    id="mediateca-content-id"
                    type="search"
                    value={contentIdFilter}
                    onChange={(e) => setContentIdFilter(e.target.value)}
                    placeholder="Filter by ID…"
                    className={filterInputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="mediateca-content-name" className={filterLabelClass}>
                    Content name
                  </label>
                  <input
                    id="mediateca-content-name"
                    type="search"
                    value={contentNameFilter}
                    onChange={(e) => setContentNameFilter(e.target.value)}
                    placeholder="Filter by file name…"
                    className={filterInputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label htmlFor="mediateca-content-type" className={filterLabelClass}>
                    Type
                  </label>
                  <select
                    id="mediateca-content-type"
                    value={contentTypeFilter}
                    onChange={(e) => setContentTypeFilter(e.target.value)}
                    className={filterInputClass}
                  >
                    <option value="">All</option>
                    <option value="image">Image</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>
            <div className="w-full min-w-0 overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      Select
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      Thumbnail
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Folder
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredContents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-sm text-gray-500"
                      >
                        {folderContents.length === 0
                          ? "No contents in this folder."
                          : "No contents match these filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredContents.map((c) => {
                      const isImage = c.content_type === "image";
                      const isSelected = selectedContentId === c.id;
                      const isDisabled =
                        isImage && selectedContentId != null && !isSelected;
                      return (
                        <tr
                          key={c.id}
                          className={
                            isSelected
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-4 py-3 align-middle">
                            {isImage ? (
                              <span className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={isDisabled}
                                  title={
                                    isDisabled
                                      ? "Only one item can be selected at the same time"
                                      : undefined
                                  }
                                  onChange={() =>
                                    setSelectedContentId(isSelected ? null : c.id)
                                  }
                                  className="rounded border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                                />
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                              {c.content_type === "image" && c.src ? (
                                <img
                                  src={c.src}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-red-600 text-xs font-bold">
                                  PDF
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-gray-900 font-mono">
                            {c.id}
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="min-w-0 flex-1 truncate font-medium" title={c.name}>
                                {c.name}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameTarget(c);
                                }}
                                className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-800"
                                title="Rename"
                                aria-label="Rename content"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-middle text-sm text-gray-500">
                            {c.content_type === "image" ? "Image" : "PDF"}
                          </td>
                          <td className="max-w-[12rem] px-4 py-3 align-middle text-sm text-gray-600">
                            <div className="flex flex-col justify-center gap-2 sm:max-w-none">
                              <span className="truncate font-mono text-xs text-gray-500" title={c.folderPath || currentPath}>
                                {c.folderPath || currentPath || "—"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderTarget(c);
                                }}
                                className="w-fit rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50"
                              >
                                Change folder
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </>
            )}

            {/* Hint when another image is selected */}
            {selectedContentId != null && (
              <p className="mt-2 text-xs text-gray-500" role="status">
                Only one item can be selected at the same time. Clear selection
                by unchecking to choose another image.
              </p>
            )}
          </div>

          {/* Footer: Cancel + Use Image */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 shrink-0 bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUseImage}
              disabled={!canUseImage}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-950/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Use Image
            </button>
          </div>
        </div>
      </div>

      <CreateFolderModal
        open={createFolderOpen}
        onClose={() => setCreateFolderOpen(false)}
        parentPath={currentPath}
        onSuccess={handleCreateFolderSuccess}
      />
      <AddFileModal
        open={addFileOpen}
        onClose={() => setAddFileOpen(false)}
        folderPath={currentPath}
        onSuccess={handleAddFileSuccess}
      />
      <RenameMediaModal
        open={renameTarget != null}
        onClose={() => setRenameTarget(null)}
        item={renameTarget}
        onSuccess={() => {
          void loadData(currentPath);
          setRenameTarget(null);
        }}
      />
      <ChangeFolderMediaModal
        open={folderTarget != null}
        onClose={() => setFolderTarget(null)}
        mediaId={folderTarget?.id ?? ""}
        fileFolderPath={folderTarget?.folderPath ?? currentPath}
        onSuccess={() => {
          void loadData(currentPath);
          setFolderTarget(null);
        }}
      />
    </>
  );
};

export default MediatecaModal;
