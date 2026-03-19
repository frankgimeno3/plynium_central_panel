"use client";

import React, { FC, use, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { getFolders, getMedia, deleteFolder } from "@/app/service/mediatecaService";
import CreateFolderModal from "@/app/logged/pages/mediateca/CreateFolderModal";
import AddFileModal from "@/app/logged/pages/mediateca/AddFileModal";
import DeleteFileConfirmModal from "@/app/logged/pages/mediateca/DeleteFileConfirmModal";
import EditSubfolderModal from "@/app/logged/pages/mediateca/EditSubfolderModal";

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

/** Paths that cannot be edited or deleted (case-insensitive). Must match server list. */
const PROTECTED_FOLDER_PATHS = new Set([
  "structural media",
  "structural media/invoices",
  "structural media/contracts",
  "structural media/proposals",
  "structural media/network media",
  "structural media/production media",
  "structural media/invoices/issued invoices",
  "structural media/invoices/providers invoices",
  "structural media/production media/newsletters media",
  "structural media/production media/publications media",
  "structural media/network media/content media",
  "structural media/network media/directory media",
  "structural media/network media/content media/articles media",
  "structural media/network media/content media/banners media",
  "structural media/network media/content media/events media",
  "structural media/network media/directory media/companies media",
  "structural media/network media/directory media/products media",
  "structural media/network media/directory media/users media",
]);

function isFolderPathProtected(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const normalized = path.trim().toLowerCase();
  return PROTECTED_FOLDER_PATHS.has(normalized);
}

/** Build mediateca URL from path string; encodes each segment so spaces show as %20 in URL. */
function pathToHref(baseHref: string, path: string): string {
  if (!path.trim()) return baseHref;
  const encoded = path.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  return `${baseHref}/${encoded}`;
}

/** Remove trailing consecutive duplicate segments beyond 2 (avoids breadcrumb "loop" when same name is nested). */
function normalizePathSegments(segments: string[]): string[] {
  if (segments.length < 3) return segments;
  const last = segments[segments.length - 1];
  let count = 0;
  for (let i = segments.length - 1; i >= 0 && segments[i] === last; i--) count++;
  if (count <= 2) return segments;
  return segments.slice(0, segments.length - (count - 2));
}

const MediatecaPage: FC<{ params: Promise<{ path?: string[] }> }> = ({ params }) => {
  const router = useRouter();
  const resolved = use(params);
  const rawPath = resolved.path ?? [];
  const decoded = rawPath.map((seg) => {
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  });
  const pathSegments = useMemo(() => normalizePathSegments(decoded), [decoded.join("/")]);
  const currentPath = pathSegments.join("/");

  useEffect(() => {
    if (pathSegments.length < decoded.length) {
      const href = pathSegments.length > 0 ? pathToHref("/logged/pages/mediateca", currentPath) : "/logged/pages/mediateca";
      router.replace(href);
    }
  }, [currentPath, pathSegments.length, decoded.length, router]);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [deleteFileTarget, setDeleteFileTarget] = useState<{ id: string; name: string } | null>(null);
  const [editSubfolderOpen, setEditSubfolderOpen] = useState(false);
  const [subfolders, setSubfolders] = useState<MediatecaFolder[]>([]);
  const [folderContents, setFolderContents] = useState<MediatecaContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  const folderName = useMemo(() => getCurrentFolderName(pathSegments), [pathSegments]);

  const loadData = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const [foldersRes, mediaRes] = await Promise.all([
        getFolders(path),
        getMedia({ folderPath: path }),
      ]);
      setSubfolders(Array.isArray(foldersRes) ? foldersRes : []);
      setFolderContents(Array.isArray(mediaRes) ? mediaRes.map(mapMediaToContent) : []);
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
    loadData(currentPath);
  }, [currentPath, loadData]);

  const baseHref = "/logged/pages/mediateca";
  const breadcrumbs = useMemo(() => {
    const items: { label: string; href?: string }[] = [{ label: "Mediateca", href: baseHref }];
    pathSegments.forEach((seg, i) => {
      const path = pathSegments.slice(0, i + 1).join("/");
      const href = pathToHref(baseHref, path);
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    return items;
  }, [pathSegments]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    const items: { label: string; href?: string }[] = [{ label: "Mediateca", href: baseHref }];
    pathSegments.forEach((seg, i) => {
      const path = pathSegments.slice(0, i + 1).join("/");
      const href = pathToHref(baseHref, path);
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    const isCurrentFolderProtected = pathSegments.length > 0 && isFolderPathProtected(currentPath);
    setPageMeta({
      pageTitle: folderName,
      breadcrumbs: items,
      buttons: [
        ...(pathSegments.length > 0 && !isCurrentFolderProtected
          ? [{ label: "Edit subfolder", href: "#", onClick: () => setEditSubfolderOpen(true) }]
          : []),
        { label: "Create folder", href: "#", onClick: () => setCreateFolderOpen(true) },
        { label: "Add file", href: "#", onClick: () => setAddFileOpen(true) },
      ],
    });
  }, [setPageMeta, folderName, currentPath, pathSegments.length]);

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
    loadData(currentPath);
  };

  const handleAddFileSuccess = () => {
    setAddFileOpen(false);
    loadData(currentPath);
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: MediatecaFolder) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete folder "${folder.name}" and all its contents and subfolders?`)) return;
    setDeletingFolderId(folder.id);
    try {
      await deleteFolder(folder.id);
      loadData(currentPath);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : "Failed to delete folder.";
      setError(message);
    } finally {
      setDeletingFolderId(null);
    }
  };

  return (
    <>
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
      <DeleteFileConfirmModal
        open={!!deleteFileTarget}
        onClose={() => setDeleteFileTarget(null)}
        fileId={deleteFileTarget?.id ?? ""}
        fileName={deleteFileTarget?.name ?? ""}
        onSuccess={() => {
          setDeleteFileTarget(null);
          loadData(currentPath);
        }}
      />
      <EditSubfolderModal
        open={editSubfolderOpen}
        onClose={() => setEditSubfolderOpen(false)}
        folderPath={currentPath}
        folderName={folderName}
        onSuccess={(result) => {
          setEditSubfolderOpen(false);
          if (result.newPath) {
            const href = pathToHref(baseHref, result.newPath);
            router.push(href);
            loadData(result.newPath);
          }
        }}
      />

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden px-6">
          {error && <p className="text-sm text-red-600 mt-4" role="alert">{error}</p>}
          <h2 className=" text-xl text-gray-600 mb-1 uppercase">Subfolders</h2>
        {loading ? (
          <p className="text-sm text-gray-500 py-4">Loading…</p>
        ) : (
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subfolders.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-500">
                    No subfolders in this folder.
                  </td>
                </tr>
              ) : (
                subfolders.map((f) => {
                  const href = pathToHref(baseHref, f.path);
                  const isDeleting = deletingFolderId === f.id;
                  const isProtected = isFolderPathProtected(f.path);
                  return (
                    <tr
                      key={f.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => !isDeleting && router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          if (!isDeleting) router.push(href);
                        }
                      }}
                      className="cursor-pointer hover:bg-blue-50/80 transition-colors focus:outline-none focus:bg-blue-50/80"
                    >
                      <td className="px-6 py-4 text-sm font-medium uppercase text-gray-900">{f.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{f.path}</td>
                      <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                        {!isProtected && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteFolder(e, f)}
                            disabled={isDeleting}
                            className="text-red-500 hover:underline font-medium disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting…" : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full mt-18">
          <div className="bg-white rounded-b-lg overflow-hidden p-6">
          <h2 className=" text-xl text-gray-600 mb-1 uppercase">Contents</h2>
        {loading ? (
          <p className="text-sm text-gray-500 py-4">Loading…</p>
        ) : (
        <div className="w-full min-w-0 overflow-x-auto">
          <table className="w-full min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Thumbnail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publication date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Used in</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {folderContents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">
                    No contents in this folder.
                  </td>
                </tr>
              ) : (
                folderContents.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-10 h-10 rounded border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                        {c.content_type === "image" && c.src ? (
                          <img src={c.src} alt="" className="w-full h-full object-cover" />
                        ) : c.content_type === "json" || c.type === "pdf" ? (
                          <span className="text-red-600 text-xs font-bold">PDF</span>
                        ) : (
                          <span className="text-gray-400 text-xs">img</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">{c.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{c.publishedAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {c.usedIn.length === 0 ? "—" : c.usedIn.join(", ")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/logged/pages/mediateca/asset/${c.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:underline font-medium"
                        >
                          View
                        </a>  
                        <span className="text-gray-300">|</span>
                        <a
                          href={c.src ?? `/logged/pages/mediateca/asset/${c.id}`}
                          download={c.src ? c.name : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-300 hover:underline font-medium"
                        >
                          Download
                        </a>
                        <span className="text-gray-300">|</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteFileTarget({ id: c.id, name: c.name });
                          }}
                          className="text-red-500 hover:underline font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default MediatecaPage;
