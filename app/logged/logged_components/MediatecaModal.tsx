"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import foldersData from "@/app/contents/mediatecaFolders.json";
import contentsData from "@/app/contents/mediatecaContents.json";
import CreateFolderModal from "@/app/logged/pages/mediateca/CreateFolderModal";
import AddFileModal from "@/app/logged/pages/mediateca/AddFileModal";

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

const folders = foldersData as MediatecaFolder[];
const contents = contentsData as MediatecaContent[];

function getSubfolders(currentPath: string): MediatecaFolder[] {
  const prefix = currentPath ? `${currentPath}/` : "";
  return folders.filter(
    (f) => f.path.startsWith(prefix) && !f.path.slice(prefix.length).includes("/")
  );
}

function getContentsInFolder(currentPath: string): MediatecaContent[] {
  return contents.filter((c) => c.folderPath === currentPath);
}

function getCurrentFolderName(pathSegments: string[]): string {
  if (pathSegments.length === 0) return "Mediateca";
  return pathSegments[pathSegments.length - 1];
}

interface MediatecaModalProps {
  open: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
}

const MediatecaModal: FC<MediatecaModalProps> = ({
  open,
  onClose,
  onSelectImage,
}) => {
  const [pathSegments, setPathSegments] = useState<string[]>([]);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);

  const currentPath = pathSegments.join("/");
  const subfolders = useMemo(() => getSubfolders(currentPath), [currentPath]);
  const folderContents = useMemo(() => getContentsInFolder(currentPath), [
    currentPath,
  ]);
  const folderName = useMemo(
    () => getCurrentFolderName(pathSegments),
    [pathSegments]
  );
  const selectedContent =
    selectedContentId != null
      ? contents.find((c) => c.id === selectedContentId)
      : null;
  const canUseImage =
    selectedContent != null && selectedContent.content_type === "image";

  useEffect(() => {
    if (!open) {
      setPathSegments([]);
      setSelectedContentId(null);
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

  const handleUseImage = () => {
    if (!selectedContent || selectedContent.content_type !== "image") return;
    // Pass the image src (same value as the old "Main Image URL" input)
    onSelectImage(selectedContent.src);
    onClose();
  };

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
  };

  const handleAddFileSuccess = () => {
    setAddFileOpen(false);
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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
            {/* Breadcrumb */}
            <nav className="flex flex-wrap items-center gap-1 text-sm text-gray-600 mb-4">
              <button
                type="button"
                onClick={() => setPathSegments([])}
                className="hover:text-blue-600 hover:underline"
              >
                Mediateca
              </button>
              {pathSegments.map((seg, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="text-gray-400">/</span>
                  <button
                    type="button"
                    onClick={() => setPathSegments(pathSegments.slice(0, i + 1))}
                    className="hover:text-blue-600 hover:underline"
                  >
                    {seg}
                  </button>
                </span>
              ))}
            </nav>

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
              {folderName} — Subfolders
            </h3>
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
                  {subfolders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-4 text-sm text-gray-500"
                      >
                        No subfolders in this folder.
                      </td>
                    </tr>
                  ) : (
                    subfolders.map((f) => (
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

            {/* Contents */}
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Contents
            </h3>
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {folderContents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 text-sm text-gray-500"
                      >
                        No contents in this folder.
                      </td>
                    </tr>
                  ) : (
                    folderContents.map((c) => {
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
                          <td className="px-4 py-3 align-top">
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
                          <td className="px-3 py-3">
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
                          <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                            {c.id}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {c.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {c.content_type === "image" ? "Image" : "PDF"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

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
    </>
  );
};

export default MediatecaModal;
