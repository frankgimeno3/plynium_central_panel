"use client";

import React, { FC, use, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { getFolders, getMedia } from "@/app/service/mediatecaService";
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

const MediatecaPage: FC<{ params: Promise<{ path?: string[] }> }> = ({ params }) => {
  const router = useRouter();
  const resolved = use(params);
  const pathSegments = resolved.path ?? [];
  const currentPath = pathSegments.join("/");

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [addFileOpen, setAddFileOpen] = useState(false);
  const [subfolders, setSubfolders] = useState<MediatecaFolder[]>([]);
  const [folderContents, setFolderContents] = useState<MediatecaContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const href = `${baseHref}/${pathSegments.slice(0, i + 1).join("/")}`;
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    return items;
  }, [pathSegments]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    const items: { label: string; href?: string }[] = [{ label: "Mediateca", href: baseHref }];
    pathSegments.forEach((seg, i) => {
      const href = `${baseHref}/${pathSegments.slice(0, i + 1).join("/")}`;
      items.push({ label: seg, href: i < pathSegments.length - 1 ? href : undefined });
    });
    setPageMeta({
      pageTitle: folderName,
      breadcrumbs: items,
      buttons: [
        { label: "Create folder", href: "#", onClick: () => setCreateFolderOpen(true) },
        { label: "Add file", href: "#", onClick: () => setAddFileOpen(true) },
      ],
    });
  }, [setPageMeta, folderName, currentPath]);

  const handleCreateFolderSuccess = () => {
    setCreateFolderOpen(false);
    loadData(currentPath);
  };

  const handleAddFileSuccess = () => {
    setAddFileOpen(false);
    loadData(currentPath);
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subfolders.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm text-gray-500">
                    No subfolders in this folder.
                  </td>
                </tr>
              ) : (
                subfolders.map((f) => {
                  const href = `${baseHref}/${f.path}`;
                  return (
                    <tr
                      key={f.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                      className="cursor-pointer hover:bg-blue-50/80 transition-colors focus:outline-none focus:bg-blue-50/80"
                    >
                      <td className="px-6 py-4 text-sm font-medium uppercase text-gray-900">{f.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">{f.path}</td>
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
